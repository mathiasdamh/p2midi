let startTime = 0; // Brugt til at få tiden startet ved 0, i stedet for det første time stamp

let timer;
let counter = 0;
let countStartRecord = 0; // når man spiller samtidigt med at man spiller et track
let extraTime = 0.001;
let recording = false;

function startRecordTimer(time){
    counter = 0;
    if(time !== undefined) startTime = time;
    //console.log(startTime);
    recording = true;
    //console.log("starting record timer");
    timer = setInterval(()=>{
        counter += 10;

        if(document.getElementById('currentTime')) document.getElementById('currentTime').innerHTML = "Current time: "+counter;
    } , 10);
}

function stopRecordTimer(){
    //console.log("stopping record timer");
    clearInterval(timer);
    recording = false;
    startTime = 0;
    counter = 0;
    countStartRecord = 0;
}

let activeNotes = []; //notes which have yet to be ended
let noteArray = []; //notes which have been ended
/*  Her indlæses MIDI.js plugin.
 *  Det hele er sat i en funktion for at sørge for at AudioContext ikke
 *  bliver forhindret i at starte, hvis browseren forlanger at en bruger
 *  skal starte handlingen.
 */

function main(){
    // Plugin inlæsning
    MIDI.loadPlugin({
        soundfontUrl: "./FluidR3_GM/",
        instruments: [0,24,56,73,118,107],
        onsuccess: function() {

        }
    });

    /* Web MIDI Api til at lede efter MIDI controllere.
    */
    navigator.requestMIDIAccess()
    .then(onMIDISuccess, onMIDIFailure);

    function onMIDIFailure() {
        console.log('Could not access your MIDI devices.');
    }

    /* Hvis der er nogle, sæt en funktion til at aktivere, når der kommer
    *  en MIDI besked fra controlleren.
    */
    function onMIDISuccess(midiAccess) {
        for (let input of midiAccess.inputs.values()){
            input.onmidimessage = getMIDIMessage;
        }
    }

    /* Denne funktion agere på beskeder fra controlleren, og bruger MIDI.js
    *  til at afspille lyd.
    */
    function getMIDIMessage(midiMessage) {
        if(midiMessage.data[0] >= 128 && midiMessage.data[0] <= 207){
            reactMidiMessage(midiMessage.data[0]%16, midiMessage);
        }
    }
}

function reactMidiMessage(channel, midiMessage){
    switch (midiMessage.data[0]) {
        case 144+channel: // note On channel 1
            if(noteArray.length === 0) {
                countStartRecord = counter;
                startTime = midiMessage.timeStamp;
                if(!recording) startRecordTimer(midiMessage.timeStamp);
            }
            //console.log("noteOn() "+midiMessage.data[1]+", "+midiMessgae.data[2]);
            newNote(midiMessage, activeNotes);
            MIDI.noteOn(0, midiMessage.data[1], midiMessage.data[2]);


            break;
        case 128+channel: // note Off channel 1
            //console.log("noteOff() "+midiMessage.data[1]);
            MIDI.noteOff(0, midiMessage.data[1], 0);
            endNote(midiMessage, activeNotes, noteArray);

            break;
        case 192+channel: // switch program channel 1
            //console.log("switching instrument to "+ MIDI.GM.byId[midiMessage.data[1]].instrument);
            MIDI.programChange(0, midiMessage.data[1]);
            MIDI.loadPlugin({
                instrument: midiMessage.data[1]
            });
        default:
            //console.log("default reaction to midimessage\ngetMidiMessage(midiMessage)");
            //console.log(midiMessage);
            break;
    }
}

function newNote(message, noteArray){ // make a new note (duration will be defined in function endNote)
    let note = {
        midi: message.data[1],
        time: (message.timeStamp+countStartRecord-(startTime)), // {mads} Satte startTime og countStartRecord ind
        duration: undefined
    }
    activeNotes.push(note);

    //console.log(activeNotes[activeNotes.length - 1]);
}

function endNote(message, activeNotes, noteArray){
    for (let i = 0; i < activeNotes.length; i++){ // loop through activeNotes
        if (message.data[1] === activeNotes[i].midi){
            //console.log("starttime: "+activeNotes[i].time);
            activeNotes[i].duration = (message.timeStamp+countStartRecord-(startTime)) - activeNotes[i].time; // {mads} Satte startTime og countStartRecord ind
            noteArray.push(activeNotes.splice(i, 1)[0]); // removing the ended note from activeNotes, and adding to noteArray

        }
    }

    //console.log("endtime: "+(message.timeStamp+countStartRecord-(startTime)));

    updateCurrentTrackData(noteArray.length, (message.timeStamp+countStartRecord-(startTime)));
    //console.log(noteArray.length);
}

function resetNotes(){
    noteArray = [];
    activeNotes = [];
    //console.log("Note arrays reset");
}

