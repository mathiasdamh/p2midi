const http = require('http');
const fs = require('fs');

const port = 8000;

class Song{
    constructor(name){
        this.name = name;
        this.tracks = [];
    }
    addTrack(track){
        if (tracks.indexOf(track) !== -1){
            this.tracks.push(track);
        }
        else alert("A track by that name is already in the song!");
    }
    deleteTrack(track){
        if (tracks.indexOf(track) !== -1){
            this.tracks.splice(tracks[track]);
        }
        else alert("No such track exists in this song!");
    }
}

const server = http.createServer((req, res) => {
    if (req.method === "GET"){
        fs.readFile('MIDI_tests.html', (err, data) => {
            if (err) throw err;
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(data);
            res.end();
        });
    }
    else if (req.method === "POST"){
        switch (req.url){
            case '/musicData':
                req.on("data", chunk => {
                    obj = JSON.parse(chunk);
                    fs.appendFile("song.txt", chunk + '\n', (err) => {
                        if (err) console.log(err)
                    });
                    fs.appendFile
                }).on("end", () => {;
                    res.writeHead(200);
                    res.end();
                });
                break;
            default: console.log('30 ' + req.url);
        
        }
    }
    else if (req.method === "PUT"){
        switch (req.url){
            case '/songs':
                let songname;
                console.log("new song PUT request");
                req.on("data", chunk => {
                    obj = JSON.parse(chunk);
                });
                console.log(songname);
        }
    }
}).listen(port);

