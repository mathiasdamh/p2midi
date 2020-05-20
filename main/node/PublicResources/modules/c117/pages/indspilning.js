document.body.onload = main;

let currentUser = "mads" // Bliver brugt til at gemme tracks.

let trackDisplay = false; // For displaying tracks
let trackOtherDisplay = false; // For displaying other tracks
let songDisplay = false; // For displaying songs

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

// Tilføjelse af event listerners
document.getElementById('btnSendTrack').addEventListener("click", btnSendTrack);
document.getElementById('btnResetRecord').addEventListener("click", btnResetRecord);
