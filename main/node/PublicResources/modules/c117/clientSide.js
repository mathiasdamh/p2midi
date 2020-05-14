/*  ###############################################
 *  ###############################################
 *  #########   Variable og classes     ###########
 * Global varible
 *  Regner med at login systemet bestemmer hvem currentUser er.
 */

let currentUser = "mads" // Bliver brugt til at gemme tracks.
let startTime = 0; // Brugt til at få tiden startet ved 0, i stedet for det første time stamp

// Timer når man spiller musik, counter er variable som timeren bruger.
let timer;
let counter = 0;
let countStartRecord = 0; // når man spiller samtidigt med at man spiller et track
let extraTime = 1;
let recording = false;

let songDisplay = false; // til at vise sange
let trackDisplay = false; // til at vise tracks

// Class til tracks. Gør det muligt at skrive flere egenskaber end bare midi notes.
class midiTrack {
    constructor(name, trackNotes) {
        this.id = -1;
        ( trackNotes !== undefined && trackNotes.length >= 0) ? this.midiNotes = trackNotes : this.midiNotes = [];
        this.name = name;
        this.owner = currentUser;
    };

    // Til at tilføje en eller flere noder
    addNotes(notes){
        if(notes !== undefined){ //Tjek om der er blevet givet en værdifuld parameter
            /* Hvis der tilføjes flere noder vil det være et [[]] array af array.
            *  Derfor (length >= 1) og (typeof === object).
            */
            (notes.length >= 1 && typeof notes[0] === "object") ? notes.forEach((item, i) => {
                for (let j = 0; j < item.length; j++) {
                    if (typeof item[j] !== "number") {
                        console.log("note not a number");
                        return -1;
                    }
                }
                this.midiNotes.push(item);
            })
            : // Og hvis længden er 1, så tjek om det er et object, derefter push.
            (notes.length === 1 || typeof notes === "object") ? this.midiNotes.push(notes) :
             console.log("unexpected input: "+notes);
        }
    };

    resetNotes(){
        this.midiNotes = [];
    }

    set newName(newName){
        this.name = newName;
    }

}

/* ################################################
 * ################################################
 * ################    Test    ####################
 *  Dette er WIP
 */
let testing = true;
let failedTest = 0;
let passedTest = 0;

function test0_midiTrack(){
    let test = new midiTrack("test");

    let expected = "60,60,60";
    let outcome;

    test.addNotes([60,60,60]);

    outcome = test.midiNotes[0].toString();

    if(outcome === expected){
        passedTest += 1;
        return 0;
    }

    failedTest += 1;
    console.log("test0_midiTrack failed\nExpected: "+expected+"\nOutcome: "+outcome);

}
function test1_midiTrack(){
    let test = new midiTrack("test");

    let expected = "62,62,62";
    let outcome;

    test.addNotes([[62,62,62], [61,61,61]]);

    outcome = test.midiNotes[0].toString();

    if(outcome === expected){
        passedTest += 1;
        return 0;
    }

    failedTest += 1;
    console.log("test1_midiTrack failed\nExpected: "+expected+"\nOutcome: "+outcome);

}
function test2_midiTrack(){
    let test = new midiTrack("test");

    let expected = undefined;
    let outcome;

    outcome = test.addNotes("haha");

    if(outcome === expected){
        passedTest += 1;
        return 0;
    }

    failedTest += 1;
    console.log("test1_midiTrack failed\nExpected: "+expected+"\nOutcome: "+outcome);

}

function testAll(){
    test0_midiTrack();
    test1_midiTrack();
    test2_midiTrack();
}
if(testing){
    document.body.onload = testAll();
    console.log("Tests done running\nFailed: "+failedTest+"\nPassed: "+passedTest);
}

/* #################################################
 * #################################################
 * ################ Nicholas' kode #################
 */
let activeNotes = []; //notes which have yet to be ended
let noteArray = []; //notes which have been ended

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

async function sendTrack(track){ // !!!NEEDS REVAMPING!!! for sending the track/file (undecided which) to a server
    newTrack = new midiTrack(document.getElementById('trackName').value, track); // Bruger midiTrack class

    userCheck(newTrack.owner);
    console.log("hallo?");

    console.log("sending track");
    console.log("amount of notes: " + track.length);
    await fetch('musicData', {
        method: "POST",
        body: JSON.stringify(newTrack),
        headers: {
            "Content-Type": "text/javascript"
        }
    }).then(sendTrackOnFulfilled(newTrack), sendTrackOnRejected);
}