function resetTime(){
    startTime = 0;
    //console.log("Time reset");
}

async function createMidiFromTrack(owner, id, name, excludeOwnerInName){
    excludeOwnerInName = excludeOwnerInName || false;
    // tonejs/midi funktioner
    const tempMidi = new Midi();
    const tempTrack = tempMidi.addTrack();

    //console.log("owner: "+owner+"\nid: "+id+"\nname: "+name);

    const data = await getMidiTrackById(owner, id); // await fordi skal bruge værdi fra promise

    // Tilføjer noderne fra den valgte track
    await addNotesFromTrack(tempTrack, data);

    tempMidi.name = name;
    tempTrack.instrument.number = JSON.parse(data).instrument || 0;
    tempTrack.channel = 1;

    // Sender midi data til create midi funktion.
    if(excludeOwnerInName){
        createMidi("", tempMidi, name);
    }else{
        createMidi(owner, tempMidi, name);
    }

    return 0;
}

/* Creates a midi from a song
 */
async function createMidiFromSong(owner, songName, otherName, excludeOwnerInName){
    excludeOwnerInName = excludeOwnerInName || false;
    // tonejs/midi funktioner
    const tempMidi = new Midi();
    tempMidi.name = songName;
    let tempTrack;
    let prevTrack = undefined;

    let dataArray = await getTracksFromSong( getSongByName(owner, songName) );
    let trackData;
    let tChannel = 1;

    //add all notes
    for (let i = 3; i < dataArray.length; i++) {
        tempTrack = tempMidi.addTrack();
        trackData = JSON.parse(dataArray[i]);
        addNotesFromTrack(tempTrack, dataArray[i]);
        tempTrack.instrument.number = trackData.instrument || 0;
        if( prevTrack ){
            if( tempTrack.instrument.number != prevTrack.instrument.number ){
                tChannel++;
            }
        }
        tempTrack.channel = tChannel;
        prevTrack = tempTrack;
    }

    if(excludeOwnerInName){
        owner = "";
    }else{
        owner = owner;
    }

    if(typeof otherName === "string"){
        createMidi(owner, tempMidi, otherName);
    }else{
        createMidi(owner, tempMidi, songName);
    }

    return 0;
}

async function createMidi(owner, midiData, name){
    /*console.log("Creating midi file with name: "+name);
    console.log("Midi data being sent:");
    console.log(midiData);*/
    try {
        let data = JSON.stringify(midiData.toArray()); // Sender dataet i en string til serveren

        const response = await fetch ("newMidiFile", {
            headers:{
                "content-type":"application/json; charset=UTF-8",
                "song-name":name,
                "owner-name":owner
            },
            body: data,
            method:"POST"
        })

    } catch (e) {
        console.log("Error in createMidi("+owner+", "+midiData+", "+name+")");
        console.log(e);
    }
}

async function getMidiData(filePath){
    const midiData = await Midi.fromUrl(filePath);
    return midiData;
};

// Indlæser alle instrumenter fra alle tracks
async function loadInstruments(midiData){
    //console.log("loading instruments");
    //console.log(midiData);
    try {
        for (let i = 0; i < midiData.tracks.length; i++) {
            //console.log("channel: "+midiData.tracks[i].channel+", program: "+midiData.tracks[i].instrument.number);
            // Indlæser selve instrumentet så det kan bruges af midi afspilleren
            MIDI.loadResource({
                instrument: midiData.tracks[i].instrument.number,
                onsuccess: function(){
                    //console.log("loaded instrument: "+midiData.tracks[i].instrument.number);
                }
            });

            // Sørger for at channels har et rigtigt start instrument
            MIDI.programChange(midiData.tracks[i].channel, midiData.tracks[i].instrument.number);
        }
    } catch (e) {
        console.log(e);
        console.log("error in loadInstruments(midiData)");
    } finally {
        //console.log("instruments loaded");
        return 0;
    }
}

/* Læser en fil fra file_path parameteren,
 * så den er klar til at afspille sangen.
 */
async function loadMidiFile(filePath, dontPlayAfterLoad){
    dontPlayAfterLoad = dontPlayAfterLoad || false;
    //console.log(file_path);
    //console.log("start load_file()" + file_path);

    let midi = await getMidiData(filePath);

    //console.log(midi);
    loadInstruments(midi)
    .then(()=>{
        MIDI.Player.loadFile(filePath, () => {
            //console.log("file loaded "+file_path);
            playerEnd = (MIDI.Player.endTime/1000);

            MIDI.Player.addListener(function(data) {
                //console.log(data.now +"/"+data.end+" "+data.channel);
                if(!recording) startRecordTimer();

                if(data.now === data.end) {
                    MIDI.Player.stop();
                    //console.log("end of song, stopping player");
                };
            });
            if(!dontPlayAfterLoad) MIDI.Player.start();
        })
        return 0;
    })
};
