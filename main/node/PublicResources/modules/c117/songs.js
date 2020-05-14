async function createNewSong(userName){
    songName = prompt("What would you like to call the song?");
    console.log("creating new song...");
    await fetch('/songs', {
        method: "PUT",
        body: JSON.stringify({user: userName, song: songName}),
        headers: {
            "Content-Type": "text"
        }
    }).then(response => {
        return response.json();
    }).then(data => {
        console.log(data);
    });
}

async function clearFile(userName, songName){
    await fetch('/overwritesong', {
        method: "PUT",
        body: JSON.stringify({user: userName, song: songName}),
        headers: {
            "Content-Type": "text"
        }
    })
}

async function deleteSong(songOwner, songName){
    fetch("deleteSong", {
        method:"DELETE",
        headers:{
            "owner-name":songOwner
        },
        body:songName
    }).then(res=>{
        displaySongFiles();
    })
    .then(res => {console.log("Song deleted");
                  console.log("Response: ");
                  console.log(res);})
    .catch(err=>{
        console.log(err);
    });
}

function overwritePrompt(){
    let ans = ""
    while (ans !== 'y' && ans !== 'n' && ans !== null){
        ans = prompt("You already have a song by this name! Do you wish to overwrite it? (y/n)", "n");
        if (ans !== 'y' && ans !== 'n' && ans !== null){
            alert("invalid input! simply write 'y' or 'n'");
        }
    }
    if (ans === 'y'){
        return true;
    }
    else return false;
}

async function getSongByName(owner, songName){
    try {

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

async function acceptSuggestion(songOwner, trackID){
    await fetch('/acceptSuggestion', {
        method: "POST",
        body: JSON.stringify({songOwner: songOwner, trackID: trackID})
    }).then(response => {
        return response.text();
    }).then(data => {
        console.log(data);
    });
}

async function rejectSuggestion(songOwner, trackID){
    await fetch('/acceptSuggestion', {
        method: "POST",
        body: JSON.stringify({songOwner: songOwner, trackID: trackID})
    }).then(response => {
        return response.text();
    }).then(data => {
        console.log(data);
    });
}
