async function createNewSong(userName, songName){
    if(checkIllegalChars(songName)) return -1;
    await fetch('/songs', {
        method: "PUT",
        body: JSON.stringify({user: userName, song: songName}),
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

async function deleteSong(songOwner, songName){
    fetch("deleteSong", {
        method:"DELETE",
        headers:{
            "owner-name":songOwner
        },
        body:songName
    }).then(res=>{
        displaySongFiles();
        res = res.text();
        return res
    })
    .then(res => {
        writeErrorInHTML(res)
    })
    .catch(err=>{
        writeErrorInHTML("", err)
        console.log(err);
    });
}

async function clearFile(userName, songName){
    await fetch('/overwritesong', {
        method: "PUT",
        body: JSON.stringify({user: userName, song: songName}),
        headers: {
            "Content-Type": "text"
        }
    }).then(response => {
        response = response.text();
        writeErrorInHTML(response);
        return response
    }).then(data => {
        //console.log(data);
    }).catch(err => {
        writeErrorInHTML("", err)
        console.log(err);
    });
}

async function getContributions(userName){
    await fetch('SavedFiles/users/' + userName +  '/contributions.txt', {
    })
    .then(response => {
        response = response.text();
        writeErrorInHTML(response);
        return response
    }).then(data => {
        //console.log(data);
    }).catch(err => {
        writeErrorInHTML("", err)
        console.log(err);
    });
}

async function getNotifications(userName){
    const res = await fetch('SavedFiles/users/' + userName +  '/notifications.txt', {
    })
    .then(response => {
        response = response.text();
        writeErrorInHTML(response);
        return response
    }).catch(err => {
        writeErrorInHTML("", err)
        console.log(err);
    });
}

function getSuggestions(userName){
    const res = fetch('SavedFiles/users/' + userName +  '/suggestions.txt', {
    })
    .then(response => {
        return response.text();
    })
    .catch(err => {
        writeErrorInHTML("", err)
        console.log(err);
    });
    return res;
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
        return "Couldn't find song";
    } catch (e) {
        console.log("Error in getSongByName("+owner+", "+songName+")");
        writeErrorInHTML("", e)
        console.log(e);
    };
}

async function acceptSuggestion(songOwner, songName, trackID){
    await fetch('acceptSuggestion', {
        method: "POST",
        body: JSON.stringify({songOwner: songOwner, songName: songName, trackID: trackID}),
        headers: {
            "Content-Type": "text/javascript"
        }
    }).then(response => {
        response = response.text();
        writeErrorInHTML(response);
        return response
    }).catch(err => {
        writeErrorInHTML("", err)
        console.log(err);
    });
}

async function rejectSuggestion(songOwner, songName, trackID){
    await fetch('rejectSuggestion', {
        method: "POST",
        body: JSON.stringify({songOwner: songOwner, songName: songName, trackID: trackID}),
        headers: {
            "Content-Type": "text/javascript"
        }
    }).then(response => {
        response = response.text();
        writeErrorInHTML(response);
        return response
    }).catch(err => {
        writeErrorInHTML("", err)
        console.log(err);
    });
}
