document.body.onload = main;

let currentUser = "mads" // Bliver brugt til at gemme tracks.

let trackDisplay = false; // For displaying tracks
let trackOtherDisplay = false; // For displaying other tracks
let songDisplay = false; // For displaying songs
/* Updates information about the current entered track
*/
async function updateTrackData(){
    let trackIdInfo = document.getElementById('trackIdValue');
    let trackId = document.getElementById('trackId').value;
    let otherUsername = document.getElementById('otherUsername').value;
    let data;
    let user;
    if(trackId !== undefined && trackId !== ""){
        user = await getValidUser(currentUser, otherUsername, trackId);
        if(user !== -1){
            data = await getMidiTrackById(user, trackId);
        }else{
            data = await getMidiTrackById(currentUser, trackId);
        }

        if (data === undefined || data === -1){
            trackIdInfo.innerHTML = "No track found with Id: "+trackId;
        }else{
            const trackData = JSON.parse(data);
            trackIdInfo.innerHTML = ("Name: "+trackData.name);
            trackIdInfo.innerHTML += ("\rDuration: "+ getTrackDuration(trackData));
        }
    }
}

/* When playing, this function updates amount of notes and duration
*/
function updateCurrentTrackData(amountOfNotes, duration){
    let trackPlayInfo = document.getElementById('currentTrackData');
    trackPlayInfo.innerHTML = "Notes: "+amountOfNotes+", duration: "+duration;
}

/* Shows a list of all the current users tracks
*/
async function displayTracks(){
    const data = await getMidiTrackData(currentUser);

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
    }
}

async function displayOtherTracks(){
    let otherUser = document.getElementById('otherUsername').value;
    const data = await getMidiTrackData(otherUser);

    let LIelement;
    let ULelement = document.getElementById('trackListOther');
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
    }
}


async function updateSongData(){
    let songNameInfo = document.getElementById('songNameValue');
    let songName = document.getElementById('songName').value;
    let songOwner = document.getElementById('songOwner').value;
    const data = await getSongByName(songOwner, songName);

    if (typeof data !== "string"){
        songNameInfo.innerHTML = "Counldn\'t find song";
    }else{
        let dataSplit = removeEmptyLines(data.split('\n'));

        let topData = removeEmptyLines(data.split('\n')).splice(0, 3);

        let trackData = removeEmptyLines(data.split('\n')).splice(3, dataSplit.length-3); // -5 fordi to tomme strenge og tre info

        songNameInfo.innerHTML = "";

        for (var i = 0; i < 4; i++) {
            if(i>2){
                songNameInfo.innerHTML += "tracks: "+trackData.length;
            }else{
                songNameInfo.innerHTML += topData[i] +", ";
            }
        }
    }
}

