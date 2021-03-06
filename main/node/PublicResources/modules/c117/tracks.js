/* Class for tracks
*/
class midiTrack {
    constructor(name, trackNotes, owner, instrument) {
        this.id = undefined;
        ( trackNotes !== undefined && trackNotes.length >= 0) ? this.midiNotes = trackNotes : this.midiNotes = [];
        this.name = name;
        this.owner = owner;
        this.instrument = instrument || 0;
    };
}

/* Sends track data to the server
*/
async function sendTrack(owner, trackName, notes){ // !!!NEEDS REVAMPING!!! for sending the track/file (undecided which) to a server
    if(checkIllegalChars(trackName)) return -1;

    newTrack = new midiTrack(trackName, notes, owner, MIDI.getInstrument(0)); // Bruger midiTrack class

    await fetch('musicData', {
        method: "POST",
        body: JSON.stringify(newTrack),
        headers: {
            "Content-Type": "text/javascript"
        }
    }).then(res => {
        return res.text();
    }).then(res => {
        writeErrorInHTML(res);
        return res;
    }).catch(err => {
        alert("Could not send track\n"+err);
    });
}

/* Uses fetch to retrieve all tracks from owner
*/
async function getMidiTrackData(owner){
    try {
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
        writeErrorInHTML("", e)
    };
}

/* Uses getMidiTrackData with a searchId to return a specific track
*/
async function getMidiTrackById(owner, searchId){
    try {
        if(owner == undefined) return -1;
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
        writeErrorInHTML("", e)
        return e;
    }
}

/* Adds a track to a song
*/
async function appendTrack(trackOwner, trackID, songOwner, songName, user){ //Append a track to a song. trackInfo = {owner: "userName", id: "ID"}, songInfo = {owner: "userName2", name: "songName"}
    await fetch('appendTrack', {
        method: "POST",
        body: JSON.stringify({
            trackOwner: trackOwner,
            trackID: trackID,
            songOwner: songOwner,
            songName: songName,
            requester: user
            }),
        headers: {
        "Content-Type": "text/javascript"
        }
    }).then(response => {
        response = response.text();
        writeErrorInHTML(response)
        return response;
    }).catch(err => {
        writeErrorInHTML("", err)
        console.log(err);
    });
}

/* Deletes a track with a specific id
*/
async function deleteTrack(owner, id){
    try {
        let res = await fetch ("deleteTrack", {
            method: "DELETE",
            headers:{
                "owner-name":owner
            },
            body: id,
        });
        res = res.text();
        writeErrorInHTML(res)
        return res;
    } catch (e) {
        console.log("Error in deleteTrack("+owner+", "+id+")");
        writeErrorInHTML("", e)
        console.log(e);
    }
    return res;
}

/* Adds a delay (miliseconds) to all notes in a track
*/
async function addDelayToTrack(owner, id, delay){
    try {
        const res = await fetch("updateTrack", {
            method:"POST",
            body:JSON.stringify({owner:owner,id:id,delay:delay})
        });
        let response = res.text();
        writeErrorInHTML(response)
        return response;
    } catch (e) {
        console.log("Error in addDelayToTrack("+owner+", "+id+", "+delay+")");
        writeErrorInHTML("", e)
        console.log(e);
    }

};

/* Retrieves all tracks from a song
*/
async function getTracksFromSong(songData){
    let data = await songData;
    let dataArray = removeEmptyLines(data.split('\n'));
    return dataArray;
}

/* Returns the duration of a track by adding the time and duration of the last note
*/
function getTrackDuration(track){
    if(track.midiNotes !== undefined && track.midiNotes.length > 0){
        let tLength = track.midiNotes.length;
        let tTime = track.midiNotes[tLength-1].time;
        let tDuration = track.midiNotes[tLength-1].duration;

        return tTime + tDuration;
    }
    return -1;
}

/* Adds all notes from a track to an actual midi object
*/
async function addNotesFromTrack(midiTrack, trackData){
    try {
        const data = JSON.parse(trackData);

        for (let i = 0; i < data.midiNotes.length; i++) {
            midiTrack.addNote({
                midi: data.midiNotes[i].midi,
                time: (data.midiNotes[i].time/1000)+extraTime,
                duration: (data.midiNotes[i].duration/1000)+extraTime
            });
        }
    } catch (e) {
        console.log("Error in addNotesFromTrack("+midiTrack+", "+trackData+")");
        writeErrorInHTML("", e)
        console.log(e);
    }
}
