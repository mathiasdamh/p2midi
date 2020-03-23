if (typeof (console) === "undefined") var console = {
  log: function() {}
};
// Toggle between Pause and Play modes.
var pausePlayStop = function(stop) {
  var d = document.getElementById("pausePlayStop");
  if (stop) {
    MIDI.Player.stop();
    d.src = "images/play.png";
  } else if (MIDI.Player.playing) {
    d.src = "images/play.png";
    MIDI.Player.pause(true);
  } else {
    d.src = "images/pause.png";
    MIDI.Player.resume();
  }
};
eventjs.add(window, "load", function(event) {
  var link = document.createElement("link");
  link.href = "//fonts.googleapis.com/css?family=Oswald";
  link.ref = "stylesheet";
  link.type = "text/css";
  document.body.appendChild(link);
  var link = document.createElement("link");
  link.href = "//fonts.googleapis.com/css?family=Andada";
  link.ref = "stylesheet";
  link.type = "text/css";
  document.body.appendChild(link);

  MIDI.loader = new sketch.ui.Timer;
  MIDI.loadPlugin({
    soundfontUrl: "./soundfont/",
    onprogress: function(state, progress) {
      MIDI.loader.setValue(progress * 100);
    },
    onsuccess: function() {
      /// this is the language we are running in
      var title = document.getElementById("title");
      title.innerHTML = "Sound being generated with " + MIDI.api + " " + JSON.stringify(MIDI.supports);

      /// this sets up the MIDI.Player and gets things going...
      player = MIDI.Player;
      player.timeWarp = 2; // speed the song is played back
      player.loadFile(song[songid++ % song.length]);

      console.log(player);

      MIDIPlayerPercentage(player);
    }
  });
});

/////////////////////////////
// NOGET JEG HAR SKREVET: ///
/////////////////////////////
function change_speed(speed, resumePlay){
    formerSpeed = player.timeWarp;
    player.timeWarp = speed;
    if(resumePlay) player.loadFile(song[songid], player.start);
    console.log("Changed timeWarp speed from "+formerSpeed+" to "+speed);
}

function noteNumber_to_name(noteNum){
    let noteName = ' ';
    let octave = Math.floor(noteNum/12)-1;
    switch ( (noteNum%12) ) {
            case 0:  noteName = 'C';
            break;
            case 1:  noteName = 'C#';
            break;
            case 2:  noteName = 'D';
            break;
            case 3:  noteName = 'D#';
            break;
            case 4:  noteName = 'E';
            break;
            case 5:  noteName = 'F';
            break;
            case 6:  noteName = 'F#';
            break;
            case 7:  noteName = 'G';
            break;
            case 8:  noteName = 'G#';
            break;
            case 9: noteName = 'A';
            break;
            case 10:  noteName = 'A#';
            break;
            case 11:  noteName = 'B';
            break;
        default:
    }
    noteName = noteName + octave;
    return noteName;
}

function noteName_to_number(noteNam){
    if(noteNam.length > 3){
        console.log("Note name too big");
        return -1;
    }
    let note;
    let noteNum;
    if(noteNam.length === 3) {
        note = noteNam.slice(0, 2)
    } else {
        note = noteNam.slice(0, 1)
    }
    let octave = Number(noteNam.slice(-1))+1;
    switch ( note ) {
            case 'C':   noteNum = 0;
            break;
            case 'C#':  noteNum = 1;
            break;
            case 'D':   noteNum = 2;
            break;
            case 'D#':  noteNum = 3;
            break;
            case 'E':   noteNum = 4;
            break;
            case 'F':   noteNum = 5;
            break;
            case 'F#':  noteNum = 6;
            break;
            case 'G':   noteNum = 7;
            break;
            case 'G#':  noteNum = 8;
            break;
            case 'A':   noteNum = 9;
            break;
            case 'A#':  noteNum = 10;
            break;
            case 'B':   noteNum = 11;
            break;
        default: console.log("Not a note name");
                 return -1;
        break;
    }
    return (noteNum + 12 * octave);
}

function check_if_number(_note){
    if(isNaN(_note)){
        _note = noteName_to_number(_note);
    }
    return _note;
}

