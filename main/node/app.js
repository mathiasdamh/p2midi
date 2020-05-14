const http = require('http');
const fs=require("fs");
const path=require("path");
const { Midi } = require('@tonejs/midi')
const { parse } = require('querystring');
const formidable = require('formidable');

const hostname = '127.0.0.1';
const port = 8080;

const verbose = true;

let testS = "abvxdf3252"
console.log(testS.replace(/\D/g, ''));

//https://blog.todotnet.com/2018/11/simple-static-file-webserver-in-node-js/
//https://stackoverflow.com/questions/16333790/node-js-quick-file-server-static-files-over-http

const publicResources="PublicResources/";
//secture file system access as described on
//https://nodejs.org/en/knowledge/file-system/security/introduction/
const rootFileSystem=process.cwd();
function securePath(userPath){
  if (userPath.indexOf('\0') !== -1) {
    // could also test for illegal chars: if (!/^[a-z0-9]+$/.test(filename)) {return undefined;}
    return undefined;

  }
  userPath= publicResources+userPath;

  let p= path.join(rootFileSystem,path.normalize(userPath));
  //console.log("The path is:"+p);
  return p;
}
/* more accurate error codes should be sent to client */

/* For finding stuff */
const SavedFilesDir = path.resolve(__dirname)+"/PublicResources/webpage/SavedFiles/";
const WebpageDir = path.resolve(__dirname)+"/PublicResources/webpage/";

// ################## NICHOLAS
function trackExistsInFile(trackID, filePath){ // this function must only be called when it is certain the file exists
    let fileLines = fs.readFileSync(filePath, "utf-8").split('\n');
    let re = RegExp("\"id\":\""+trackID+"\"");

    let flag = false;
    let i = 0;
    do {
        if (re.test(fileLines[i])){
            flag = true;
        }
        else i++;
    } while (flag === false && i < fileLines.length);
    if (flag === true){
        return i;
    }
    else return false;
}

function acceptSuggestion(songOwner, trackID){
    let suggestionsFilePath = SavedFilesDir + 'users/' + songOwner + '/suggestions.txt';
    let suggestionInfo = []; // suggestionInfo will contain info about which song the track is suggested to, which user suggested it, and the track
    let suggester;
    let track;
    let trackOwner;
    let songPath;
    let songsFolderPath = SavedFilesDir + 'users/' + songOwner + '/songs/';
    let trackLine;
    let songName;

    if (!userExists(songOwner)){
        return "Error 1";
    }
    else if (trackExistsInFile(trackID, suggestionsFilePath) === false){
        return "Error 2";
    }
    else {
        trackLine = trackExistsInFile(trackID, suggestionsFilePath);
        suggestionInfo = fs.readFileSync(suggestionsFilePath, 'utf-8').split('\n')[trackLine].split('|');
        songName = suggestionInfo[0];
        songPath = songsFolderPath + songName + '.txt';
        trackOwner = suggestionInfo[1];
        suggester = suggestionInfo[2];
        track = suggestionInfo[3];
        if (!(fs.readdirSync(songsFolderPath).includes(songName + '.txt'))){
            return "Error 3";
        }
        else if (trackExistsInFile(trackID, songPath)){
            deleteLineFromFile()
            return "Error 4";
        }
        else{
            appendTrack(track, trackOwner, songPath);
            deleteLineFromFile(trackLine, suggestionsFilePath);
            if (userExists(trackOwner)){
                console.log("notifying trackOwner");
                appendContribution(trackOwner, trackID, songOwner, songName);
                appendNotification(songOwner + ' included your track "' + trackID + '" into their song "' + songName + '" (suggested by ' + suggester + ')\n', trackOwner);
            }
            if (userExists(suggester)){
                console.log("notifying suggester");
                appendContributor(suggester, songPath);
                appendNotification(songOwner + ' accepted your suggestion to their song ' + songName + '\n', suggester);
            }
            return "Success";
        }
    }
}

function appendContribution(contributor, trackID, songOwner, songName){
    let contributionsFilePath = SavedFilesDir + 'users/' + contributor + '/contributions.txt';
    fs.appendFileSync(contributionsFilePath, songOwner + '|' + songName + '|' + trackID + '\n');
}

