const http = require('http');
const fs = require("fs");
const path = require("path");
const formidable = require('formidable');
const music = require('./PublicResources/modules/c117/serverMusic.js');
const practical = require('./PublicResources/modules/c117/serverPractical.js');
const userFunc = require('./PublicResources/modules/c117/serverUsers.js');

const hostname = '127.0.0.1';
const port = 8080;

const verbose = true; // Til ekstra console logging

const publicResources="PublicResources/";

const rootFileSystem=process.cwd();
const SavedFilesDir = rootFileSystem+"/"+publicResources+"webpage/SavedFiles/";

function securePath(userPath){
  if (userPath.indexOf('\0') !== -1) {
    return undefined;
  }

  userPath = publicResources+userPath;

  let p = path.join(rootFileSystem, path.normalize(userPath));
  if(verbose) console.log("The path is:"+p);
  return p;
}

function fileResponse(filename,res){
  const sPath = securePath(filename);
  if(verbose) console.log("Reading:"+sPath);
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

/* ############################################################################
   ################## FROM HERE REQUESTS GET HANDLED  #########################
   ############################################################################
*/

const server = http.createServer((req, res) => {
    if(verbose) console.log("GOT: " + req.method + " " +req.url);

    if(req.method=="GET"){ // Tager sig af GET requests
        switch(req.url){
            case "/index":
                res.writeHead(301,
                    {Location: "webpage/index.html"}
                );
                res.end();
            break;
            default:
                fileResponse(decodeURI(req.url), res);
            break;
        }
    }
    else if(req.method=="POST"){ // Tager sig af POST requests
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
                    let songDirPath = SavedFilesDir + "users/" + songDirBody + "/songs";
                    let songDirArr = fs.readdirSync(songDirPath);
                    if(verbose) console.log(songDirArr);
                    res.write(JSON.stringify(songDirArr));
                    res.end();
                });
                break;
            case "/webpage/midiFilesDir":
                let dirArr = fs.readdirSync(SavedFilesDir+"midi");
                if(verbose) console.log(dirArr);
                res.write(JSON.stringify(dirArr))
                res.end();
                break;
            case "/webpage/newMidiFile": // Denne URL hvis man gerne vil lave en ny MIDI fil

                let midiBody = ''; // En tom string til at holde den data som
                                   // Bliver sendt med POST requesten
                let midiOwner = req.headers["owner-name"];
                let midiName = req.headers["song-name"];
                let midiPath = SavedFilesDir + "midi/" + midiOwner + "_" + midiName + ".mid";
                req.on('data', chunk => { // Samler dataet sendt i POST requesten og
                                          // sætter det sammen i midiBody
                    midiBody += chunk.toString();
                });
                req.on('end', () => {
                    midiBody = JSON.parse(midiBody); // Dataet er blevet sendt som en streng, og
                                                     // her bliver det omdannet til et object
                    // Skriver dataet ud til en MIDI fil
                    try {
                        fs.writeFileSync(midiPath, new Buffer(Object.values(midiBody)));
                        res.writeHead(200);
                        res.end('end write midi file');
                    } catch (e) {
                        res.writeHead(400)
                        res.write("Error in creating new MIDI file")
                    }
                });
                break;
            case '/webpage/musicData':

                let trackBody = [];

                req.on("data", chunk => {
                    trackBody.push(chunk);

                }).on("end", () => {
                    trackBody = Buffer.concat(trackBody).toString();
                    trackBody = JSON.parse(trackBody);
                    let trackPath = SavedFilesDir + "users/" + trackBody.owner + "/tracks.txt";
                    let status = music.handleNewTrack(trackBody, trackPath);
                    res.writeHead(200, {
                        'Content-type': 'text/javascript'
                    });
                    res.end(status);
                });
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
                        userFunc.createUser(user);
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
                    status = music.handleAppendRequest(obj.trackOwner, obj.trackID, obj.songOwner, obj.songName, obj.requester);
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

                        let trackDataArr = practical.removeEmptyLines(data.split('\n'));

                        let lineToUpdate = 0;

                        let i = 0;
                        let updateParsedData;
                        let updateParsedId;
                        let updateIds = []
                        for (i = 0; i < trackDataArr.length; i++) {
                            if(verbose) console.log(i+" for loop");
                            updateParsedData = JSON.parse(trackDataArr[i]);
                            if(verbose) console.log(updateParsedData);
                            updateParsedId = updateParsedData.id.slice(updateObj.owner.length, updateParsedData.id.length);
                            if(verbose) console.log(updateParsedId);
                            updateIds.push(updateParsedId);
                        }
                        if(verbose) console.log(updateIds);


                        let endResponse = false;
                        i = 0;
                        let currentId = updateObj.id.slice(updateObj.owner.length, updateObj.id.length);
                        while (currentId != updateIds[i]) {
                            if(verbose) console.log("while loop iteration "+i);
                            if(i > updateIds.length){
                                if(verbose) console.log("Not a valid id to update");
                                endResponse = true;
                                break;
                            }
                            i++;
                        }

                        if(endResponse){
                            if(verbose) console.log("Response ended");
                            res.writeHead(404);
                            res.end("Not a valid id to update");
                        }else{

                        lineToUpdate = i;
                        if(verbose) console.log("lineToUpdate: "+lineToUpdate);
                        updateParsedData = JSON.parse(trackDataArr[lineToUpdate]);
                        for (i = 0; i < updateParsedData.midiNotes.length; i++) {
                            updateParsedData.midiNotes[i].time += updateObj.delay;
                        }
                        trackDataArr[lineToUpdate] = JSON.stringify(updateParsedData);

                        let newDataString = "";
                        for (i = 0; i < trackDataArr.length; i++) {
                            if(trackDataArr[i] !== undefined){
                                if(verbose) console.log("trackDataArr: ");
                                if(verbose) console.log(trackDataArr[i]);
                                newDataString += trackDataArr[i] + "\n";
                            }
                        }
                        if(verbose) console.log("newDataString: ");
                        if(verbose) console.log(newDataString);
                        fs.writeFileSync(updateTrackPath, newDataString);
                        res.writeHead(200);
                        if(verbose) console.log("Response ended");
                        res.end("Delayed track");
                        }
                    });

                });
                break;
            case '/webpage/upload.html':
                let uploadForm = new formidable.IncomingForm();
                uploadForm.parse(req, function(err, fields, files){
                    //console.log(files.filetoupload);
                    if(files.filetoupload.type === "audio/mid"){
                        let oldpath = files.filetoupload.path;
                        let newpath = SavedFilesDir+'midi/'+files.filetoupload.name;

                        fs.rename(oldpath, newpath, function (err){
                            if (err) throw err;
                            res.write("File uploaded: "+files.filetoupload.name);
                            res.end();
                        });
                    }else{
                        res.writeHead(400)
                        res.write("Please upload only midi files")
                        res.end();
                    }
                });
                break;
            case '/webpage/acceptSuggestion':
                req.on("data", (chunk) => {
                    data.push(chunk);
                }).on("end", () => {
                    data = Buffer.concat(data).toString();
                    obj = JSON.parse(data);
                    status = music.acceptSuggestion(obj.songOwner, obj.songName, obj.trackID);
                    if(verbose) console.log(status);
                    res.writeHead(200, {
                        "Content-type": "text/javascript"
                    });
                    res.end(status);
                });
                break;
            case '/webpage/rejectSuggestion':
                req.on("data", chunk => {
                    data.push(chunk);
                }).on("end", () => {
                    data = Buffer.concat(data).toString();
                    obj = JSON.parse(data);
                    status = music.rejectSuggestion(obj.songOwner, obj.songName, obj.trackID);
                    if(verbose) console.log(status);
                    res.writeHead(200, {
                        "Content-type": "text/javascript"
                    });
                    res.end(status);
                })
                break;
            default:
                res.end('unknown POST request');
                if(verbose) console.log("unknown POST request");
                break;
        }
    }else if (req.method === "PUT"){
        switch (req.url){
            case '/songs':
                if(verbose) console.log("new song PUT request");
                let data = [];
                req.on("data", chunk => {
                    data.push(chunk);
                }).on("end", () => {
                    data = Buffer.concat(data).toString();
                    obj = JSON.parse(data);
                    result = music.handleCreateSongRequest(obj.song, obj.user);
                    res.writeHead(200, {
                        "Content-type": "text/javascript"
                    });
                    res.end(result);
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
                    music.createSong(songPath);
                    res.writeHead(200);
                    res.end();
                });
                break;
            case "/newUser":
                let userName;
                let newUserData = [];
                req.on("data", chunk => {
                    newUserData.push(chunk);
                }).on("end", () => {
                    userName = Buffer.concat(newUserData).toString();
                    if(verbose) console.log("userName: "+userName);
                    if(userName){
                        result = userFunc.handleNewUserRequest(userName);
                        res.writeHead(200, {
                            "Content-type": "text/javascript"
                        });
                        res.end(result);
                    }
                    res.writeHead(400);
                    res.end();
                });
                break;
            default: if(verbose) console.log("Unhandled put request: "+req.url);
        }// end switch
    }else if(req.method === "DELETE"){
        switch (req.url) {
            case '/webpage/deleteSong':
                let deleteSongBody = '';
                let deleteSongOwner = req.headers["owner-name"]
                req.on('data', (chunk) => {
                    deleteSongBody += chunk.toString();
                });
                req.on('end', () => {
                    let deleteSongPath = SavedFilesDir + "users/" +
                                         deleteSongOwner +"/songs/" + deleteSongBody + ".txt";
                    let status = music.deleteSong(deleteSongPath);
                    res.writeHead(200, {
                        "Content-type": "text/javascript"
                    });
                    res.end(status);
                });
                break;
            case '/webpage/deleteTrack':
                let deleteTrackBody = '';
                let deleteTrackPath = '';
                let deleteOwner = req.headers["owner-name"];
                req.on('data', (chunk) =>{
                    deleteTrackBody += chunk.toString();
                });
                req.on('end', ()=>{
                    deleteTrackPath = SavedFilesDir + "users/" + deleteOwner + "/tracks.txt";
                    deleteTrackBody = deleteTrackBody.slice(deleteOwner.length,
                                                            deleteTrackBody.length);
                    let i = 0;
                    fs.readFile(deleteTrackPath, "utf-8", (err, data) => {
                        if (err) console.log(err)

                        let trackDataArr = practical.removeEmptyLines(data.split('\n'));

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
                                if(verbose)console.log("Not a valid id to delete");
                                endResponse = true;
                                break;
                            }
                            i++;
                        }

                        if(endResponse){
                            if(verbose)console.log("Response ended");
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
                        if(verbose) console.log("Response ended");
                        res.end();
                    });
                });
                break;
            case '/webpage/deleteUser':
                let userName;
                let result;
                let deleteUserData = [];
                req.on("data", chunk => {
                    deleteUserData.push(chunk);
                }).on("end", () => {
                    userName = Buffer.concat(deleteUserData).toString();
                    if(verbose) console.log("userName: " + userName);
                    result = userFunc.deleteUser(userName);
                    res.writeHead(200, {
                        "Content-type": "text/javascript"
                    });
                    res.end(result);
                });
                break;
            default:
                if(verbose) console.log("default switch case, DELETE request: "+req.url);
                break;
        }
    }
}); // end request handler

function guessMimeType(fileName){
  const fileExtension=fileName.split('.').pop().toLowerCase();
  if(verbose) console.log(fileExtension);
  const ext2Mime ={
    "txt": "text/txt",
    "html": "text/html",
    "ico": "image/ico",
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

  return (ext2Mime[fileExtension]||"text/plain");
}

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
