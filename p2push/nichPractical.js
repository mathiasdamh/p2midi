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

function getLineFromFile(filePath, line = "integer|0 index"){
    return fs.readFileSync(filePath, 'utf-8').split('\n')[line]
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