function appendNotification(notification, user){
    let notificationsFilePath = SavedFilesDir + 'users/' + user + "/notifications.txt";
    fs.appendFileSync(notificationsFilePath, notification);
}

function deleteLineFromFile(line, filePath){
    let linesArr = fs.readFileSync(filePath, 'utf-8').split('\n');
    linesArr.splice(line, 1);
    fs.writeFileSync(filePath, "");
    for (line of linesArr){
        fs.appendFileSync(suggestionsFilePath, suggestion + '\n');
    }
}

function appendContributor(contributor, songPath){
    let fileLines = (fs.readFileSync(songPath, "utf-8")).split('\n')
    let contributorsArray = fileLines[2].split(' ');
    let i = 3;
    contributorsArray.splice(0, 1); // getting rid of the word 'Contributors:'
    contributorsArray.pop(); // getting rid of the excess space, which is left behind by the .split action on line 2 of this function
    if (!(contributorsArray.includes(contributor))){
        contributorsArray.push(contributor);
        fs.writeFileSync(songPath,
            fileLines[0] + '\n'+ fileLines[1] + "\nContributors: ");
        for (cont of contributorsArray){
            fs.appendFileSync(songPath, cont + ' ');
        }
        for (i; i < fileLines.length; i++){
            fs.appendFileSync(songPath, '\n' + fileLines[i]);
        }
    }
}

function rejectSuggestion(songOwner, trackID){
    let suggestionsFilePath = SavedFilesDir + 'users/' + songOwner + '/suggestions.txt';
    let suggestionInfo;
    let suggester;
    if (!userExists(songOwner)){
        return "Error 1";
    }
    else if (trackExistsInFile(trackID, suggestionsFilePath) === false){
        return "Error 2";
    }
    else {
        suggestionInfo = fs.readFileSync(suggestionsFilePath, 'utf-8').split('\n')[line].split('|');
        suggester = suggestionInfo[2];
        deleteLineFromFile(trackExistsInFile(trackID, suggestionsFilePath));
        if (userExists(suggester)){
            appendNotification(songOwner + ' rejected your suggestion to their song ' + songName)
        }
    }
}

function createSong(songPath){
    let creationDate = new Date();
    let separatedPath = songPath.split('/');
    let userName = separatedPath[separatedPath.length - 3];
    fs.writeFileSync(songPath,
        "Date created: " + creationDate + "\nCreated by: " + userName + "\nContributors: \n");
}

function createUser(userName){
    let userPath = SavedFilesDir + '/users/' + userName
    fs.mkdirSync(userPath);
    fs.mkdirSync(userPath + '/songs');
    fs.writeFileSync(userPath + '/tracks.txt', "");
    fs.writeFileSync(userPath + '/suggestions.txt', "");
    fs.writeFileSync(userPath + "/contributions.txt", "");
    fs.writeFileSync(userPath + "/notifications.txt", "");
}

function getLineFromFile(filePath, line = "integer|0 index"){
    return fs.readFileSync(filePath, 'utf-8').split('\n')[line]
}

function userExists(userName){
    return fs.readdirSync(SavedFilesDir + 'users').includes(userName);
}

function suggestTrack(trackOwner, track, songOwner, songName, suggester){ // this function must only be called when it is known that all four values given as parameters exist
    let suggestionsFilePath = SavedFilesDir + 'users/' + songOwner + '/suggestions.txt';
    fs.appendFileSync(suggestionsFilePath, songName + '|' + trackOwner + '|' + suggester + '|' + track);
}

function appendTrack(track, trackOwner, songPath){
    console.log("track: "+track+", trackOwner: "+trackOwner+", songPath: "+songPath);
    fs.appendFileSync(songPath, track + '\n');
    appendContributor(trackOwner, songPath);
}

