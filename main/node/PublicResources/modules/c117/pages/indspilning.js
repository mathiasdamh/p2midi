document.body.onload = main;

let currentUser = "mads" // Bliver brugt til at gemme tracks.

let trackDisplay = false; // For displaying tracks
let trackOtherDisplay = false; // For displaying other tracks
let songDisplay = false; // For displaying songs

// Viser track information når man skriver Id i feltet.
document.getElementById('trackId').onchange = updateTrackData;
// Viser sang data hvis der er en sang med den songOwner og songName
document.getElementById('songName').onchange = updateSongData;

// Skriver noget html
document.getElementById('songOwner').value = currentUser;
/*document.getElementById('trackOwner').value = currentUser; */

/* When playing, this function updates amount of notes and duration
*/
function updateCurrentTrackData(amountOfNotes, duration){
    let trackPlayInfo = document.getElementById('currentTrackData');
    trackPlayInfo.innerHTML = "Notes: "+amountOfNotes+", duration: "+duration;
}

function changeChannelInstrument(){
    MIDI.programChange(0, document.getElementById('instrument').value);
}

document.getElementById('instrument').onchange = changeChannelInstrument;

/* Updates information about the current entered track
*/
async function updateTrackData(){
    let trackIdInfo = document.getElementById('trackIdValue');
    let trackId = document.getElementById('trackId').value;
    let otherUsername = undefined;
    if(document.getElementById('otherUsername')){
        otherUsername = document.getElementById('otherUsername').value;
    }
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

function switchUser(newUser){
    currentUser = newUser;
    if(songDisplay) displaySongFiles();
    if(trackDisplay) displayTracks();
    updateTrackData();
    updateSongData();
}

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

function btnResetRecord(){ // Resetter start tid, og note arrays
    resetTime();
    resetNotes();

    stopRecordTimer();
    document.getElementById('currentTime').innerHTML = "Current time: 0";
    updateCurrentTrackData(noteArray.length, 0)
}

async function btnPlayTrack(){
    let trackId = document.getElementById('trackId').value;
    let otherUsername = undefined;
    if(document.getElementById('otherUsername')){
        otherUsername = document.getElementById('otherUsername').value;
    }
    let user = await getValidUser(currentUser, otherUsername, trackId);

    //console.log("user: "+user+", trackId: "+trackId);

    createMidiFromTrack(user, trackId, "tempmidi", true).then(()=>{

        loadMidiFile("SavedFiles/midi/_tempmidi.mid")
        .then(()=>{
        })
    }); //.then
}

function btnStop(){
    MIDI.Player.stop();
    stopRecordTimer();
}

async function btnPlaySong(){
    let songName = document.getElementById('songName').value;
    let songOwner = document.getElementById('songOwner').value;
    let otherUsername = undefined;
    if(document.getElementById('otherUsername')){
        otherUsername = document.getElementById('otherUsername').value;
    }
    let user = await getValidSongUser(songOwner, otherUsername, songOwner, songName);

    createMidiFromSong(user, songName, "tempmidi", true).then(()=>{

        loadMidiFile("SavedFiles/midi/_tempmidi.mid")
        .then(()=>{
        })
    });
}

// Tilføjelse af event listerners
document.getElementById('btnSendTrack').addEventListener("click", btnSendTrack);
document.getElementById('btnResetRecord').addEventListener("click", btnResetRecord);
document.getElementById('btnPlaySong').addEventListener("click", btnPlaySong);
document.getElementById('btnPlayTrack').addEventListener("click", btnPlayTrack);
document.getElementById('btnStop').addEventListener("click", btnStop);