async function displaySongFiles(){
    const res = await fetch("songFilesDir",{
        method:"POST",
        body:currentUser
    })
    const data = await res.text();
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

function switchUser(newUser){
    currentUser = newUser;
    if(songDisplay) displaySongFiles();
    if(trackDisplay) displayTracks();
    updateTrackData();
    updateSongData();
}

async function getValidUser(current, other, trackId){
    let currentRes = await getMidiTrackById(current, trackId);
    let otherRes = await getMidiTrackById(other, trackId);

    if( (currentRes+otherRes) === -2){
        //console.log("Not valid users for trackId: "+current+", "+other);
        return -1;
    }else if(currentRes === -1){
        return other;
    }else{
        return current;
    }
}

async function getValidSongUser(current, other, songOwner, songName){
    let currentRes = await getSongByName(songOwner, songName);
    let otherRes = await getSongByName(songOwner, songName);

    if( (currentRes+otherRes) === -2){
        //console.log("Not valid user: "+current+", "+other);
        return -1;
    }else if(currentRes === -1){
        return other;
    }else{
        return current;
    }
}




// Viser track information når man skriver Id i feltet.
document.getElementById('trackId').onchange = updateTrackData;
// Viser sang data hvis der er en sang med den songOwner og songName
document.getElementById('songName').onchange = updateSongData;

function changeChannelInstrument(){
    MIDI.programChange(0, document.getElementById('instrument').value);
}

document.getElementById('instrument').onchange = changeChannelInstrument;

// Skriver noget html
document.getElementById('songOwner').value = currentUser;
document.getElementById('trackOwner').value = currentUser;

/* ###################################################
 * ###################################################
 * #################  KNAPPER  #######################
 */
async function btnSendTrack(){ // Sender en track
    let trackName = document.getElementById('trackName').value;
    await sendTrack(currentUser, trackName, noteArray)
    .then(res=>{
        if(trackDisplay) displayTracks();
        updateTrackData();
    })
}

async function btnCreateMidi(){ // Laver midi fil
    let trackID = document.getElementById('trackId').value;
    let otherUsername = document.getElementById('otherUsername').value;
    let user = await getValidUser(currentUser, otherUsername, trackID);

    const data = await getMidiTrackById(user, trackID)

    let trackName = JSON.parse(data).name;

    createMidiFromTrack(user, trackID, trackName);
}

function btnResetRecord(){ // Resetter start tid, og note arrays
    resetTime();
    resetNotes();

    stopRecordTimer();
    document.getElementById('currentTime').innerHTML = "Current time: 0";
    updateCurrentTrackData(noteArray.length, 0)
}

async function btnAppendTrack(){
    let trackId = document.getElementById('trackId').value;
    let trackOwner = document.getElementById('trackOwner').value;
    let songName = document.getElementById('songName').value;
    let songOwner = document.getElementById('songOwner').value;

    const data = await getMidiTrackById(trackOwner, trackId);

    let trackData = JSON.parse(data);

    await appendTrack(trackOwner, trackId, songOwner, songName, currentUser)
    .then(res=>{
        //console.log("Sent append request for "+trackData.name+"(id: "+trackData.id+") to "+songOwner+"\'s song: "+songName);

        updateSongData();
    });
}

function btnCreateSong(){
    let newSongName = document.getElementById('newSongName').value;

    createNewSong(currentUser, newSongName)
    .then(()=>{
        if(songDisplay) displaySongFiles();
    });
};

function btnDeleteSong(){
    let songName = document.getElementById('songName').value;
    deleteSong(currentUser, songName);
}

function btnCreateMidiSong(){
    let songName = document.getElementById('songName').value;
    let songOwner = document.getElementById('songOwner').value;
    createMidiFromSong(songOwner, songName);
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

function btnShowOtherTracks(){
    let list = document.getElementById('trackListOther');
    if(trackOtherDisplay){
        while (list.hasChildNodes()) {
            list.removeChild(list.childNodes[0]);
        }
        trackOtherDisplay = !trackOtherDisplay;
    }else {
        displayOtherTracks();
        trackOtherDisplay = !trackOtherDisplay;
    }
}

async function btnPlayTrack(){
    let trackId = document.getElementById('trackId').value;
    let otherUsername = document.getElementById('otherUsername').value;
    let user = await getValidUser(currentUser, otherUsername, trackId);

    //console.log("user: "+user+", trackId: "+trackId);

    createMidiFromTrack(user, trackId, "tempmidi").then(()=>{

        load_file("SavedFiles/midi/"+user+"_tempmidi.mid")
        .then(()=>{
        })
    }); //.then
}

async function btnPlaySong(){
    let songName = document.getElementById('songName').value;
    let songOwner = document.getElementById('songOwner').value;
    let otherUsername = document.getElementById('otherUsername').value;
    let user = await getValidSongUser(songOwner, otherUsername, songOwner, songName);

    createMidiFromSong(user, songName, "tempmidi").then(()=>{

        load_file("SavedFiles/midi/"+user+"_tempmidi.mid")
        .then(()=>{
            MIDI.Player.start();
        })
    });
}

/*
async function playMidiFile(filePath){
    MIDI.Player.loadFile(filePath, () => {
        MIDI.Player.addListener(function(data) {
            //console.log(data.now +"/"+data.end+" "+data.channel);

            if(!recording){
                startRecordTimer(0);
            }

            if(data.now === data.end) {
                MIDI.Player.stop();
                //console.log("End of song, stopping player");
            };
        });
        MIDI.Player.start();
    });
}
*/

function btnStop(){
    MIDI.Player.stop();
    stopRecordTimer();
}

function btnDeleteTrack(){
    let trackId = document.getElementById('trackId').value;

    deleteTrack(currentUser, trackId)
    .then( ()=>{
        displayTracks();
        updateTrackData();
    });
}

function btnDelayTrack(){
    let trackId = document.getElementById('trackId').value;
    let delay = document.getElementById('delayDuration').value;

    addDelayToTrack(currentUser, trackId, Number.parseFloat(delay))
    .then(()=>{
        updateTrackData();
        //console.log("Delayed track "+trackId+" by "+delay+" miliseconds");
    });
}

async function btnCheckSuggestions(){
    let suggestions = await getSuggestions(currentUser);
    let suggestionsArr = removeEmptyLines(suggestions.split("\n"));

    let suggestionList = document.getElementById("suggestionList");

    suggestionList.innerHTML = "";

    for (var i = 0; i < suggestionsArr.length; i++) {
        let tempSplit = suggestionsArr[i].split("|");
        let suggestTrack = JSON.parse(tempSplit[3]);
        let trackName = suggestTrack.name;
        let trackId = suggestTrack.id;
        let LIelement = document.createElement("li");
        LIelement.innerHTML = "From "+tempSplit[2]+", suggesting "+tempSplit[1]+"\'s track: \""+trackName+"\" to your song: "+tempSplit[0]+"   ";

        let acceptButton = document.createElement("input");
        acceptButton.setAttribute("type", "button");
        acceptButton.setAttribute("value", "Accept");
        acceptButton.onclick = function(){
            acceptSuggestion(currentUser, tempSplit[0], trackId);
            LIelement.parentNode.removeChild(LIelement);
        }
        let rejectButton = document.createElement("input");
        rejectButton.setAttribute("type", "button");
        rejectButton.setAttribute("value", "Reject");
        rejectButton.onclick = function(){
            rejectSuggestion(currentUser, tempSplit[0], trackId);
            LIelement.parentNode.removeChild(LIelement);
        }
        LIelement.appendChild(acceptButton);
        LIelement.appendChild(rejectButton);

        suggestionList.appendChild(LIelement);
    }
}

// Tilføjelse af event listerners
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
document.getElementById('btnShowOtherTracks').addEventListener("click", btnShowOtherTracks);
document.getElementById('btnPlaySong').addEventListener("click", btnPlaySong);
document.getElementById('btnCheckSuggestions').addEventListener("click", btnCheckSuggestions);