function handleAppendRequest(trackOwner, trackID, songOwner, songName, requester){
    let songsFolderPath = SavedFilesDir + 'users/' + songOwner + '/songs/';
    let tracksFilePath = SavedFilesDir + 'users/' + trackOwner + '/tracks.txt';
    let suggestionsFilePath = SavedFilesDir + 'users/' + songOwner + '/suggestions.txt';
    let line;
    if (!userExists(trackOwner)){
        return "Error 1";
    }
    else if (trackExistsInFile(trackID, tracksFilePath) === false){
        return "Error 2";
    }
    else if (!userExists(songOwner)){
        return "Error 3";
    }
    else if (!(fs.readdirSync(songsFolderPath).includes(songName + '.txt'))){
        return "Error 4";
    }
    else if (trackExistsInFile(trackID, songsFolderPath + songName + '.txt')){
        return "Error 5";
    }
    else if (songOwner !== requester){
        if ((trackExistsInFile(trackID, suggestionsFilePath) === false)){
            line = trackExistsInFile(trackID, tracksFilePath);
            suggestTrack(trackOwner, getLineFromFile(tracksFilePath, line), songOwner, songName, requester);
            return "Track suggested";
        }
        else {
            return "Error 6";
        }
    }
    else {
        line = trackExistsInFile(trackID, tracksFilePath);
        appendTrack(getLineFromFile(tracksFilePath, line), trackOwner, songsFolderPath+songName+".txt");
        return "Track appended";
    }
}

// #################### MADS
function removeEmptyLines(array){
    for (i = 0; i < array.length; i++) {
        if(array[i] === ""){
            array.splice(i, 1);
        }
    }
    return array;
}

function decideTrackId(tracks){
    let id = 0;
    if (tracks.length === 0) {
        return id;
    } else if( tracks.length > 0) {
        let parsedData;
        let parsedId;
        for (let i = 0; i < tracks.length; i++) {
            parsedData = JSON.parse(tracks[i]);
            parsedId = parsedData.id.replace(/\D/g, '');
            console.log("parsedId: "+parsedId);
            if (id < parsedId) {
                id = parsedId;
            }
            id++;
        } // for
        return id;
    } // else if
}
/* ############################################################################
   ############################################################################
    FROM HERE REQUESTS GET HANDLED
*/
function fileResponse(filename,res){
  const sPath=securePath(filename);
  console.log("Reading:"+sPath);
  fs.readFile(sPath, (err, data) => {
    if (err) {
      console.error(err);
      res.statusCode=404;
      res.setHeader('Content-Type', 'text/txt');
      res.write("File Error:"+String(err));
      res.end("\n");
    }else {
      res.statusCode = 200;
      res.setHeader('Content-Type', guessMimeType(filename));
      res.write(data);
      res.end('\n');
    }
  })
}

