let liClass = "yourClass";

function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.innerHTML = filename;

    document.getElementById('body').appendChild(element);

}

function downloadMidi(filename) {
    var element = document.createElement('a');
    let path = "SavedFiles/midi/"+filename+".mid";

    element.setAttribute('href', path);
    element.setAttribute('download', filename+".mid");
    element.innerHTML = filename;

    document.getElementById('body').appendChild(element);

}

async function displayFiles(){
    const res = await fetch("midiFilesDir",{
        method:"POST"
    })
    const data = await res.text();
    let fileDir = JSON.parse(data);

    let element;
    let dlPath;
    let midi;

    for (let i = 0; i < fileDir.length; i++) {
        if(fileDir[i] === "_tempmidi.mid") continue;
        element = document.createElement('a');
        dlPath = "SavedFiles/midi/"+fileDir[i];
        midi = await Midi.fromUrl(dlPath);

        element.setAttribute('href', dlPath);
        element.setAttribute('download', fileDir[i]);
        element.innerHTML = fileDir[i];

        element.innerHTML += " - Duration: "+midi.duration.toFixed(1)+" seconds";

        elementLI = document.createElement('li');
        element.setAttribute('class', liClass);
        elementLI.appendChild(element);

        document.getElementById('midiFiles').appendChild(elementLI);
    }
}

displayFiles();
