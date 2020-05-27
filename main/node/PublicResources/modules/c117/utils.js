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
        //console.log(err);
    });
}

async function createNewUser(desiredName){
    if(checkIllegalChars(desiredName)) return -1;
    await fetch('/newUser', {
        method: 'PUT',
        body: desiredName,
        headers: {
            "Content-Type": "text/javascript"
        }
    }).then(response => {
        return response.text();
    }).then(data => {
        //console.log(data);
    }).catch(err => {
        //console.log(err);
    });
}

async function deleteUser(userName){
    await fetch('deleteUser', {
        method: "DELETE",
        body: userName,
        headers: {
            "Content-Type": "text/javascript"
        }
    }).then(response => {
        return response.text();
    }).then(data => {
        //console.log(data);
    }).catch(err => {
        //console.log(err);
    });
}


async function checkIfNameIsTaken(name){
    let res = await fetch("userCheck", {
        method: "POST",
        body: name.toLowerCase()
    })
    .then(response => {
        return response.json();
    })
    .then(data => {
        if (data.error === "User already exists"){
            return true;
        }
        else return false;
    })
    .catch(err => {
        //console.log(err);
    });
    return res;
};

function removeEmptyLines(array){
    let length = array.length;
    let deletedItems = 0;
    for (i = 0; i < length; i++) {
        if(!array[i]){
            array.splice(i-deletedItems, 1);
            deletedItems++;
        }
    }
    return array;
}

async function writeErrorInHTML(message, err){
    message = (message == undefined) ? "" : message;
    err = (err == undefined) ? "" : err;

    console.log("Writing error message in HTML");

    if(document.getElementById('errorElement')){
        let errorElement = document.getElementById('errorElement');
        if(typeof message == "object") message = await message;
        if(typeof err == "object") err = await err;
        errorElement.innerHTML = message;
        errorElement.innerHTML += "\t";
        errorElement.innerHTML += err;
    }
};

function checkIllegalChars(textstring){
    let allowedCharacters = /^[0-9a-zA-Z]+$/;
    if(!allowedCharacters.test(textstring)){
        alert("Please only use letters and numbers.");
        return true;
    }
    return false;
}
