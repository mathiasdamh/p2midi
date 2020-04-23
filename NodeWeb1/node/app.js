const http = require('http');
const fs=require("fs");
const path=require("path");
const { Midi } = require('@tonejs/midi')
const { parse } = require('querystring');

const hostname = '127.0.0.1';
const port = 8080;

const verbose = true;

//https://blog.todotnet.com/2018/11/simple-static-file-webserver-in-node-js/
//https://stackoverflow.com/questions/16333790/node-js-quick-file-server-static-files-over-http

const publicResources="NodeWeb1/node/PublicResources/";
//secture file system access as described on
//https://nodejs.org/en/knowledge/file-system/security/introduction/
const rootFileSystem=process.cwd();
function securePath(userPath){
  if (userPath.indexOf('\0') !== -1) {
    // could also test for illegal chars: if (!/^[a-z0-9]+$/.test(filename)) {return undefined;}
    return undefined;

  }
  userPath= publicResources+userPath;

  let p= path.join(rootFileSystem,path.normalize(userPath));
  //console.log("The path is:"+p);
  return p;
}

/* more accurate error codes should be sent to client */

/**/

function fileResponse(filename,res){
  const sPath=securePath(filename);
  console.log("Reading:"+sPath);
  fs.readFile(sPath, (err, data) => {
    if (err) {
      console.error(err);
      res.statusCode=404;
      res.setHeader('Content-Type', 'text/txt');
      res.write("File Error:"+String(err));
      res.end("\n");
    }else {
      res.statusCode = 200;
      res.setHeader('Content-Type', guessMimeType(filename));
      res.write(data);
      res.end('\n');
    }
  })
}
const server = http.createServer((req, res) => {
    let date=new Date();
    console.log("GOT: " + req.method + " " +req.url);
    if(req.method=="GET"){
        switch(req.url){
            case "/":
                fileResponse("index.html",res);
            break;
            default:
                fileResponse(req.url,res);
            break;
        }
    }else if(req.method=="POST"){ // Tager sig af POST requests
        switch(req.url){
            case "/features/midi/newMidiFile": // Denne URL hvis man gerne vil lave en ny MIDI fil
                                               // Specificeret under Indspilning.html

                let body = ''; // En tom string til at holde den data som
                               // Bliver sendt med POST requesten

                console.log("start write midi file");
                req.on('data', chunk =>{ // Samler dataet sendt i POST requesten og
                                         // samler det sammen i body
                    if(verbose)console.log("chunk: "+chunk);

                    body += chunk.toString();

                    if(verbose)console.log("body: "+body);
                });
                req.on('end', ()=>{
                    if(verbose)console.log("before parse: "+typeof body);

                    body = JSON.parse(body); // Dataet er blevet sendt som en streng, og
                                             // her bliver det omdannet til et object

                    if(verbose)console.log("after parse: "+typeof body);

                    // Skriver dataet ud til en MIDI fil
                    fs.writeFileSync("output.mid", new Buffer(Object.values(body)));

                    console.log("end write midi file");
                    res.end('end write midi file');
                });
                res.end('unexpected ending ' + req.url);
            break;
            default:
                res.end('unknown POST request');
            break;
        }
    };
});

//better alternative: use require('mmmagic') library
function guessMimeType(fileName){
  const fileExtension=fileName.split('.').pop().toLowerCase();
  console.log(fileExtension);
  const ext2Mime ={ //Aught to check with IANA spec
    "txt": "text/txt",
    "html": "text/html",
    "ico": "image/ico", // CHECK x-icon vs image/vnd.microsoft.icon
    "js": "text/javascript",
    "json": "application/json",
    "css": 'text/css',
    "png": 'image/png',
    "jpg": 'image/jpeg',
    "wav": 'audio/wav',
    "mp3": 'audio/mpeg',
    "svg": 'image/svg+xml',
    "pdf": 'application/pdf',
    "doc": 'application/msword',
    "docx": 'application/msword'
   };
    //incomplete
  return (ext2Mime[fileExtension]||"text/plain");
}

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

//https://www.w3schools.com/nodejs/nodejs_url.asp