function btn_speed(){
    change_speed(document.getElementById('playback_speed').value, true);
}

function btn_notePlay(){
    let note = document.getElementById('note_Value').value

    try{
        note = check_if_number(note);
        MIDI.noteOn(0, note, 120, 0);
        console.log("Played note "+noteNumber_to_name(note)+", value: "+note);
    }catch(e){
        console.log(e);
    };
}

function btn_chordPlayMajor(){
    let note = document.getElementById('note_Value').value;

    try{
        note = check_if_number(note);
        MIDI.chordOn(0, [note, Number(note)+4, Number(note)+7], 120, 0);
        console.log("Played major chord "+noteNumber_to_name(note)+
                    ",value: "+note+", "+(Number(note)+4)+", "+(Number(note)+7));
    }catch(e){
        console.log(e);
    };
}

function btn_chordPlayMinor(){
    let note = document.getElementById('note_Value').value;

    try{
        note = check_if_number(note);
        MIDI.chordOn(0, [note, Number(note)+3, Number(note)+7], 120, 0);
        console.log("Played minor chord "+noteNumber_to_name(note)+
                    ",value: "+note+", "+(Number(note)+3)+", "+(Number(note)+7));
    }catch(e){
        console.log(e);
    };
}

function btn_sequenceNotePlay(){
    let sequence = document.getElementById('note_Sequence').value.split(' ');

    for (let i = 0; i < sequence.length; i++) {
        try{
            sequence[i] = check_if_number(sequence[i]);
            MIDI.noteOn(0, sequence[i], 120, (i/4)*player.timeWarp);

        }catch(e){
            console.log(e);
        };
    }
    console.log("Playing sequence: "+ document.getElementById('note_Sequence').value);
}
// Tilføjer event listeners til knapperne
let test1 = document.getElementById('btn_speed');
test1.addEventListener("click", btn_speed);

let test2 = document.getElementById('btn_notePlay');
test2.addEventListener("click", btn_notePlay);

let test3 = document.getElementById('btn_chordPlayMajor');
test3.addEventListener("click", btn_chordPlayMajor);

let test4 = document.getElementById('btn_chordPlayMinor');
test4.addEventListener("click", btn_chordPlayMinor);

let test5 = document.getElementById('btn_sequenceNotePlay');
test5.addEventListener("click", btn_sequenceNotePlay);

//////////////////////////
//////////////////////////
// Afspilningstiden
var MIDIPlayerPercentage = function(player) {
  // update the timestamp
  var time1 = document.getElementById("time1");
  var time2 = document.getElementById("time2");
  var capsule = document.getElementById("capsule");
  var timeCursor = document.getElementById("cursor");
  //
  eventjs.add(capsule, "drag", function(event, self) {
    eventjs.cancel(event);
    player.currentTime = (self.x) / 420 * player.endTime;
    if (player.currentTime < 0) player.currentTime = 0;
    if (player.currentTime > player.endTime) player.currentTime = player.endTime;
    if (self.state === "down") {
      player.pause(true);
    } else if (self.state === "up") {
      player.resume();
    }
  });
  //
  function timeFormatting(n) {
    var minutes = n / 60 >> 0;
    var seconds = String(n - (minutes * 60) >> 0);
    if (seconds.length == 1) seconds = "0" + seconds;
    return minutes + ":" + seconds;
  };
  player.getNextSong = function(n) {
    var id = Math.abs((songid += n) % song.length);
    player.loadFile(song[id], player.start); // load MIDI
  };
  player.setAnimation(function(data, element) {
    var percent = data.now / data.end;
    var now = data.now >> 0; // where we are now
    var end = data.end >> 0; // end of song
    if (now === end) { // go to next song
      var id = ++songid % song.length;
      player.loadFile(song[id], player.start); // load MIDI
    }
    // display the information to the user
    timeCursor.style.width = (percent * 100) + "%";
    time1.innerHTML = timeFormatting(now);
    time2.innerHTML = "-" + timeFormatting(end - now);
  });
};
// Begin loading indication.
// MIDI files from Disklavier World
var songid = 0;
