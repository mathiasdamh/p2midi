const music = require('./nichMusic');
const users = require('./nichUsers');

const host = process.cwd() + "/PublicResources/webpage/SavedFiles/";

test('creates a new user if the name is not taken', () => {
    expect(users.handleNewUserRequest("adam")).toBe("Username is taken!");
    expect(users.handleNewUserRequest("adam2")).toBe("User created");
});

test('if the user exists, return true, else return false', () => {
    expect(users.userExists("adam")).toBe(true);
    expect(users.userExists("adam2")).toBe(false);
});

test("if the track exists in the song return true, else return false", () => {
    expect(music.trackExistsInFile("adam3", host + "users/adam/tracks.txt")).toBe(true);
    expect(music.trackExistsInFile("adam", host + "users/adam/tracks.txt")).toBe(false);
    expect(music.trackExistsInFile("2", host + "users/adam/tracks.txt")).toBe(false);
});

test('return appropriate error/success message', () => {
    expect(music.handleAppendRequest('adam', 'adam3', 'charles', 'charles2', 'charles')).toBe("Track appended");
    expect(music.handleAppendRequest('adam', 'adam2', 'charles', 'charles2', 'charles')).toBe("The song already contains this track");
    expect(music.handleAppendRequest('adam23', 'adam3', 'charles', 'charles2', 'charles')).toBe("The specified track owner does not exist!");
    expect(music.handleAppendRequest('adam', 'adam10', 'charles', 'charles2', 'charles')).toBe("The specified user has no such track!");
    expect(music.handleAppendRequest('adam', 'adam3', 'charles3', 'charles2', 'charles')).toBe("The specified song owner does not exist!");
    expect(music.handleAppendRequest('adam', 'adam3', 'charles', 'charles2s', 'charles')).toBe("The specified user has no such song!");
    expect(music.handleAppendRequest('adam', 'adam3', 'charles', 'charles2', 'charless')).toBe("An unknown error occurred when attempting to append the track");
    expect(music.handleAppendRequest('adam', 'adam3', 'charles', 'charles2', 'adam')).toBe("Track suggested");
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

test('returns true if the track is suggested, else return false', () => {
    expect(music.isSuggested("adam0", "charles1", host + "users/charles/songs/song1.txt")).toBe(true);
    expect(music.isSuggested("adam4", "charles1", host + "users/charles/songs/song1.txt")).toBe(false);
})
