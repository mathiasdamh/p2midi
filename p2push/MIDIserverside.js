const http = require('http');
const fs = require('fs');

const host = 'C:/Users/m4dsw/git-main/p2midi/p2push/';

const port = 8000;



function getTrack(user, id){
    let tracks = (fs.readFileSync(host + 'users/' + user + '/tracks.txt', "utf-8")).split('\n');
    let re = RegExp(id);
    let i = 0;
    let flag = false;
    while (i < tracks.length && flag === false){
        if (re.test(tracks[i])){
            flag = true;
        }
    }
    if (flag){
        return tracks[i];
    }
    else return false;
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
            case '/trackData':
                let trackData = [];
                req.on("data", chunk => {
                    trackData.push(chunk);
                }).on("end", () => {
                    obj = JSON.parse(data.toString());
                    fs.appendFile("song.txt", chunk + '\n', (err) => { //skal denne være asynkron?
                        if (err) console.log(err)
                    res.writeHead(202);
                    res.end();
                    });
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
                        fs.mkdirSync(host + '/users/' + user);
                        fs.mkdirSync(host + '/users/' + user + '/songs');
                        res.writeHead(201);
                        res.end();
                    }
                });
                break;
            case '/appendTrack':
                let data = [];
                let usersArr = [];
                let track;
                req.on("data", (chunk) => {
                    data.push(chunk);
                }).on("end", () => {
                    obj = JSON.parse(data.toString());
                    console.log(obj);
                    if (fs.readdirSync(host + 'users').includes(obj.track.owner)){ // MANGLER ERROR HANDLING
                        track = getTrack(obj.track.owner, obj.track.id); //HVIS DENNE ER FALSE
                        console.log(track);
                    }
                    else {
                        res.writeHead(400);
                        res.end();
                    }
                    usersArr = fs.readdirSync(host + 'users');
                    songPath = host + 'users/' + obj.song.owner + '/songs/' + obj.song.name + '.txt';
                    if (usersArr.includes(obj.song.owner) && fs.readdirSync(host + 'users/' + obj.song.owner + '/songs/').includes(obj.song.name + '.txt')){ // MANGLER ERROR HANDLING
                        fs.appendFileSync(songPath, track + '\n');
                        console.log('boh');
                    }
                });
                break;
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
                    console.log("ended " + data);
                    obj = JSON.parse(data);
                    let creationDate = new Date();
                    let songs = fs.readdirSync(host + '/users/' + obj.user + '/songs/');
                    if (songs.includes(obj.song)){
                        res.writeHead(200, {'Content-Type': 'text'});
                        res.write("You have already created a song by that name!");
                        res.end();
                    }
                    else {
                        fs.writeFile(host + "/users/" + obj.user + "/songs/" + obj.song + '.txt', "Date created: " + creationDate +
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
