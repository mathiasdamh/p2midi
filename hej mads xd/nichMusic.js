function trackIDToName(trackID, tracksFilePath){
    let line = trackExistsInFile(trackID, tracksFilePath);
    let trackInfo = fs.readFileSync(tracksFilePath, 'utf-8').split('\n')[line]; 
    let trackName = JSON.parse(trackInfo).name;
    return trackName;
}

function trackExistsInFile(trackID, filePath){ 
    // this function must only be called when it is certain the file exists
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

function suggestTrack(trackOwner, track, songOwner, songName, suggester){ 
    /* this function must only be called when it is known that all five values 
    given as parameters exist */
    let suggestionsFilePath = host + 'users/' + songOwner + '/suggestions.txt';
    fs.appendFileSync(suggestionsFilePath, songName + '|' + trackOwner + '|' 
        + suggester + '|' + track + '\n');
}

function appendTrack(track, trackID, trackOwner, songOwner, songName){
    let songPath = host + 'users/' + songOwner + '/songs/' + songName + '.txt';
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
        return "The specified track owner does not exist!";
    }
    let line = trackExistsInFile(trackID, tracksFilePath)
    if (line === false){
        return "The specified user has no such track!";
    }
    else if (!userExists(songOwner)){
        return "The specified song owner does not exist!";
    }
    else if (!(fs.readdirSync(songsFolderPath).includes(songName + '.txt'))){
        return "The specified user has no such song!";
    }
    else if (trackExistsInFile(trackID, songsFolderPath + songName + '.txt')){
        return "The song already contains this track";
    }
    else if (!userExists(requester)){
        return "An unknown error occurred when attempting to append the track";
    }
    else if (songOwner === requester){
        songPath = songsFolderPath + songName + '.txt';
        appendTrack(getLineFromFile(tracksFilePath, line), trackID, trackOwner, songOwner, songName);
        if (songOwner !== trackOwner){
            appendNotification(songOwner + ' appended your track ' + trackIDToName(trackID, tracksFilePath) + ' to their song ' + songName + '\n', trackOwner);
        }
        return "Track appended";
    }
    else {
        if (isSuggested(trackID, songName, suggestionsFilePath) === false){ 
            track = getLineFromFile(tracksFilePath, line);
            track = deleteCarriageReturn(track);
            suggestTrack(trackOwner, track, songOwner, songName, requester);
            return "Track suggested";
        }
        else {
            return "The track has already been suggested to this song";
        }
        
    }
}

function handleCreateSongRequest(songName, songOwner){
    let songsFolderPath = host + 'users/' + songOwner + '/songs/';
    if (!userExists(songOwner)){
        return "An unknown error occurred when attempting to create the song";
    }
    else if ((fs.readdirSync(songsFolderPath).includes(songName + '.txt'))){
        return "A song by this name already exists!";
    }
    else {
        createSong(songsFolderPath + songName + '.txt');
        return "Song created";
    }
}

function createSong(songPath){
    let creationDate = new Date();
    let separatedPath = songPath.split('/');
    let userName = separatedPath[separatedPath.length - 3];
    fs.writeFileSync(songPath, 
        "Date created: " + creationDate + "\nCreated by: " + userName + "\nContributors: \n");
}

function acceptSuggestion(songOwner, songName, trackID){
    let suggestionsFilePath = host + 'users/' + songOwner + '/suggestions.txt';
    let suggestionInfo = []; 
    /* suggestionInfo will contain info about which song the track is suggested to, 
    which user suggested it, and the track */
    let suggester;
    let suggestedSongName;
    let track;
    let trackOwner;
    let songPath;
    let songsFolderPath = host + 'users/' + songOwner + '/songs/';
    let trackLine;
    let tracksFilePath;

    if (!userExists(songOwner)){
        return "An unknown error occurred while accepting the suggestion!";
    }
    trackLine = isSuggested(trackID, songName, suggestionsFilePath);
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
        else if (trackExistsInFile(trackID, songPath)){
            deleteLineFromFile(trackLine, suggestionsFilePath);
            return "The song already contains the track! Deleting from suggestions";
        }
        else {
            appendTrack(track, trackID, trackOwner, songOwner, songName);
            deleteLineFromFile(trackLine, suggestionsFilePath);
            if (userExists(trackOwner)){
                console.log("notifying trackOwner"); 
                // contribution and contributer are appended in appendTrack function
                appendNotification(songOwner + ' included your track "' 
                    + trackIDToName(trackID, tracksFilePath) + '" into their song "' 
                    + songName + '" (suggested by ' + suggester + ')\n', trackOwner);
            }
            if (userExists(suggester)){
                console.log("notifying suggester");
                appendContributor(suggester, songPath);
                appendNotification(songOwner + ' accepted your suggestion ' 
                    + trackIDToName(trackID, tracksFilePath) + ' to their song ' 
                    + songName + '\n', suggester);
            }
            return "Suggestion accepted";
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
        return "An unknown error occurred when ";
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
            appendNotification(songOwner + ' rejected your suggestion to their song ' + songName 
                + '\n', suggester);
        }
        return "Success";
    }
}

function appendContribution(contributor, trackID, songOwner, songName){
    let contributionsFilePath = host + 'users/' + contributor + '/contributions.txt';
    fs.appendFileSync(contributionsFilePath, songOwner + '|' + songName + '|' + trackID + '\n');
}

function appendContributor(contributor, songPath){
    let fileLines = (fs.readFileSync(songPath, "utf-8")).split('\n')
    let contributorsArray = fileLines[2].split(' ');
    let i = 3;
    contributorsArray.splice(0, 1); // getting rid of the word 'Contributors:'
    contributorsArray.pop(); 
    /* getting rid of the excess space, which is left behind by the 
    .split action on line 2 of this function */
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

