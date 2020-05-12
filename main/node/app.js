const http = require('http');
const fs=require("fs");
const path=require("path");
const { Midi } = require('@tonejs/midi')
const { parse } = require('querystring');
const formidable = require('formidable');

const hostname = '127.0.0.1';
const port = 8080;

const verbose = true;

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

/**/
let host = "C:/Users/m4dsw/git-main/p2midi/main/node/PublicResources/webpage/SavedFiles/";

function getTrack(user, id){
    let tracks = (fs.readFileSync(host + 'users/' + user + '/tracks.txt', "utf-8")).split('\n');
    let re = RegExp("\"id\":\""+id+"\"");
    let i = 0;
    let flag = false;

    console.log("\"id\":\""+id+"\"");

    while (i < tracks.length && flag === false){
        if (re.test(tracks[i])){
            flag = true;
        }
        console.log(tracks[i]);
        console.log(re);
        i++;
    }
    if (flag){
        console.log(tracks[i-1] + ", hej med dig");
        return tracks[i-1];
    }
    else return false;
}

function removeEmptyLines(array){
    for (i = 0; i < array.length; i++) {
        if(array[i] === ""){
            array.splice(i, 1);
        }
    }
    return array;
}

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
let body = '';

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
        switch(req.url){
            case "/webpage/songFilesDir":
                body = '';
                req.on('data', chunk =>{
                    body += chunk.toString();
                });
                req.on('end', ()=>{
                    let songDirArr = fs.readdirSync("PublicResources/webpage/SavedFiles/users/"+body+"/songs");
                    console.log(songDirArr);
                    res.write(JSON.stringify(songDirArr));
                    res.end();
                });
                break;
            case "/webpage/midiFilesDir":
                let dirArr = fs.readdirSync("PublicResources/webpage/SavedFiles/midi");
                console.log(dirArr);
                res.write(JSON.stringify(dirArr))
                res.end();
                break;
            case "/webpage/newMidiFile": // Denne URL hvis man gerne vil lave en ny MIDI fil
                                               // Specificeret under Indspilning.html

                body = ''; // En tom string til at holde den data som
                               // Bliver sendt med POST requesten

                console.log("start write midi file");
                req.on('data', chunk =>{ // Samler dataet sendt i POST requesten og
                                         // samler det sammen i body
                    if(verbose)console.log("chunk: "+chunk);

                    body += chunk.toString();

                    if(verbose)console.log("body: "+body);
                });
                req.on('end', ()=>{
                    if(verbose)console.log("before parse: "+typeof body);

                    body = JSON.parse(body); // Dataet er blevet sendt som en streng, og
                                             // her bliver det omdannet til et object
                    if(verbose)console.log("after parse: "+typeof body);

                    // Skriver dataet ud til en MIDI fil
                    fs.writeFileSync("PublicResources/webpage/SavedFiles/midi/"+req.headers["owner-name"]+"_"+req.headers["song-name"]+".mid",
                    new Buffer(Object.values(body)));

                    console.log("end write midi file");
                    res.end('end write midi file');
                });
                res.end('unexpected ending ' + req.url);
                break;
            case '/webpage/musicData':
                body = '';
                let owner;
                let newId;
                let path;
                req.on("data", chunk => {
                    body += chunk.toString();

                }).on("end", () => {
                    owner = JSON.parse(body).owner;
                    newId = 0;
                    path = ("PublicResources/webpage/SavedFiles/users/"+owner+"/tracks.txt");
                    let testPromise = new Promise(function(res, rej){
                        console.log("promise entered");
                        if(fs.existsSync(path)){
                            console.log("if entered");
                            fs.readFile(path, "utf-8", (err, data) => {
                                if (err) console.log(err)
                                if(data === undefined){
                                    console.log("Creating tracks.txt for " + owner);
                                }else{
                                    let dataSet = removeEmptyLines(data.split("\n"));
                                    console.log(dataSet);

                                    if (dataSet.length === 0) {
                                        newId = 0;
                                    } else if( dataSet.length > 0) {
                                        let i = 0;
                                        let parsedData;
                                        let parsedId;
                                        for (i = 0; i < dataSet.length; i++) {
                                            parsedData = JSON.parse(dataSet[i]);
                                            console.log("parsed data:");
                                            console.log(parsedData);
                                            parsedId = parsedData.id.slice(owner.length, parsedData.id.length);
                                            console.log("parsed id: "+parsedId);
                                            if (newId < parsedId) {
                                                newId = parsedId;
                                            }
                                            newId++;
                                            console.log("newId: "+newId);
                                        } // for
                                    } // else if
                                } // else
                                res();
                            }); // fs.readFileSync
                        }; // if
                    })
                    .then(()=>{
                        body = JSON.parse(body);
                        console.log("newId: "+newId);
                        body.id = owner+newId;
                        console.log("body.id: "+body.id);

                        fs.appendFile("PublicResources/webpage/SavedFiles/users/"+owner+"/tracks.txt", JSON.stringify(body) + "\n", (err) => {
                            if (err) console.log(err)
                            console.log("appending file");
                            res.writeHead(200);
                            res.end();
                        });
                    });
                });

                break;
            case '/webpage/userCheck':
                let user;
                let input = [];
                let users = fs.readdirSync(host +"users");
                req.on("data", (chunk) => {
                    input.push(chunk);
                }).on("end", () => {

                    user = input.toString();
                        if (users.includes(user)){
                        console.log("faulty uname req");
                        res.writeHead(200);
                        console.log("wrote header");
                        res.write("name taken");
                        console.log("wrote appropriate res");
                        res.end("name takeen");
                        console.log("ended res");
                    }
                    else {
                        fs.mkdirSync(host + "users/" + user);
                        fs.mkdirSync(host + "users/" + user + '/songs');
                        fs.writeFile(host + "users/" + user + "/tracks.txt","",function(err){
                            console.log(err);
                        });
                        res.writeHead(201);
                        res.end();
                    }
                });
                break;
            case '/webpage/appendTrack':
                let data = [];
                let usersArr = [];
                let track;
                req.on("data", (chunk) => {
                    data.push(chunk);
                }).on("end", () => {
                    obj = JSON.parse(data.toString());
                    console.log(obj);
                    if (fs.readdirSync(host + 'users').includes(obj.track.owner)){ // MANGLER ERROR HANDLING
                        track = getTrack(obj.track.owner, obj.track.id); //HVIS DENNE ER FALSE
                    console.log(track);
                    }
                    else {
                        res.writeHead(400);
                        res.end();
                    }
                    usersArr = fs.readdirSync(host + 'users');
                    songPath = host + 'users/' + obj.song.owner + '/songs/' + obj.song.name + '.txt';
                    if (usersArr.includes(obj.song.owner) && fs.readdirSync(host + 'users/' + obj.song.owner + '/songs/').includes(obj.song.name + '.txt')){ // MANGLER ERROR HANDLING
                        fs.appendFileSync(songPath, track + '\n');
                        console.log('boh');
                        res.writeHead(200);
                        res.end();
                    }
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
                    updateTrackPath = "PublicResources/webpage/SavedFiles/users/"+updateObj.owner+"/tracks.txt";

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
            case '/webpage/upload.html':
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
                    }
                    let oldpath = files.filetoupload.path;
                    let newpath = 'PublicResources/webpage/SavedFiles/uploads/'+fileType+files.filetoupload.name;

                    fs.rename(oldpath, newpath, function (err){
                        if (err) throw err;
                        res.write("file uploaded");
                        console.log("file uploaded");
                        res.end();
                    });
                });
                break;
            default:
                res.end('unknown POST request');
                console.log("unknown POST request");
                break;
        }
    }else if (req.method === "PUT"){
        switch (req.url){
            case '/webpage/songs':
                console.log("new song PUT request");
                let data = [];
                req.on("data", chunk => {
                    data.push(chunk);
                }).on("end", () => {
                    console.log("ended " + data);
                    obj = JSON.parse(data);
                    let creationDate = new Date();
                    let songs = fs.readdirSync(host + '/users/' + obj.user + '/songs/');
                    if (songs.includes(obj.song)){
                        res.writeHead(200, {'Content-Type': 'text'});
                        res.write("You have already created a song by that name!");
                        res.end();
                    }
                    else {
                        fs.writeFile(host + "/users/" + obj.user + "/songs/" + obj.song + '.txt', "Date created: " + creationDate +
                        "\nCreated by: " + obj.user + "\nOther contributors: \n", (error) => {
                            if (error) throw error;
                            console.log("file created succesfully");
                        });
                    }
                    res.writeHead(201);
                    res.end();
                });
                break;
            default: console.log("yooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo");
        }// end switch
    }else if(req.method === "DELETE"){
        switch (req.url) {
            case '/webpage/deleteSong':
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
            case '/webpage/deleteTrack':
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
