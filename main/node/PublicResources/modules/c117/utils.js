let currentUser = "mads" // Bliver brugt til at gemme tracks.

async function createNewUser(){
    let desiredName = prompt("Please enter your user name: ");
    let isNameTaken = await checkIfNameIsTaken(desiredName)
    .then(status => {
        if (status === true){
            alert("Name is already taken");
        }
        else console.log("user created");
    })
    .catch(err => {
        console.log(err);
    })
};

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
        console.log(err);
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
