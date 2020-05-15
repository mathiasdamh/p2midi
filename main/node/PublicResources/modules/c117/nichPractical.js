const fs=require("fs");
const host = process.cwd() + "/PublicResources/webpage/SavedFiles/";

exports.deleteLineFromFile = function(line, filePath){
    let linesArr = fs.readFileSync(filePath, 'utf-8').split('\n');
    linesArr.splice(line, 1);
    fs.writeFileSync(filePath, "");
    for (line of linesArr){
        if (line.length > 0){
            fs.appendFileSync(filePath, line + '\n');
        }
    }
}

exports.clearFilesFromDirectory = function(directory){
    let files = fs.readdirSync(directory);
    for (file of files){
        fs.unlinkSync(directory + file);
    }
}

exports.getLineFromFile = function(filePath, line = "integer|0 index"){
    return fs.readFileSync(filePath, 'utf-8').split('\n')[line]
}

exports.deleteCarriageReturn = function(string){ // for deleting the \r character that notepad and the console use
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

// #################### MADS
exports.removeEmptyLines = function(array){
    for (i = 0; i < array.length; i++) {
        if(array[i] === ""){
            array.splice(i, 1);
        }
    }
    return array;
}

exports.decideTrackId = function(tracks){
    let id = 0;
    if (tracks.length === 0) {
        return id;
    } else if( tracks.length > 0) {
        let parsedData;
        let parsedId;
        for (let i = 0; i < tracks.length; i++) {
            parsedData = JSON.parse(tracks[i]);
            parsedId = parsedData.id.replace(/\D/g, '');
            //console.log("parsedId: "+parsedId);
            if (id < parsedId) {
                id = parsedId;
            }
            id++;
        } // for
        return id;
    } // else if
}