function sendTrackOnFulfilled(track){
    console.log("sent track succesfully");
    track.length = 0;
}

function sendTrackOnRejected(error){
    alert("COULD NOT SEND TRACK!!11!!1");
}

/*CREATE A NEW SONG*/

async function createNewSong(userName){
    songName = prompt("What would you like to call the song?");
    console.log("creating new track...");
    await fetch('songs', {
        method: "PUT",
        body: JSON.stringify({user: userName, song: songName}),
        headers: {
            "Content-Type": "text"
        }
    }).then(response => {response.json
    }).then(data => console.log(data));
}

function createNewSongOnFulfilled(songName){
    console.log("Succesfully created a new song with name " + songName);
}

function createNewSongOnRejected(error){
    console.log("Could not create a new song!\n\n" + error);
}

async function appendTrack(trackInfo, songInfo){ //NEEDS UPDATING - what is 'songInfo'?
    await fetch('appendTrack', {
        method: "POST",
        body: JSON.stringify({track: trackInfo, song: songInfo})
    })
}



function userCheck(username){
    fetch ("userCheck", {
        headers:{
            "content-type":"text/plain; charset=UTF-8"
        },
        method: "POST",
        body: username
    });
}

function updateCurrentTrackData(amountOfNotes, duration){
    let p = document.getElementById('currentTrackData');
    p.innerHTML = "Notes: "+amountOfNotes+", duration: "+duration;
}

/*  ##########################################################
 *  ##########################################################
 *  ################### MADS KODE ############################
 */

function removeEmptyLines(array){
    for (i = 0; i < array.length; i++) {
        if(array[i] === ""){
            array.splice(i, 1);
        }
    }
    return array;
}

/* Til at starte timeren der tæller op og kooridnere det med optagning af noder
*/
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
                MIDI.noteOff(0, midiMessage.data[1], midiMessage.data[2]);
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

/* Tilføjer noder til et miditrack fra trackData JSON
*/
async function addNotesFromTrack(midiTrack, trackData){
    try {
        const data = JSON.parse(trackData);
        console.log(data);

        for (let i = 0; i < data.midiNotes.length; i++) {
            midiTrack.addNote({
                midi: data.midiNotes[i].midi,
                time: (data.midiNotes[i].time/1000)+extraTime,
                duration: (data.midiNotes[i].duration/1000)+extraTime
            });
        }
    } catch (e) {
        console.log("Error in addNotesFromTrack("+midiTrack+", "+trackData+")");
        console.log(e);
    }
}

async function addDelayToTrack(owner, id, delay){
    try {
        const res = await fetch("updateTrack", {
            method:"POST",
            body:JSON.stringify({owner:owner,id:id,delay:delay})
        });

    } catch (e) {
        console.log("Error in addDelayToTrack("+owner+", "+id+", "+delay+")");
        console.log(e);
    }

};

/* Funktion til at sende POST request til serveren.
*  Denne vil sende track information til serveren,
*  og derefter vil serveren lave midi filen.
*/
async function createMidi(midiData, name){
    /*console.log("Creating midi file with name: "+name);
    console.log("Midi data being sent:");
    console.log(midiData);*/
    try {
        let data = JSON.stringify(midiData.toArray()); // Sender dataet i en string til serveren

        const response = await fetch ("newMidiFile", {
            headers:{
                "content-type":"application/json; charset=UTF-8",
                "song-name":name,
                "owner-name":currentUser
            },
            body: data,
            method:"POST"
        })

    } catch (e) {
        console.log("Error in createMidi("+midiData+", "+name+")");
        console.log(e);
    }
}

async function getMidiTrackData(owner){
    try {
        userCheck(owner);

        const response = await fetch ("SavedFiles/users/"+owner+"/tracks.txt", {
            headers:{
                "content-type":"application/json; charset=UTF-8"
            },
            method: "GET"
        });
        const data = await response.text();
        return data;
    } catch (e) {
        console.log("Error in getMidiTrackData("+owner+")");
        console.log(e);
    };
}