const server = http.createServer((req, res) => {
    let date=new Date();
    console.log("GOT: " + req.method + " " +req.url);
    if(req.method=="GET"){
        switch(req.url){
            case "/":
                fileResponse("index.html",res);
            break;
            default:
                fileResponse(req.url,res);
            break;
        }
    }else if(req.method=="POST"){ // Tager sig af POST requests
        let data = [];
        let obj;
        let status = "";
        switch(req.url){
            case "/webpage/songFilesDir":
                let songDirBody = '';
                req.on('data', chunk =>{
                    songDirBody += chunk.toString();
                });
                req.on('end', ()=>{
                    let songDirArr = fs.readdirSync(SavedFilesDir+"users/"+songDirBody+"/songs");
                    console.log(songDirArr);
                    res.write(JSON.stringify(songDirArr));
                    res.end();
                });
                break;
            case "/webpage/midiFilesDir":
                let dirArr = fs.readdirSync(SavedFilesDir+"midi");
                console.log(dirArr);
                res.write(JSON.stringify(dirArr))
                res.end();
                break;
            case "/webpage/newMidiFile": // Denne URL hvis man gerne vil lave en ny MIDI fil
                                               // Specificeret under Indspilning.html
                let midiBody = ''; // En tom string til at holde den data som
                               // Bliver sendt med POST requesten
                let midiOwner = req.headers["owner-name"];
                let midiName = req.headers["song-name"];
                let midiPath = SavedFilesDir + "midi/" + midiOwner + "_" + midiName + ".mid";
                req.on('data', chunk =>{ // Samler dataet sendt i POST requesten og
                                         // samler det sammen i midiBody
                    midiBody += chunk.toString();
                });
                req.on('end', ()=>{

                    midiBody = JSON.parse(midiBody); // Dataet er blevet sendt som en streng, og
                                             // her bliver det omdannet til et object
                    // Skriver dataet ud til en MIDI fil
                    fs.writeFileSync(midiPath, new Buffer(Object.values(midiBody)));

                    res.writeHead(200);
                    res.end('end write midi file');
                });
                res.end('unexpected ending ' + req.url);
                break;
            case '/webpage/musicData':
                let trackBody = '';
                let trackOwner;
                let trackPath;
                req.on("data", chunk => {
                    trackBody += chunk.toString();

                }).on("end", () => {
                    trackOwner = JSON.parse(trackBody).owner;
                    trackPath = (SavedFilesDir+ "users/"+trackOwner+"/tracks.txt");
                    let trackIdDecided = new Promise(function(res, rej){
                        res(fs.existsSync(trackPath))})
                    .then(value => {
                        let newId = 0;
                        if(value){
                            let data = fs.readFileSync(trackPath, "utf-8")
                            if(data === undefined){
                                console.log("No tracks.txt found for " + trackOwner + ", creating new file");
                            }else{
                                let dataSet = removeEmptyLines(data.split("\n"));

                                newId = decideTrackId(dataSet);
                            } // else
                        }
                        return newId;
                    })
                    .then((newId)=>{
                        trackBody = JSON.parse(trackBody);
                        trackBody.id = trackOwner+newId;
                        return trackBody;
                    })
                    .then((data)=>{
                        fs.appendFile(trackPath, JSON.stringify(data) + "\n", (err) => {
                            if (err) throw err;
                            res.writeHead(200);
                            res.end();
                        });
                    })
                }); //.on(end)

                break;
            case '/webpage/userCheck':
                let user;
                let input = [];
                let users = fs.readdirSync(SavedFilesDir + '/users');
                req.on("data", (chunk) => {
                    input.push(chunk);
                }).on("end", () => {
                    user = Buffer.concat(input).toString();
                    if (users.includes(user)){
                        res.writeHead(200, {
                            "Content-type": "text/javascript"
                        });
                        res.end(JSON.stringify({error: "User already exists"}));
                    }
                    else {
                        createUser(user);
                        res.writeHead(200, {
                            "Content-type": "text/javascript"
                        });
                        res.end(JSON.stringify({error: "No error"}));
                    }
                });
                break;
            case '/webpage/appendTrack':
                req.on("data", (chunk) => {
                    data.push(chunk);
                }).on("end", () => {
                    data = Buffer.concat(data).toString();
                    obj = JSON.parse(data);
                    status = handleAppendRequest(obj.trackOwner, obj.trackID, obj.songOwner, obj.songName, obj.requester);
                    res.writeHead(200, {
                        "Content-type": "text/javascript"
                    });
                    res.end(status);
                });
                break;
            case '/webpage/updateTrack':
                let updateData = '';
                let updateTrackPath = '';
                let updateObj;
                req.on("data", (chunk) => {
                    updateData += chunk.toString();
                }).on("end", () => {
                    updateObj = JSON.parse(updateData);
                    updateTrackPath = SavedFilesDir+"users/"+updateObj.owner+"/tracks.txt";

                    fs.readFile(updateTrackPath, "utf-8", (err, data) => {
                        if(err) throw err;

                        let trackDataArr = removeEmptyLines(data.split('\n'));

                        let lineToUpdate = 0;

                        let i = 0;
                        let updateParsedData;
                        let updateParsedId;
                        let updateIds = []
                        for (i = 0; i < trackDataArr.length; i++) {
                            console.log(i+" for loop");
                            updateParsedData = JSON.parse(trackDataArr[i]);
                            console.log(updateParsedData);
                            updateParsedId = updateParsedData.id.slice(updateObj.owner.length, updateParsedData.id.length);
                            console.log(updateParsedId);
                            updateIds.push(updateParsedId);
                        }
                        if(verbose) console.log(updateIds);


                        let endResponse = false;
                        i = 0;
                        let currentId = updateObj.id.slice(updateObj.owner.length, updateObj.id.length);
                        while (currentId != updateIds[i]) {
                            if(verbose) console.log("while loop iteration "+i);
                            if(i > updateIds.length){
                                console.log("Not a valid id to update");
                                endResponse = true;
                                break;
                            }
                            i++;
                        }

                        if(endResponse){
                            console.log("Response ended");
                            res.writeHead(404);
                            res.end("Not a valid id to update")
                        }

                        lineToUpdate = i;
                        console.log("lineToUpdate: "+lineToUpdate);
                        updateParsedData = JSON.parse(trackDataArr[lineToUpdate]);
                        for (i = 0; i < updateParsedData.midiNotes.length; i++) {
                            updateParsedData.midiNotes[i].time += updateObj.delay;
                        }
                        trackDataArr[lineToUpdate] = JSON.stringify(updateParsedData);

                        let newDataString = "";
                        for (i = 0; i < trackDataArr.length; i++) {
                            if(trackDataArr[i] !== undefined){
                                console.log("trackDataArr: ");
                                console.log(trackDataArr[i]);
                                newDataString += trackDataArr[i] + "\n";
                            }
                        }
                        console.log("newDataString: ");
                        console.log(newDataString);
                        fs.writeFileSync(updateTrackPath, newDataString);
                        res.writeHead(200);
                        console.log("Response ended");
                        res.end();
                    });

                });
                break;
            case '/upload.html':
                let uploadForm = new formidable.IncomingForm();
                uploadForm.parse(req, function(err, fields, files){
                    //console.log(files.filetoupload);
                    console.log(files.filetoupload.type);
                    let fileType;
                    switch (files.filetoupload.type) {
                        case 'audio/mid':
                            fileType = 'mid/';
                            break;
                        case 'text/txt':
                        case 'text/plain':
                            fileType = 'txt/';
                            break;
                        case 'image/png':
                        case 'image/jpeg':
                            fileType = 'img/';
                            break;
                        default:
                        fileType = "txt/";
                    }
                    let oldpath = files.filetoupload.path;
                    let newpath = SavedFilesDir+'uploads/'+fileType+files.filetoupload.name;

                    fs.rename(oldpath, newpath, function (err){
                        if (err) throw err;
                        res.write("file uploaded");
                        console.log("file uploaded");
                        res.end();
                    });
                });
                break;
            case '/acceptSuggestion':
                req.on("data", (chunk) => {
                    data.push(chunk);
                }).on("end", () => {
                    data = Buffer.concat(data).toString();
                    obj = JSON.parse(data);
                    status = acceptSuggestion(obj.songOwner, obj.trackID);
                    res.writeHead(200, {
                        "Content-type": "text/javascript"
                    });
                    res.end(status);
                });
                break;
            case '/rejectSuggestion':
                req.on("data", chunk => {
                    data.push(chunk);
                }).on("end", () => {
                    data = Buffer.concat(data).toString();
                    obj = JSON.parse(data);
                    status = rejectSuggestion(obj.songOwner, obj.trackID);
                    res.writeHead(200, {
                        "Content-type": "text/javascript"
                    });
                    res.end(status);
                })
                break;
            default:
                res.end('unknown POST request');
                console.log("unknown POST request");
                break;
        }
    }else if (req.method === "PUT"){
        switch (req.url){
            case '/songs':
                console.log("new song PUT request");
                let data = [];
                req.on("data", chunk => {
                    data.push(chunk);
                }).on("end", () => {
                    obj = JSON.parse(data);
                    let songs = fs.readdirSync(SavedFilesDir + '/users/' + obj.user + '/songs/');
                    if (songs.includes(obj.song + '.txt')){
                        res.writeHead(200, {'Content-Type': 'text'});
                        res.write(JSON.stringify({error: "song already exists"}));
                        res.end();
                    }
                    else {
                        createSong(SavedFilesDir + "/users/" + obj.user + "/songs/" + obj.song + '.txt', obj.user);
                        res.writeHead(200, {
                            "Content-type": "text/javascript"
                        });
                        res.end(JSON.stringify({error: "none"}));
                    }
                });
                break;
            case "/overwritesong":
                let fileinfo = [];
                let songPath = "";
                req.on("data", (chunk) => {
                    fileinfo.push(chunk);
                }).on("end", () => {
                    fileinfo = Buffer.concat(fileinfo).toString();
                    fileinfo = JSON.parse(fileinfo);
                    songPath = SavedFilesDir + "users/" + fileinfo.user + '/songs/' + fileinfo.song + '.txt';
                    createSong(songPath);
                    res.writeHead(200);
                    res.end();
                });
                break;
            default: console.log("yooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo");
        }// end switch
    }else if(req.method === "DELETE"){
        switch (req.url) {
            case '/deleteSong':
                let deleteSongBody = '';
                req.on('data', (chunk) =>{
                    deleteSongBody += chunk.toString();
                });
                req.on('end', ()=>{
                    fs.unlink(
                        publicResources+"webpage/SavedFiles/users/"+req.headers["owner-name"]+"/songs/"+deleteSongBody+".txt",
                        function(err){
                            if(err) console.log(err);
                            res.end("ended");
                    });
                });
                break;
            case '/deleteTrack':
                let deleteTrackBody = '';
                let deleteTrackPath = '';
                let deleteOwner = req.headers["owner-name"];
                req.on('data', (chunk) =>{
                    deleteTrackBody += chunk.toString();
                });
                req.on('end', ()=>{
                    deleteTrackPath = publicResources+"webpage/SavedFiles/users/"+deleteOwner+"/tracks.txt";
                    deleteTrackBody = deleteTrackBody.slice(deleteOwner.length, deleteTrackBody.length);
                    let i = 0;
                    fs.readFile(deleteTrackPath, "utf-8", (err, data) => {
                        if (err) console.log(err)

                        let trackDataArr = removeEmptyLines(data.split('\n'));

                        if(verbose) console.log(trackDataArr);

                        let lineToDelete = 0;

                        let deleteParsedData;
                        let deleteParsedId;
                        let deleteIds = []
                        for (i = 0; i < trackDataArr.length; i++) {
                            deleteParsedData = JSON.parse(trackDataArr[i]);
                            deleteParsedId = deleteParsedData.id.slice(deleteOwner.length, deleteParsedData.id.length);
                            deleteIds.push(deleteParsedId);
                        }
                        if(verbose) console.log(deleteIds);

                        i = 0;
                        let endResponse = false;
                        while (deleteTrackBody != deleteIds[i]) {
                            if(verbose) console.log(deleteTrackBody+ " , "+deleteIds[i]);
                            if(verbose) console.log("while loop iteration "+i);
                            if(i > deleteIds.length){
                                console.log("Not a valid id to delete");
                                endResponse = true;
                                break;
                            }
                            i++;
                        }

                        if(endResponse){
                            console.log("Response ended");
                            res.writeHead(404);
                            res.end("Not a valid id to delete")
                        }

                        lineToDelete = i;
                        trackDataArr.splice(lineToDelete,1);

                        let newDataString = "";
                        for (let i = 0; i < trackDataArr.length; i++) {
                            if(trackDataArr[i] !== undefined){
                                newDataString += trackDataArr[i] + "\n";
                            }
                        }
                        fs.writeFileSync(deleteTrackPath, newDataString)
                        res.writeHead(200);
                        console.log("Response ended");
                        res.end();
                    });
                });
                break;
            default:
                console.log("default switch case, DELETE request: "+req.url);
                break;
        }
    }
}); // end request handler

//better alternative: use require('mmmagic') library
function guessMimeType(fileName){
  const fileExtension=fileName.split('.').pop().toLowerCase();
  console.log(fileExtension);
  const ext2Mime ={ //Aught to check with IANA spec
    "txt": "text/txt",
    "html": "text/html",
    "ico": "image/ico", // CHECK x-icon vs image/vnd.microsoft.icon
    "js": "text/javascript",
    "json": "application/json",
    "css": 'text/css',
    "png": 'image/png',
    "jpg": 'image/jpeg',
    "wav": 'audio/wav',
    "mp3": 'audio/mpeg',
    "svg": 'image/svg+xml',
    "pdf": 'application/pdf',
    "doc": 'application/msword',
    "docx": 'application/msword',
    "mid": 'audio/mid'
   };
    //incomplete
  return (ext2Mime[fileExtension]||"text/plain");
}

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

//https://www.w3schools.com/nodejs/nodejs_url.asp
