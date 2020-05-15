const fs=require("fs");
const host = process.cwd() + "/PublicResources/webpage/SavedFiles/";
const userFunc = require("./nichUsers.js");
const practical = require("./nichPractical");

exports.getNotifications = function(userName){
    let notificationsFilePath = host + 'users/' + userName + 'notifications.txt';
    let notifications = fs.readFileSync(notificationsFilePath, 'utf-8').split('\n');
    return notifications;
}

exports.appendNotification = function(notification, user){
    let notificationsFilePath = host + 'users/' + user + "/notifications.txt";
    fs.appendFileSync(notificationsFilePath, notification);
}

exports.handleNewUserRequest = function(requestedName){
    if (userFunc.userExists(requestedName)){
        return "Error 1";
    }
    else {
        userFunc.createUser(requestedName);
        return "Success";
    }
}

exports.createUser = function(userName){
    let userPath = host + 'users/' + userName
    fs.mkdirSync(userPath);
    fs.mkdirSync(userPath + '/songs');
    fs.writeFileSync(userPath + '/tracks.txt', "");
    fs.writeFileSync(userPath + '/suggestions.txt', "");
    fs.writeFileSync(userPath + "/contributions.txt", "");
    fs.writeFileSync(userPath + "/notifications.txt", "");
}

exports.deleteUser = function(userName){
    let userPath = host + 'users/' + userName + '/';
    if (!userFunc.userExists(userName)){
        return "Error 1";
    }
    else {
        practical.clearFilesFromDirectory(userPath + 'songs/');
        fs.rmdirSync(userPath + 'songs/');
        practical.clearFilesFromDirectory(userPath);
        fs.rmdirSync(userPath);
        return "Success";
    }
}

exports.userExists = function(userName){
    return fs.readdirSync(host + 'users').includes(userName);
}