/* Opdateret version af getMidiTrack
*  Denne bruger searchId til at finde tracken med det id, i owner's track fil
*/
async function getMidiTrackById(owner, searchId){
    try {
        const data = await getMidiTrackData(owner) // await fordi skal bruge værdi fra promise

        let dataSet = removeEmptyLines(data.split("\n"));

        for (let i = 0; i < (dataSet.length); i++) {
            let tempParse = JSON.parse(dataSet[i])
            // Sammenlignings tjek, hvis searchId matcher et i tekstfilen
            if( tempParse.id === searchId ){
                return dataSet[i];
            }
        }
        return -1;
    } catch (e) {
        console.log("Error in getMidiTrackById("+owner+", "+searchId+")");
        console.log(e);
    }
}

/* Stort set det samme som getMidiTrackById men med en sang fil i stedet.
 */
async function getSongByName(owner, songName){
    try {
        userCheck(owner);

        const response = await fetch ("SavedFiles/users/"+owner+"/songs/"+songName+".txt", {
            headers:{
                "content-type":"application/json; charset=UTF-8"
            },
            method: "GET"
        });
        const data = await response.text(); // await fordi skal bruge værdi fra promise

        if (response.status !== 404) {
            return data;
        }
        return -1;
    } catch (e) {
        console.log("Error in getSongByName("+owner+", "+songName+")");
        console.log(e);
    };
}

/* Når man har fået en sang, vil man også gerne have tracks derfra
 */
async function getTracksFromSong(songData){
    let data = await songData;
    let dataArray = removeEmptyLines(data.split('\n'));
    return dataArray;
}

/* Lave en midi fra et track teskt dokument.
*  Bruger getMidiTrackById og createMidi.
*/
async function createMidiFromTrack(owner, id, name){
    // tonejs/midi funktioner
    const tempMidi = new Midi();
    const tempTrack = tempMidi.addTrack();

    //console.log("owner: "+owner+"\nid: "+id+"\nname: "+name);

    const data = await getMidiTrackById(owner, currentUser+id); // await fordi skal bruge værdi fra promise

    // Tilføjer noderne fra den valgte track
    await addNotesFromTrack(tempTrack, data);

    tempMidi.name = name;

    // Sender midi data til create midi funktion.
    createMidi(tempMidi, name);
}

/* Lave en midifil ud fra en sang fil.
 * Tager alle tracks fra sangen og lægger dem i samme midi fil track.
 */
async function createMidiFromSong(owner, songName){
    // tonejs/midi funktioner
    const tempMidi = new Midi();
    const tempTrack = tempMidi.addTrack();

    userCheck(currentUser);

    let dataArray = await getTracksFromSong( getSongByName(owner, songName) );
    let trackData;

    //add all notes
    for (let i = 0; i < dataArray.length; i++) {
        trackData = JSON.parse(dataArray[i]);
        addNotesFromTrack(tempTrack, dataArray[i]);
    }

    tempTrack.name = songName;
    createMidi(tempMidi, songName);
}

async function deleteTrack(owner, id){
    try {
        const res = await fetch ("deleteTrack", {
            method: "DELETE",
            headers:{
                "owner-name":owner
            },
            body: id,
        });
        console.log(res.status);
        return res;
    } catch (e) {
        console.log("Error in deleteTrack("+owner+", "+id+")");
        console.log(e);
    }
}



/* ###################################################
 * ###################################################
 * #################  KNAPPER  #######################
 */
async function btnSendTrack(){ // Sender en track
    await sendTrack(noteArray)
    .then(res=>{
        if(trackDisplay) displayTracks();
        updateTrackData();
    })
}

async function btnCreateMidi(){ // Laver midi fil
    let trackID = document.getElementById('trackId').value;

    const data = await getMidiTrackById(currentUser, currentUser+trackID)

    console.log(data);

    let trackName = JSON.parse(data).name;

    createMidiFromTrack(currentUser, trackID, trackName);
}

function btnResetRecord(){ // Resetter start tid, og note arrays
    startTime = 0;
    noteArray = [];
    activeNotes = [];
    stopRecordTimer();
    document.getElementById('currentTime').innerHTML = "Current time: 0";
    updateCurrentTrackData(noteArray.length, 0)
    console.log("note arrays and startTime reset");
}

