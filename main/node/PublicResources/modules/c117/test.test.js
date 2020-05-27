const music = require('./serverMusic');
const users = require('./serverUsers');

const host = process.cwd() + "/PublicResources/webpage/SavedFiles/";

/*
test('if the user exists, return true, else return false', () => {
    expect(users.userExists("adam")).toBe(true);
    expect(users.userExists("adam2")).toBe(false);
});

test('return appropriate error/success message', () => {
    expect(music.handleAppendRequest('adam', 'adam3', 'charles', 'charles2', 'charles')).toBe("Track appended");
    expect(music.handleAppendRequest('adam', 'adam2', 'charles', 'charles2', 'charles')).toBe("The song already contains this track");
    expect(music.handleAppendRequest('adam23', 'adam3', 'charles', 'charles2', 'charles')).toBe("The specified track owner does not exist!");
    expect(music.handleAppendRequest('adam', 'adam10', 'charles', 'charles2', 'charles')).toBe("The specified user has no such track!");
    expect(music.handleAppendRequest('adam', 'adam3', 'charles3', 'charles2', 'charles')).toBe("The specified song owner does not exist!");
    expect(music.handleAppendRequest('adam', 'adam3', 'charles', 'charles2s', 'charles')).toBe("The specified user has no such song!");
    expect(music.handleAppendRequest('adam', 'adam7', 'charles', 'charles2', 'charless')).toBe("An unknown error occurred when attempting to append the track");
    expect(music.handleAppendRequest('adam', 'adam8', 'charles', 'charles2', 'adam')).toBe("Track suggested");
    expect(music.handleAppendRequest('adam', 'adam1', 'charles', 'charles2', 'adam')).toBe("The track has already been suggested to this song");
});

test('return appropriate error/success message', () => {
    expect(users.handleNewUserRequest("asdf1")).toBe("User created");
    expect(users.handleNewUserRequest("adam")).toBe("Username is taken!");
});

test('return the line number on which the track is stored if the track is in the file (0 index), else return false', () => {
    expect(music.trackExistsInFile("adam3", host + "users/adam/tracks.txt")).toBe(3);
    expect(music.trackExistsInFile("adam", host + "users/adam/tracks.txt")).toBe(false);
});

test('return appropriate error/success message', () => {
    expect(music.handleCreateSongRequest("song1", "charles")).toBe("A song by this name already exists!");
    expect(music.handleCreateSongRequest("song1", "notAUser")).toBe("An unknown error occurred when attempting to create the song");
    expect(music.handleCreateSongRequest("song4", "charles")).toBe("Song created");
});
*/

test('returns true if the track is suggested, else return false', () => {
    expect(music.isSuggested("adam1", "charles1", host + "users/charles/suggestions.txt")).toBe(1);
    expect(music.isSuggested("adam3", "charles1", host + "users/charles/suggestions.txt")).toBe(4);
    expect(music.isSuggested("adam1", "charles2", host + "users/charles/suggestions.txt")).toBe(5);
})

test("return appropriate status message", () => {
    expect(music.acceptSuggestion("notAUser", "song1", "asdf12")).toBe("An unknown error occurred while accepting the suggestion!");
    expect(music.acceptSuggestion("charles", "charles1", "adam4")).toBe("Could not find the specified suggestion");
    expect(music.acceptSuggestion("charles", "charles3", "adam1")).toBe("Could not accept the suggestion, as the song no longer exists!");
    expect(music.acceptSuggestion("charles", "charles2", "adam1")).toBe("The song already contains the track! Deleting from suggestions");
    expect(music.acceptSuggestion("charles", "charles1", "adam2")).toBe("Suggestion accepted");
});

test("return the appropriate status message", () => {
    expect(music.rejectSuggestion("notAUser", "song1", "asdf12")).toBe("An unknown error occurred when attempting to reject the suggestion");
    expect(music.rejectSuggestion("charles", "charles1", "adam4")).toBe("The suggestion has already been deleted"); /*skal ændres*/
    expect(music.rejectSuggestion("charles", "charles1", "adam3")).toBe("Success");
});

/*
music.deleteSong(host+"users/charles/songs/song4.txt");
users.deleteUser("asdf1");
*/
