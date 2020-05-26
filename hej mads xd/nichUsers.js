function getNotifications(userName){
    let notificationsFilePath = host + 'users/' + userName + 'notifications.txt';
    let notifications = fs.readFileSync(notificationsFilePath, 'utf-8').split('\n');
    return notifications;
}

function appendNotification(notification, user){
    let notificationsFilePath = host + 'users/' + user + "/notifications.txt";
    fs.appendFileSync(notificationsFilePath, notification);
}

function handleNewUserRequest(requestedName){
    if (userExists(requestedName)){
        return "Username is taken!";
    }
    else {
        createUser(requestedName);
        return "User created";
    }
}

function createUser(userName){
    let userPath = host + 'users/' + userName
    fs.mkdirSync(userPath);
    fs.mkdirSync(userPath + '/songs');
    fs.writeFileSync(userPath + '/tracks.txt', "");
    fs.writeFileSync(userPath + '/suggestions.txt', "");
    fs.writeFileSync(userPath + "/contributions.txt", "");
    fs.writeFileSync(userPath + "/notifications.txt", "");
}

function deleteUser(userName){
    let userPath = host + 'users/' + userName + '/';
    if (!userExists(userName)){
        return "An unknown error occurred when deleting the user from the server!";
    }
    else {
        clearFilesFromDirectory(userPath + 'songs/');
        fs.rmdirSync(userPath + 'songs/');
        clearFilesFromDirectory(userPath);
        fs.rmdirSync(userPath);
        return "User deleted";
    }
}

function userExists(userName){
    return fs.readdirSync(host + 'users').includes(userName);
}

