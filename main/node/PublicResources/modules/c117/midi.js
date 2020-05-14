let startTime = 0; // Brugt til at få tiden startet ved 0, i stedet for det første time stamp

let timer;
let counter = 0;
let countStartRecord = 0; // når man spiller samtidigt med at man spiller et track
let extraTime = 1;
let recording = false;

let activeNotes = []; //notes which have yet to be ended
let noteArray = []; //notes which have been ended
/*  Her indlæses MIDI.js plugin.
 *  Det hele er sat i en funktion for at sørge for at AudioContext ikke
 *  bliver forhindret i at starte, hvis browseren forlanger at en bruger
 *  skal starte handlingen.
 */
function main(){
     // Fjerner start knappen så man ikke kan starte flere af gangen.
    document.getElementById('btnStart').parentNode.removeChild(document.getElementById('btnStart'));

    // Plugin inlæsning
    MIDI.loadPlugin({
        soundfontUrl: "./FluidR3_GM/",
        instrument: 0,
        onsuccess: function() { }
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

        var inputs = midiAccess.inputs;   // Input controllere
        var outputs = midiAccess.outputs; // Output controllere
    }

    /* Denne funktion agere på beskeder fra controlleren, og bruger MIDI.js
    *  til at afspille lyd.
    */
    function getMIDIMessage(midiMessage) {
        switch (midiMessage.data[0]) {
            case 144: // note On channel 1
                if(noteArray.length === 0) {
                    countStartRecord = counter;
                    startTime = midiMessage.timeStamp;
                    if(!recording) startRecordTimer(midiMessage.timeStamp);
                }
                //console.log("noteOn() "+midiMessage.data[1]+", "+midiMessgae.data[2]);
                newNote(midiMessage, activeNotes);
                MIDI.noteOn(0, midiMessage.data[1], midiMessage.data[2]);


                break;
            case 128: // note Off channel 1
                //console.log("noteOff() "+midiMessage.data[1]);
                MIDI.noteOff(0, midiMessage.data[1], 0);
                endNote(midiMessage, activeNotes, noteArray);

                break;
            case 192: // switch program channel 1
                console.log("switching instrument to "+ MIDI.GM.byId[midiMessage.data[1]].instrument);
                MIDI.programChange(0, midiMessage.data[1]);
                MIDI.loadPlugin({
                    instrument: midiMessage.data[1]
                });
            default:
                console.log("default reaction to midimessage\ngetMidiMessage(midiMessage)");
                console.log(midiMessage);
                break;
        }
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
            console.log("starttime: "+activeNotes[i].time);
            activeNotes[i].duration = (message.timeStamp+countStartRecord-(startTime)) - activeNotes[i].time; // {mads} Satte startTime og countStartRecord ind
            noteArray.push(activeNotes.splice(i, 1)[0]); // removing the ended note from activeNotes, and adding to noteArray
        }
    }

    console.log("endtime: "+(message.timeStamp+countStartRecord-(startTime)));

    updateCurrentTrackData(noteArray.length, (message.timeStamp+countStartRecord-(startTime)));
    //console.log(noteArray.length);
}

function resetNotes(){
    noteArray = [];
    activeNotes = [];
    console.log("Note arrays reset");
}

function resetTime(){
    startTime = 0;
    console.log("Time reset");
}

async function createMidiFromTrack(owner, id, name){
    // tonejs/midi funktioner
    const tempMidi = new Midi();
    const tempTrack = tempMidi.addTrack();

    //console.log("owner: "+owner+"\nid: "+id+"\nname: "+name);

    const data = await getMidiTrackById(owner, id); // await fordi skal bruge værdi fra promise

    // Tilføjer noderne fra den valgte track
    await addNotesFromTrack(tempTrack, data);

    tempMidi.name = name;
    tempTrack.instrument = JSON.parse(data).instrument || 0;

    // Sender midi data til create midi funktion.
    createMidi(owner, tempMidi, name);
}

/* Creates a midi from a song
 */
async function createMidiFromSong(owner, songName, otherName){
    // tonejs/midi funktioner
    const tempMidi = new Midi();
    const tempTrack = tempMidi.addTrack();

    let dataArray = await getTracksFromSong( getSongByName(owner, songName) );
    let trackData;

    //add all notes
    for (let i = 3; i < dataArray.length; i++) {
        trackData = JSON.parse(dataArray[i]);
        addNotesFromTrack(tempTrack, dataArray[i]);
    }

    console.log("song created");

    tempMidi.name = songName;
    if(typeof otherName === "string"){
        createMidi(owner, tempMidi, otherName);
    }else{
        createMidi(owner, tempMidi, songName);
    }

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

function startRecordTimer(time){
    counter = 0;
    if(time !== undefined) startTime = time;
    console.log(startTime);
    recording = true;
    console.log("starting record timer");
    timer = setInterval(()=>{
        counter += 100;

        document.getElementById('currentTime').innerHTML = "Current time: "+counter;
    } , 100);
}

function stopRecordTimer(){
    console.log("stopping record timer");
    clearInterval(timer);
    recording = false;
    startTime = 0;
    counter = 0;
    countStartRecord = 0;
}
