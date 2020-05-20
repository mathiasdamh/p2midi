document.body.onload = main;

let currentUser = "mads" // Bliver brugt til at gemme tracks.

let trackDisplay = false; // For displaying tracks
let trackOtherDisplay = false; // For displaying other tracks
let songDisplay = false; // For displaying songs
/* Updates information about the current entered track
*/
async function btnCheckSuggestions(){
    let suggestions = await getSuggestions(currentUser);
    let suggestionsArr = removeEmptyLines(suggestions.split("\n"));

    let suggestionList = document.getElementById("suggestionList");

    suggestionList.innerHTML = "";

    for (var i = 0; i < suggestionsArr.length; i++) {
        let tempSplit = suggestionsArr[i].split("|");
        let suggestTrack = JSON.parse(tempSplit[3]);
        let trackName = suggestTrack.name;
        let trackId = suggestTrack.id;
        let LIelement = document.createElement("li");
        LIelement.innerHTML = "From "+tempSplit[2]+", suggesting "+tempSplit[1]+"\'s track: \""+trackName+"\" to your song: "+tempSplit[0]+"   ";

        let acceptButton = document.createElement("input");
        acceptButton.setAttribute("type", "button");
        acceptButton.setAttribute("value", "Accept");
        acceptButton.setAttribute("class", "button");
        acceptButton.onclick = function(){
            acceptSuggestion(currentUser, tempSplit[0], trackId);
            LIelement.parentNode.removeChild(LIelement);
        }
        let rejectButton = document.createElement("input");
        rejectButton.setAttribute("type", "button");
        rejectButton.setAttribute("value", "Reject");
        rejectButton.setAttribute("class", "button");
        rejectButton.onclick = function(){
            rejectSuggestion(currentUser, tempSplit[0], trackId);
            LIelement.parentNode.removeChild(LIelement);
        }
        LIelement.appendChild(acceptButton);
        LIelement.appendChild(rejectButton);
        LIelement.setAttribute("class", "suggestion");

        suggestionList.appendChild(LIelement);
    }
}

document.getElementById('btnCheckSuggestions').addEventListener("click", btnCheckSuggestions);