async function btnAppendTrack(){
    let q = document.getElementById('trackId');
    let p = document.getElementById('trackOwner');
    let s = document.getElementById('songName');
    let r = document.getElementById('songOwner');

    const data = await getMidiTrackById(p.value, p.value+q.value);

    let trackData = JSON.parse(data);

    await appendTrack({owner:trackData.owner,id:trackData.id}, {owner:r.value,name:s.value})
    .then(res=>{
        console.log("appended "+trackData.name+"(id: "+trackData.id+") to "+r.value+"\'s song: "+s.value);

        updateSongData();
    });
}

async function btnAppendTrack(){
    let q = document.getElementById('trackId');
    let p = document.getElementById('trackOwner');
    let s = document.getElementById('songName');
    let r = document.getElementById('songOwner');

    const data = await getMidiTrackById(p.value, p.value+q.value);

    let trackData = JSON.parse(data);

    await appendTrack({owner:trackData.owner,id:trackData.id}, {owner:r.value,name:s.value})
    .then(res=>{
        console.log("appended "+trackData.name+"(id: "+trackData.id+") to "+r.value+"\'s song: "+s.value);

        updateSongData();
    });
}

function btnCreateSong(){
    createNewSong(currentUser);
    console.log(songDisplay);
    if(songDisplay) displaySongFiles();
};

function btnDeleteSong(){
    let p = document.getElementById('songName');
    fetch("deleteSong", {
        method:"DELETE",
        headers:{
            "owner-name":currentUser
        },
        body:p.value
    }).then(res=>{
        displaySongFiles();
    })
    console.log("deleted song: "+p.value);
}

function btnCreateMidiSong(){
    let p = document.getElementById('songName');
    let q = document.getElementById('songOwner');
    createMidiFromSong(q, p);
}

function btnShowSongs(){
    let list = document.getElementById('songFiles');
    if(songDisplay){
        while (list.hasChildNodes()) {
            list.removeChild(list.childNodes[0]);
        }
        songDisplay = !songDisplay;
    }else {
        displaySongFiles();
        songDisplay = !songDisplay;
    }
}

function btnShowTracks(){
    let list = document.getElementById('trackList');
    if(trackDisplay){
        while (list.hasChildNodes()) {
            list.removeChild(list.childNodes[0]);
        }
        trackDisplay = !trackDisplay;
    }else {
        displayTracks();
        trackDisplay = !trackDisplay;
    }
}

async function btnPlayTrack(){
    const tempMidi = new Midi();
    const tempTrack = tempMidi.addTrack();

    let q = document.getElementById('trackId');

    userCheck(currentUser);

    const tData = await getMidiTrackById(currentUser, q.value);

    createMidiFromTrack(currentUser, q.value, "tempmidi").then(()=>{

    MIDI.Player.loadFile("SavedFiles/midi/"+currentUser+"_tempmidi.mid", () => {
        MIDI.Player.addListener(function(data) {
            console.log(data.now +"/"+data.end+" "+data.channel);

            if(!recording){
                startRecordTimer(0);
            }

            if(data.now === data.end) {
                MIDI.Player.stop();
                console.log("end of song, stopping player");
            };
        });
        MIDI.Player.start();
        });
    }); //.then
}

function btnStop(){
    MIDI.Player.stop();
    stopRecordTimer();
}

function btnDeleteTrack(){
    let q = document.getElementById('trackId');

    deleteTrack(currentUser, currentUser+q.value)
    .then( ()=>{
        displayTracks();
        updateTrackData();
    });
}

function btnDelayTrack(){
    let q = document.getElementById('trackId');
    let p = document.getElementById('delayDuration');

    addDelayToTrack(currentUser, currentUser+q.value, Number.parseFloat(p.value))
    .then(()=>{
        updateTrackData();
        console.log("Delayed track "+q.value+" by "+p.value+" miliseconds");
    });
}
/* #######################################################
 * #######################################################
 * ###############    NICE TO HAVES    ###################
 */
// Viser track information når man skriver Id i feltet.
document.getElementById('trackId').onchange = updateTrackData;

