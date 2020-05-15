let playerBPM = 0; // beats per minute, styrer afsplinnings hastighed
let midiPPQ = 0; // pulses per quarter note, hvor mange midi beskeder per 1/4 node.
let playerTime = 0; // tiden der tæller op
let playerEnd = 0; // slut tiden

let midi; // holder midi data som JSON
let playTimer; // holder intervallet der tæller op.
let timerRunning = false; // sørger for der kun er et kørende interval
let fileLoaded = false;

// Indlæser
MIDI.loadPlugin({
    soundfontUrl: "FluidR3_GM/",
    onsuccess: function() {console.log("ready");},
});

/* Starting the timer for the song.
 * Makes sure to not start another if one is already running
 */
function startTimer(){
    if(!timerRunning){
        if(playerEnd.toFixed(1) == playerTime.toFixed(1)) playerTime = 0;
        console.log("started timer");

        // Starter et interval der tæller op
        playTimer = setInterval(function(){
            if(MIDI.Player.playing) {
                playerTime += 0.01;
                updateTime(playerTime, playerEnd);
            }

        } , 10);
        // Sørger for at intervallet ikke dobbelt startes
        timerRunning = !timerRunning;
    }
};

// Stopper timeren helt og resetter playerTime
function stopTimer(){
    console.log("stopped timer");
    clearInterval(playTimer);

    playerTime = 0;
    updateTime(playerTime, playerEnd);

    if(timerRunning) timerRunning = !timerRunning;
};

// Pauser timeren
function pauseTimer(){
    console.log("paused timer");
    clearInterval(playTimer);

    // Player time bliver sat til currentTime, så den ikke tæller for meget
    playerTime = (MIDI.Player.currentTime/1000);

    if(timerRunning) timerRunning = !timerRunning;
};

// basic funktion til at updatere noget HTML
function updateTime(current, end){
    document.getElementById('timer').innerHTML =
    current.toFixed(2) + " / " + end.toFixed(2)
}

// basic funktion til at updatere noget HTML
function updateBpmPpq(){
    document.getElementById('PPQ').innerHTML = "PPQ: "+midiPPQ;
    document.getElementById('BPM').innerHTML = "BPM: "+playerBPM;
}

// Indlæser alle instrumenter fra alle tracks



/* ####################################################
 * ####################################################
 * ################     KNAPPER     ###################
 */

/* Knap der afspiller sangen, hvis MIDI.player ikke spiller, og stopper
*  den hvis den spiller.
*/
function btnPlay(){
    playerBPM = MIDI.Player.BPM

    console.log(MIDI.Player.playing + " start btn_play()");
    if (MIDI.Player.playing) {
        MIDI.Player.stop();
        stopTimer();
    } else {
        MIDI.Player.stop();
        MIDI.Player.start();
        startTimer();
    };
};

/* Ligesom btn_play, men i stedet afspiller den fra der man pausede.
*/
function btnPause(){
    console.log(MIDI.Player.playing + " start btn_pause()");
    if (MIDI.Player.playing) {
        MIDI.Player.pause();
        pauseTimer();
    } else {
        MIDI.Player.resume();
        startTimer();
    };
}

/* Knap til at loade en fil.
*/
function btnLoad(){
    let fileName = document.getElementById('midiFile').value;
    loadMidiFile(fileName, true);
}

/* Knap til at skifte BPM
 */
function btnChangeBPM(){
    console.log("changed BPM");
    MIDI.Player.BPM = document.getElementById('inputBPM').value;
    updateBpmPpq();
}

/* Knap event listeners
*/
document.getElementById('btnPlay').addEventListener("click", btnPlay);
document.getElementById('btnLoad').addEventListener("click", btnLoad);
document.getElementById('btnPause').addEventListener("click", btnPause);
document.getElementById('btnChangeBPM').addEventListener("click", btnChangeBPM);
