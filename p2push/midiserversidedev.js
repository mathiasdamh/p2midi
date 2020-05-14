const http = require('http');
const fs = require('fs');

const host = 'C:/Users/Lenovo/P2_midi/p2midi/p2push/';
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
    let re = RegExp('"id":"' + trackID + '"');
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

function trackIDToName(trackID, tracksFilePath){
    let line = trackExistsInFile(trackID, tracksFilePath);
    let trackInfo = fs.readFileSync(tracksFilePath, 'utf-8').split('\n')[line]; 
    let trackName = JSON.parse(trackInfo).name;
    return trackName;
}

function getNotifications(userName){
    let notificationsFilePath = host + 'users/' + userName + 'notifications.txt';
    let notifications = fs.readFileSync(notificationsFilePath, 'utf-8').split('\n');
    return notifications;
}

function handleNewUserRequest(requestedName){
    if (userExists(requestedName)){
        return "Error 1";
    }
    else {
        createUser(requestedName);
        return "Success";
    }
}

function acceptSuggestion(songOwner, songName, trackID){
    let suggestionsFilePath = host + 'users/' + songOwner + '/suggestions.txt';
    let suggestionInfo = []; // suggestionInfo will contain info about which song the track is suggested to, which user suggested it, and the track
    let suggester;
    let suggestedSongName;
    let track;
    let trackOwner;
    let songPath;
    let songsFolderPath = host + 'users/' + songOwner + '/songs/';
    let trackLine;
    let tracksFilePath;

    if (!userExists(songOwner)){
        return "Error 1";
    }
    else if (isSuggested(trackID, songName, suggestionsFilePath) === false){
        return "Error 2";
    }
    else {
        trackLine = isSuggested(trackID, songName, suggestionsFilePath);
        suggestionInfo = (fs.readFileSync(suggestionsFilePath, 'utf-8')).split('\n')[trackLine].split('|'); //getting an array of information on the specific suggestion
        songPath = songsFolderPath + songName + '.txt';
        suggestedSongName = suggestionInfo[0];
        trackOwner = suggestionInfo[1];
        suggester = suggestionInfo[2];
        track = suggestionInfo[3];
        tracksFilePath = host + 'users/' + trackOwner + '/tracks.txt';
        if (!(fs.readdirSync(songsFolderPath).includes(songName + '.txt'))){
            return "Error 3";
        }
        else if (trackExistsInFile(trackID, songPath)){
            deleteLineFromFile(trackLine, suggestionsFilePath);
            return "Error 4";
        }
        else {
            appendTrack(track, trackID, trackOwner, songOwner, songName);
            deleteLineFromFile(trackLine, suggestionsFilePath);
            if (userExists(trackOwner)){
                console.log("notifying trackOwner"); // contribution and contributer are appended in appendTrack function
                appendNotification(songOwner + ' included your track "' + trackIDToName(trackID, tracksFilePath) + '" into their song "' + songName + '" (suggested by ' + suggester + ')\n', trackOwner);
            }
            if (userExists(suggester)){
                console.log("notifying suggester");
                appendContributor(suggester, songPath);
                appendNotification(songOwner + ' accepted your suggestion ' + trackIDToName(trackID, tracksFilePath) + ' to their song ' + songName + '\n', suggester);
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
        if (line.length > 0){
            fs.appendFileSync(filePath, line + '\n');
        }
    }
}

function clearFilesFromDirectory(directory){
    let files = fs.readdirSync(directory);
    for (file of files){
        fs.unlinkSync(directory + file);
    }
}

function deleteUser(userName){
    let userPath = host + 'users/' + userName + '/';
    if (!userExists(userName)){
        return "Error 1";
    }
    else {
        clearFilesFromDirectory(userPath + 'songs/');
        fs.rmdirSync(userPath + 'songs/');
        clearFilesFromDirectory(userPath);
        fs.rmdirSync(userPath);
        return "Success";
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

function isSuggested(suggestedTrackID, suggestedSongName, suggestionsFilePath){
    let suggestions = fs.readFileSync(suggestionsFilePath, 'utf-8');
    let suggestionsArr = suggestions.split('\n');
    let suggestionInfo;
    let re = RegExp('"id":"' + suggestedTrackID + '"');
    let flag = false;
    let i = 0;
    do {
        suggestionInfo = suggestionsArr[i].split('|');
        if (suggestionInfo[0] === suggestedSongName && re.test(suggestionInfo[3])){
            flag = true;
        }
        else i++;
    }
    while (i < suggestionsArr.length && flag === false);
    if (flag === true){
        return i;
    }
    else return false;
}

function rejectSuggestion(songOwner, songName, trackID){
    let suggestionsFilePath = host + 'users/' + songOwner + '/suggestions.txt';
    let suggestionInfo;
    let suggester;
    let line;
    if (!userExists(songOwner)){
        return "Error 1";
    }
    else if (isSuggested(trackID, songName, suggestionsFilePath) === false){
        return "Error 2";
    }
    else {
        line = isSuggested(trackID, songName, suggestionsFilePath);
        suggestionInfo = fs.readFileSync(suggestionsFilePath, 'utf-8').split('\n')[line].split('|');
        suggester = suggestionInfo[2];
        deleteLineFromFile(line, suggestionsFilePath);
        if (userExists(suggester)){
            appendNotification(songOwner + ' rejected your suggestion to their song ' + songName + '\n', suggester)
        }
        return "Success";
    }
}

function handleCreateSongRequest(songName, songOwner){
    let songsFolderPath = host + 'users/' + songOwner + '/songs/';
    if (!userExists(songOwner)){
        return "Error 1";
    }
    else if ((fs.readdirSync(songsFolderPath).includes(songName + '.txt'))){
        return "Error 2";
    }
    else {
        createSong(songsFolderPath + songName + '.txt');
        return "Success";
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
    let userPath = host + 'users/' + userName
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

function deleteCarriageReturn(string){ // for deleting the \r character that notepad and the console use
    let output = "";
    string = string.split('');
    for (char of string){
        if (char !== '\r'){
            output += char;
        }
        else {
            console.log("deleted carriage return");
        }
    }
    return output;
}

function suggestTrack(trackOwner, track, songOwner, songName, suggester){ // this function must only be called when it is known that all five values given as parameters exist
    let suggestionsFilePath = host + 'users/' + songOwner + '/suggestions.txt';
    fs.appendFileSync(suggestionsFilePath, songName + '|' + trackOwner + '|' + suggester + '|' + track + '\n');
}

function appendTrack(track, trackID, trackOwner, songOwner, songName){
    let songPath = host + 'users/' + songOwner + '/songs/' + songName + '.txt'
    fs.appendFileSync(songPath, track + '\n');
    appendContributor(trackOwner, songPath);
    appendContribution(trackOwner, trackID, songOwner, songName);
}

function handleAppendRequest(trackOwner, trackID, songOwner, songName, requester){
    let songsFolderPath = host + 'users/' + songOwner + '/songs/';
    let tracksFilePath = host + 'users/' + trackOwner + '/tracks.txt';
    let suggestionsFilePath = host + 'users/' + songOwner + '/suggestions.txt';
    let line;
    let songPath;
    let track;
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
    else if (!userExists(requester)){
        return "Error 6";
    }
    else if (songOwner !== requester){
        if (isSuggested(trackID, songName, suggestionsFilePath) === false){ // SKAL TESTES
            line = trackExistsInFile(trackID, tracksFilePath); // SKAL TESTES
            track = getLineFromFile(tracksFilePath, line);
            track = deleteCarriageReturn(track);
            suggestTrack(trackOwner, track, songOwner, songName, requester);
            return "Track suggested";
        }
        else {
            return "Error 7";
        }
    }
    else {
        songPath = songsFolderPath + songName + '.txt';
        line = trackExistsInFile(trackID, tracksFilePath);
        appendTrack(getLineFromFile(tracksFilePath, line), trackID, trackOwner, songOwner, songName);
        appendNotification(songOwner + ' appended your track ' + trackIDToName(trackID, tracksFilePath) + ' to their song ' + songName + '\n', trackOwner);
        return "Track appended";
    }
}

console.log("server running...")
const server = http.createServer((req, res) => {
    if (req.method === "GET"){
        let userName = "";
        let data = [];
        switch (req.url){
            case '/index':
                fs.readFile('MIDI_testsdev.html', (err, data) => {
                    if (err) throw err;
                    res.writeHead(200, {'Content-Type': 'text/html'});
                    res.write(data);
                    res.end();
                });
                break;
            case '/notifications':
                req.on("data", chunk => {
                    data.push(chunk);
                }).on("end", () => {
                    userName = Buffer.concat(data).toString();
                    notifications = getNotifications(userName);
                    res.writeHead(200, {'Content-Type': 'text/html'});
                    res.write(notifications);
                });
                break;
            default:
                data = fs.readFileSync(host + req.url);
                console.log(req.url);
                res.writeHead(200)
                res.write(data);
                res.end();
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
                    status = acceptSuggestion(obj.songOwner, obj.songName, obj.trackID);
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
                    status = rejectSuggestion(obj.songOwner, obj.songName, obj.trackID);
                    console.log(status);
                    res.writeHead(200, {
                        "Content-type": "text/javascript"
                    });
                    res.end(status);
                })
                break;
            default: console.log('unhandled POST request: ' + req.url);
        }
    }
    else if (req.method === "PUT"){
        let result;
        let data = [];
        switch (req.url){
            case '/songs':
                console.log("new song PUT request");
                req.on("data", chunk => {
                    data.push(chunk);
                }).on("end", () => {
                    data = Buffer.concat(data).toString();
                    obj = JSON.parse(data);
                    result = handleCreateSongRequest(obj.song, obj.user);
                    res.writeHead(200, {
                        "Content-type": "text/javascript"
                    });
                    res.end(result);
                });
                break;
            case "/overwritesong":
                let fileinfo = [];
                req.on("data", (chunk) => {
                    fileinfo.push(chunk);
                }).on("end", () => {
                    fileinfo = Buffer.concat(fileinfo).toString();
                    fileinfo = JSON.parse(fileinfo);
                    if (!userExists(fileinfo.user)){
                        res.writeHead(200, {
                            "Content-type": "text/javascript"
                        });
                        res.end("Error 1");
                    }
                    else {
                        createSong(host + 'users/' + fileinfo.user + fileinfo.song + '.txt');
                        res.writeHead(200, {
                            "Content-type": "text/javascript"
                        });
                        res.end("Success");
                    }
                });
                break;
            case "/newUser":
                let userName;
                req.on("data", chunk => {
                    data.push(chunk);
                }).on("end", () => {
                    userName = Buffer.concat(data).toString();
                    console.log(userName);
                    result = handleNewUserRequest(userName);
                    res.writeHead(200, {
                        "Content-type": "text/javascript"
                    });
                    res.end(result);
                });
                break;
            default: console.log("yooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo");
        }
    }
    else if (req.method === "DELETE"){
        switch (req.url){
            case '/deleteUser':
                let userName;
                let result;
                let data = [];
                req.on("data", chunk => {
                    data.push(chunk);
                }).on("end", () => {
                    userName = Buffer.concat(data).toString();
                    console.log("userName: " + userName);
                    result = deleteUser(userName);
                    res.writeHead(200, {
                        "Content-type": "text/javascript"
                    });
                    res.end(result);
                });
                break;
            default: console.log("unhandled DELETE request: " + req.url);
        }
    }
}).listen(port);