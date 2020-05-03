// Dette sørger for at de installerede biblioteker bliver inkluderet. plus serveren bliver startet ved http.
let express = require("express"),
    app = express(),
    http = require("http").Server(app).listen(8080),
    upload = require("express-fileupload");
//// denne funktion sørger for at der er mulighed for at uploade.
app.use(upload())

console.log("Server Started")

// Dette sørger for at filer som css bliver brugt, når serveren starter op. (Måske ikke nødvendig)
app.use(express.static('public'));

// laver en get request på filen upload.html, som gør at filen kan ses i browseren når serveren laver en get request!
app.get("/",function(req,res){
    res.sendFile(__dirname + "/upload.html");
})

// Her bliver der brugt noget fra express biblioteket, som sørger for at en fil bliver uploadet et bestemt sted i mappen, ved hjælp
// af en post request, som sender det til serveren.
app.post("/",function(req,res){
    if(req.files){
        let file = req.files.filename,
            filename = file.name;
        file.mv("C:/Users/Niklas/Documents/GitHub/p2midi/P2musik/server/upload/"+filename,function(err){
            if(err){
                console.log(err)
                res.send("Error Occured")
            } else{
                console.log("File Uploaded");
                res.send("File Uploaded");
            }
        })
    }
})