async function updateTrackData(){
    let p = document.getElementById('trackIdValue');
    let q = document.getElementById('trackId');
    if(q.value !== undefined && q.value !== ""){
        const data = await getMidiTrackById(currentUser, currentUser+q.value);

        if (data === undefined || data === -1){
            p.innerHTML = "No track found with Id: "+currentUser+q.value;
        }else{
            const trackData = JSON.parse(data);
            p.innerHTML = ("Name: "+trackData.name);
            p.innerHTML += ("\rDuration: "+ getTrackDuration(trackData));
        }
    }
}

function getTrackDuration(track){
    if(track.midiNotes !== undefined && track.midiNotes.length > 0){
        let tLength = track.midiNotes.length;
        let tTime = track.midiNotes[tLength-1].time;
        let tDuration = track.midiNotes[tLength-1].duration;

        return tTime + tDuration;
    }
    return -1;
}

async function updateSongData(){
    let p = document.getElementById('songNameValue');
    let q = document.getElementById('songName');
    let s = document.getElementById('songOwner');
    const data = await getSongByName(s.value, q.value);

    if (typeof data !== "string"){
        p.innerHTML = "not a song";
    }else{
        let dataSplit = data.split('\n');

        let topData = data.split('\n').splice(0, 3);
        console.log(topData);

        let trackData = data.split('\n').splice(3, dataSplit.length-5); // -5 fordi to tomme strenge og tre info
        console.log(trackData);

        p.innerHTML = "";

        for (var i = 0; i < 4; i++) {
            if(i>2){
                p.innerHTML += "tracks: "+trackData.length;
            }else{
                p.innerHTML += topData[i] +", ";
            }
        }
    }
}

// Viser sang data hvis der er en sang med den songOwner og songName
document.getElementById('songName').onchange = updateSongData;

// Skriver noget html
document.getElementById('songOwner').value = currentUser;
document.getElementById('trackOwner').value = currentUser;

// viser sang filer
async function displaySongFiles(){
    const res = await fetch("songFilesDir",{
        method:"POST",
        body:currentUser
    })
    const data = await res.text();
    console.log(data);
    let fileDir = JSON.parse(data);

    let element;
    let dlPath;
    let songFilesElement = document.getElementById('songFiles');
    songFilesElement.innerHTML = ""

    for (let i = 0; i < fileDir.length; i++) {
        elementLI = document.createElement('li');
        elementLI.innerHTML = fileDir[i].slice(0, -4);

        songFilesElement.appendChild(elementLI);
    }
}

async function displayTracks(){
    const data = await getMidiTrackData(currentUser);

    console.log(trackDisplay);

    let LIelement;
    let ULelement = document.getElementById('trackList');
    let parsedData;

    ULelement.innerHTML = "";

    let trackArr = data.split('\n');
    for (var i = 0; i < trackArr.length; i++) {
        if(trackArr[i] !== undefined && trackArr[i] !== ""){
            LIelement = document.createElement('li');

            parsedData = JSON.parse(trackArr[i]);

            LIelement.innerHTML = parsedData.name;
            LIelement.innerHTML += ", notes: "+parsedData.midiNotes.length;
            LIelement.innerHTML += ", ID: "+parsedData.id;

            ULelement.appendChild(LIelement);
        };
        console.log("one loop in trackDisplay");
    }
    console.log("end trackDisplay");
}

// Tilføjelse af event listerners
document.getElementById('btnStart').addEventListener("click", main);
document.getElementById('btnSendTrack').addEventListener("click", btnSendTrack);
document.getElementById('btnCreateMidi').addEventListener("click", btnCreateMidi);
document.getElementById('btnResetRecord').addEventListener("click", btnResetRecord);
document.getElementById('btnAppendTrack').addEventListener("click", btnAppendTrack);
document.getElementById('btnCreateSong').addEventListener("click", btnCreateSong);
document.getElementById('btnCreateMidiSong').addEventListener("click", btnCreateMidiSong);
document.getElementById('btnPlayTrack').addEventListener("click", btnPlayTrack);
document.getElementById('btnStop').addEventListener("click", btnStop);
document.getElementById('btnShowSongs').addEventListener("click", btnShowSongs);
document.getElementById('btnShowTracks').addEventListener("click", btnShowTracks);
document.getElementById('btnDeleteSong').addEventListener("click", btnDeleteSong);
document.getElementById('btnDeleteTrack').addEventListener("click", btnDeleteTrack);
document.getElementById('btnDelayTrack').addEventListener("click", btnDelayTrack);
