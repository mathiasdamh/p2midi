const http = require('http');
const fs = require('fs');

const host = 'C:/Users/Lenovo/P2_midi';
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
console.log("server running...")
const server = http.createServer((req, res) => {
    if (req.method === "GET"){
        switch (req.url){
            case '/index':
                fs.readFile('MIDI_tests.html', (err, data) => {
                    if (err) throw err;
                    res.writeHead(200, {'Content-Type': 'text/html'});
                    res.write(data);
                    res.end();
                });
                break;
            
            default:
                console.log("get001 - " + req.url);
        }
    }
    else if (req.method === "POST"){
        switch (req.url){
            case '/musicData':
                req.on("data", chunk => {
                    obj = JSON.parse(chunk);
                    fs.appendFile("song.txt", chunk + '\n', (err) => { //skal denne være asynkron?
                        if (err) console.log(err)
                    });
                }).on("end", () => {;
                    res.writeHead(202);
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
                        fs.mkdirSync(host + '/users' + '/' + user);
                        fs.mkdirSync(host + '/users' + '/' + user + '/songs');
                        res.writeHead(201);
                        res.end();
                    }
                });
                break;
            case '/appendTrack':
                
            default: console.log('30 ' + req.url);
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
                    console.log("ended " + data);
                    obj = JSON.parse(data);
                    let creationDate = new Date();
                    let songs = fs.readdirSync(host + '/users/' + obj.user + '/songs/');
                    if (songs.includes(obj.song)){
                        req.writeHead(200);
                        req.write("You have already created a song by that name!");
                        req.end();
                    }
                    else {
                        fs.writeFile(host + "/users/" + obj.user + "/songs/" + obj.song, "Date created: " + creationDate + 
                        "\nCreated by: " + obj.user + "\nOther contributors: ", (error) => {
                            if (error) throw error;
                            console.log("file created succesfully");
                        });
                    }
                    res.writeHead(201);
                    res.end();
                });
                break;
            default: console.log("yooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo");
        }
    }
}).listen(port);