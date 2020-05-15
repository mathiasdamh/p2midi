const fs=require("fs");

exports.trackIDToName = function(trackID, tracksFilePath){
    let line = trackExistsInFile(trackID, tracksFilePath);
    let trackInfo = fs.readFileSync(tracksFilePath, 'utf-8').split('\n')[line];
    let trackName = JSON.parse(trackInfo).name;
    return trackName;
}

exports.trackExistsInFile = function(trackID, filePath){ // this function must only be called when it is certain the file exists
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

exports.suggestTrack = function(trackOwner, track, songOwner, songName, suggester){ // this function must only be called when it is known that all five values given as parameters exist
    let suggestionsFilePath = host + 'users/' + songOwner + '/suggestions.txt';
    fs.appendFileSync(suggestionsFilePath, songName + '|' + trackOwner + '|' + suggester + '|' + track + '\n');
}

exports.appendTrack = function(track, trackID, trackOwner, songOwner, songName){
    let songPath = host + 'users/' + songOwner + '/songs/' + songName + '.txt'
    fs.appendFileSync(songPath, track + '\n');
    appendContributor(trackOwner, songPath);
    appendContribution(trackOwner, trackID, songOwner, songName);
}

exports.handleAppendRequest = function(trackOwner, trackID, songOwner, songName, requester){
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

exports.handleCreateSongRequest = function(songName, songOwner){
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

exports.createSong = function(songPath){
    let creationDate = new Date();
    let separatedPath = songPath.split('/');
    let userName = separatedPath[separatedPath.length - 3];
    fs.writeFileSync(songPath,
        "Date created: " + creationDate + "\nCreated by: " + userName + "\nContributors: \n");
}

exports.acceptSuggestion = function(songOwner, songName, trackID){
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

exports.isSuggested = function(suggestedTrackID, suggestedSongName, suggestionsFilePath){
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

exports.rejectSuggestion = function(songOwner, songName, trackID){
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

exports.appendContribution = function(contributor, trackID, songOwner, songName){
    let contributionsFilePath = host + 'users/' + contributor + '/contributions.txt';
    fs.appendFileSync(contributionsFilePath, songOwner + '|' + songName + '|' + trackID + '\n');
}

exports.appendContributor = function(contributor, songPath){
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
