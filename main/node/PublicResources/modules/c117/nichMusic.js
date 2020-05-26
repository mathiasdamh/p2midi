const fs=require("fs");
const host = process.cwd() + "/PublicResources/webpage/SavedFiles/";
const userFunc = require("./nichUsers.js");
const music = require("./nichMusic.js")
const practical = require("./nichPractical.js");
///////

exports.trackIDToName = function(trackID, tracksFilePath){
    let line = music.trackExistsInFile(trackID, tracksFilePath);
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

exports.suggestTrack = function(trackOwner, track, songOwner, songName, suggester){
    /* this function must only be called when it is known that all five values
    given as parameters exist */
    let suggestionsFilePath = host + 'users/' + songOwner + '/suggestions.txt';
    fs.appendFileSync(suggestionsFilePath, songName + '|' + trackOwner + '|'
        + suggester + '|' + track + '\n');
}

exports.appendTrack = function(track, trackID, trackOwner, songOwner, songName){
    let songPath = host + 'users/' + songOwner + '/songs/' + songName + '.txt'
    fs.appendFileSync(songPath, track + '\n');
    music.appendContributor(trackOwner, songPath);
    music.appendContribution(trackOwner, trackID, songOwner, songName);
}

exports.handleAppendRequest = function(trackOwner, trackID, songOwner, songName, requester){
    let songsFolderPath = host + 'users/' + songOwner + '/songs/';
    let tracksFilePath = host + 'users/' + trackOwner + '/tracks.txt';
    let suggestionsFilePath = host + 'users/' + songOwner + '/suggestions.txt';
    let line;
    let songPath;
    let track;
    if (!userFunc.userExists(trackOwner)){
        return "The specified track owner does not exist!";
    }
    line = music.trackExistsInFile(trackID, tracksFilePath)
    if (line === false){
        return "The specified user has no such track!";
    }
    else if (!userFunc.userExists(songOwner)){
        return "The specified song owner does not exist!";
    }
    else if (!(fs.readdirSync(songsFolderPath).includes(songName + '.txt'))){
        return "The specified user has no such song!";
    }
    else if (music.trackExistsInFile(trackID, songsFolderPath + songName + '.txt')){
        return "The song already contains this track";
    }
    else if (!userFunc.userExists(requester)){
        return "An unknown error occurred when attempting to append the track";
    }
    else if (songOwner === requester){
        songPath = songsFolderPath + songName + '.txt';
        
        music.appendTrack(practical.getLineFromFile(tracksFilePath, line),
        trackID, trackOwner, songOwner, songName);

        if (songOwner !== trackOwner){
            userFunc.appendNotification(songOwner + ' appended your track '
            + music.trackIDToName(trackID, tracksFilePath) + ' to their song '
            + songName + '\n', trackOwner);
        }
        return "Track appended";
    }
    else {
        if (music.isSuggested(trackID, songName, suggestionsFilePath) === false){
            track = practical.getLineFromFile(tracksFilePath, line);
            music.suggestTrack(trackOwner, track, songOwner, songName, requester);
            return "Track suggested";
        }
        else {
            return "The track has already been suggested to this song";
        }

    }
}

exports.handleCreateSongRequest = function(songName, songOwner){
    let songsFolderPath = host + 'users/' + songOwner + '/songs/';
    if (!userFunc.userExists(songOwner)){
        return "An unknown error occurred when attempting to create the song";
    }
    else if ((fs.readdirSync(songsFolderPath).includes(songName + '.txt'))){
        return "A song by this name already exists!";
    }
    else {
        music.createSong(songsFolderPath + songName + '.txt');
        return "Song created";
    }
}

exports.createSong = function(songPath){
    let creationDate = new Date();
    let separatedPath = songPath.split('/');
    let userName = separatedPath[separatedPath.length - 3];
    fs.writeFileSync(songPath,
        "Date created: " + creationDate + "\nCreated by: " + userName + "\nContributors: \n");
}

exports.deleteSong = function(songPath){
    fs.unlink(
        songPath,
        function(err){
            if(err) console.log(err);
    });
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

    if (!userFunc.userExists(songOwner)){
        return "An unknown error occurred while accepting the suggestion!";
    }
    trackLine = music.isSuggested(trackID, songName, suggestionsFilePath);
    if (trackLine === false){
        return "Could not find the specified suggestion";
    }
    else {
        suggestionInfo = (fs.readFileSync(suggestionsFilePath, 'utf-8')).split('\n');
        // suggestionInfo is now an array of all the users suggestions
        suggestionInfo = suggestionInfo[trackLine].split('|');
        // suggestionInfo is now an array of information about the specified suggestion
        songPath = songsFolderPath + songName + '.txt';
        suggestedSongName = suggestionInfo[0];
        trackOwner = suggestionInfo[1];
        suggester = suggestionInfo[2];
        track = suggestionInfo[3];
        tracksFilePath = host + 'users/' + trackOwner + '/tracks.txt';
        if (!(fs.readdirSync(songsFolderPath).includes(songName + '.txt'))){
            return "Could not accept the suggestion, as the song no longer exists!";
        }
        else if (music.trackExistsInFile(trackID, songPath)){
            practical.deleteLineFromFile(trackLine, suggestionsFilePath);
            return "The song already contains the track! Deleting from suggestions";
        }
        else {
            music.appendTrack(track, trackID, trackOwner, songOwner, songName);
            practical.deleteLineFromFile(trackLine, suggestionsFilePath);
            if (userFunc.userExists(trackOwner)){
                console.log("notifying trackOwner");
                // contribution and contributer are appended in appendTrack function
                music.appendNotification(songOwner + ' included your track "'
                    + music.trackIDToName(trackID, tracksFilePath) + '" into their song "'
                    + songName + '" (suggested by ' + suggester + ')\n', trackOwner);
            }
            if (userFunc.userExists(suggester)){
                console.log("notifying suggester");
                music.appendContributor(suggester, songPath);
                music.appendNotification(songOwner + ' accepted your suggestion '
                    + music.trackIDToName(trackID, tracksFilePath) + ' to their song '
                    + songName + '\n', suggester);
            }
            return "Suggestion accepted";
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
    if (!userFunc.userExists(songOwner)){
        return "An unknown error occurred when attempting to reject the suggestion";
    }
    else if (music.isSuggested(trackID, songName, suggestionsFilePath) === false){
        return "The suggestion has already been deleted";
    }
    else {
        line = music.isSuggested(trackID, songName, suggestionsFilePath);
        suggestionInfo = fs.readFileSync(suggestionsFilePath, 'utf-8').split('\n')[line].split('|');
        suggester = suggestionInfo[2];
        practical.deleteLineFromFile(line, suggestionsFilePath);
        if (userFunc.userExists(suggester)){
            userFunc.appendNotification(songOwner + ' rejected your suggestion to their song ' + songName + '\n', suggester)
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

exports.handleNewTrack = function(track, tracksPath){
    let trackOwner = track.owner;
    let trackIDDecided;
    let tracks;
    if (!userFunc.userExists(trackOwner)){
        return "An unknown error occurred while handling the track!";
    }
    else {
        tracks = fs.readFileSync(tracksPath, 'utf-8').split('\n');
        tracks = practical.removeEmptyLines(tracks);
        trackIDDecided = practical.decideTrackId(tracks);
        track.id = trackOwner+trackIDDecided;
        fs.appendFileSync(tracksPath, JSON.stringify(track) + "\n");
        return 'Track appended';
    }
}
