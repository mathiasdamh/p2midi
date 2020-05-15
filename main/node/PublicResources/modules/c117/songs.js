async function createNewSong(userName, songName){
    //console.log("creating new song...");
    await fetch('/songs', {
        method: "PUT",
        body: JSON.stringify({user: userName, song: songName}),
        headers: {
            "Content-Type": "text/javascript"
        }
    }).then(response => {
        return response.text();
    }).then(data => {
        //console.log(data);
    }).catch(err => {
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
    })
    .then(res => {//console.log("Song deleted");
                  //console.log("Response: ");
                  //console.log(res);
                 })
    .catch(err=>{
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
        return response.text();
    }).then(data => {
        //console.log(data);
    }).catch(err => {
        console.log(err);
    });
}

async function getContributions(userName){
    await fetch('SavedFiles/users/' + userName +  '/contributions.txt', {
    })
    .then(response => {
        return response.text();
    }).then(data => {
        //console.log(data);
    }).catch(err => {
        console.log(err);
    });
}

async function getNotifications(userName){
    let returnValue;

    await fetch('SavedFiles/users/' + userName +  '/notifications.txt', {
    })
    .then(response => {
        response = response.text();
        //console.log(response);
        returnValue = response;
    }).then(data => {
        //console.log(data);
        return data;
    }).catch(err => {
        console.log(err);
    });

    return returnValue;
}

async function getSuggestions(userName){
    let returnValue;

    await fetch('SavedFiles/users/' + userName +  '/suggestions.txt', {
    })
    .then(response => {
        returnValue = response.text();
        //console.log(returnValue);
    })
    .catch(err => {
        console.log(err);
    });

    return returnValue;
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

async function acceptSuggestion(songOwner, songName, trackID){
    await fetch('acceptSuggestion', {
        method: "POST",
        body: JSON.stringify({songOwner: songOwner, songName: songName, trackID: trackID}),
        headers: {
            "Content-Type": "text/javascript"
        }
    }).then(response => {
        return response.text();
    }).then(data => {
        //console.log(data);
    }).catch(err => {
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
        return response.text();
    }).then(data => {
        //console.log(data);
    }).catch(err => {
        console.log(err);
    });
}
