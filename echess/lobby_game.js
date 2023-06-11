/**
 * A lobby game is an entry in the database that indicates a user wants to play a game. The game is shown in the lobby for other users to accept.
 * @param {string} id Use crypto.randomUUID() to get a new id.
 * @param {string} session_id Creator session id. Not to be shown to the user.
 * @param {String} username The display name, this can also be "Anonymous"
 * @param {Date} date Created time in UTC timezone.
 * @param {string} color The game is chess, white, black, or random.
 */
function LobbyGame(id, session_id, username, date, color) {
    this.id = id;
    this.session_id = String(session_id);
    this.username = username;
    this.date = date || Date.now();
    this.color = color;
    if ("white black random".split(" ").indexOf(color) < 0) {
        throw new Error("Invalid lobby game color")
    }
}

// Object without the session id for the web socket
LobbyGame.prototype.ViewData = function() {
    return {
        id: this.id,
        username: this.username,
        date: this.date,
        color: this.color,
    }
}

module.exports = LobbyGame;