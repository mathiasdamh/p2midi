const http = require('http');
const fs = require('fs');

const host = 'C:/Users/m4dsw/git-main/p2midi/p2push/';
const port = 8000;

const trackTest = '{"id":adam5,"midiNotes":[{"midi":52,"time":2000,"duration":90.00000000014552},{"midi":52,"time":2433.999999999971,"duration":91.00000000012369},{"midi":52,"time":2913.9999999999927,"duration":113.00000000005093},{"midi":50,"time":3389.0000000001237,"duration":133.00000000004366},{"midi":48,"time":3921.000000000051,"duration":130.00499999998283}],"name":"c2","owner":"adam"}'

/*
test("if the track exists in the specified users' tracks.txt, returns the track. else, returns false", () => {
    expect(getTrack("adam", "adam5")).toBe(trackTest);
    expect(getTrack("adam", "adam")).toBe(false);
});

test("if the track exists in the song return true, else return false", () => {
    expect(trackExistsInFile("adam3", {owner: "adam", name: "song1"})).toBe(true);
    expect(trackExistsInFile("adam", {owner: "adam", name: "song1"})).toBe(false);
});

test('if the track was appended successfully, return {error: "none"}, else return the appropriate error value', () => {
    expect(appendTrack({owner: 'charles', id: 'charles4'}, {owner: 'adam', name: 'song1'})).toBe({error: "none"});
    expect(appendTrack({owner: 'danny', id: 'charles4'}, {owner: 'adam', name: 'song1'})).toBe({error: "error 2"});
    expect(appendTrack({owner: 'charles', id: 'charles9'}, {owner: 'adam', name: 'song1'})).toBe({error: "error 1"});
    expect(appendTrack({owner: 'charles', id: 'charles1'}, {owner: 'danny', name: 'song1'})).toBe({error: "error 3"});
    expect(appendTrack({owner: 'charles', id: 'adam3'}, {owner: 'adam', name: 'nonexistent'})).toBe({error: "error 4"});
    expect(appendTrack({owner: 'charles', id: 'charles3'}, {owner: 'adam', name: 'song1'})).toBe({error: "error 5"});
});
*/
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
    let suggestionsFilePath = host + 'users/' + songOwner + '/suggestions.txt';
    let suggestionInfo = []; // suggestionInfo will contain info about which song the track is suggested to, which user suggested it, and the track
    let suggester;
    let track;
    let trackOwner;
    let songPath;
    let songsFolderPath = host + 'users/' + songOwner + '/songs/';
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
    let contributionsFilePath = host + 'users/' + contributor + '/contributions.txt';
    fs.appendFileSync(contributionsFilePath, songOwner + '|' + songName + '|' + trackID + '\n');
}

function appendNotification(notification, user){
    let notificationsFilePath = host + 'users/' + user + "/notifications.txt";
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
    let suggestionsFilePath = host + 'users/' + songOwner + '/suggestions.txt';
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
    let userPath = host + '/users/' + userName
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
    return fs.readdirSync(host + 'users').includes(userName);
}

function suggestTrack(trackOwner, track, songOwner, songName, suggester){ // this function must only be called when it is known that all four values given as parameters exist
    let suggestionsFilePath = host + 'users/' + songOwner + '/suggestions.txt';
    fs.appendFileSync(suggestionsFilePath, songName + '|' + trackOwner + '|' + suggester + '|' + track);
}

function appendTrack(track, trackOwner, songPath){
    fs.appendFileSync(songPath, track + '\n');
    appendContributor(trackOwner, songPath);
}

function handleAppendRequest(trackOwner, trackID, songOwner, songName, requester){
    let songsFolderPath = host + 'users/' + songOwner + '/songs/';
    let tracksFilePath = host + 'users/' + trackOwner + '/tracks.txt';
    let suggestionsFilePath = host + 'users/' + songOwner + '/suggestions.txt';
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
        appendTrack(getLineFromFile(tracksFilePath, line));
        return "Track appended";
    }
}

console.log("server running...")
const server = http.createServer((req, res) => {
    if (req.method === "GET"){
        switch (req.url){
            case '/index':
                fs.readFile('MIDI_testsdev.html', (err, data) => {
                    if (err) throw err;
                    res.writeHead(200, {'Content-Type': 'text/html'});
                    res.write(data);
                    res.end();
                });
                break;

            default:
        }
    }
    else if (req.method === "POST"){
        let data = [];
        let obj;
        let status = "";
        switch (req.url){
            case '/trackData':
                let trackData = [];
                req.on("data", chunk => {
                    trackData.push(chunk);
                }).on("end", () => {
                    trackData = Buffer.concat(trackData).toString();
                    fs.appendFileSync("song.txt", trackData + '\n');
                    res.writeHead(200);
                    res.end();
                    });
                break;
            case '/userCheck':
                let user;
                let input = [];
                let users = fs.readdirSync(host + '/users');
                req.on("data", (chunk) => {
                    input.push(chunk);
                }).on("end", () => {
                    user = Buffer.concat(input).toString();
                    if (users.includes(user)){
                        res.writeHead(200, {
                            "Content-type": "text/javascript"
                        });
                        res.end(JSON.stringify({error: "user already exists"}));
                    }
                    else {
                        createUser(user);
                        res.writeHead(200, {
                            "Content-type": "text/javascript"
                        });
                        res.end(JSON.stringify({error: "none"}));
                    }
                });
                break;
            case '/appendTrack':
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
            default: console.log('unhandled POST request: ' + req.url);
        }
    }
    else if (req.method === "PUT"){
        switch (req.url){
            case '/songs':
                console.log("new song PUT request");
                let data = [];
                req.on("data", chunk => {
                    data.push(chunk);
                }).on("end", () => {
                    obj = JSON.parse(data);
                    let songs = fs.readdirSync(host + '/users/' + obj.user + '/songs/');
                    if (songs.includes(obj.song + '.txt')){
                        res.writeHead(200, {'Content-Type': 'text'});
                        res.write(JSON.stringify({error: "song already exists"}));
                        res.end();
                    }
                    else {
                        createSong(host + "/users/" + obj.user + "/songs/" + obj.song + '.txt', obj.user);
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
                    songPath = host + "users/" + fileinfo.user + '/songs/' + fileinfo.song + '.txt';
                    createSong(songPath);
                    res.writeHead(200);
                    res.end();
                });
                break;
            default: console.log("yooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo");
        }
    }
}).listen(port);
