/**
 * A lobby game is an entry in the database that indicates a user wants to play a game. The game is shown in the lobby for other users to accept.
 * @param {string} id Use crypto.randomUUID() to get a new id.
 * @param {string} session_id Creator session id. Not to be shown to the user.
 * @param {String} username The display name, this can also be "Anonymous"
 * @param {Date} date Created time in UTC timezone.
 */
function LobbyGame(id, session_id, username, date) {
    this.id = id;
    this.session_id = String(session_id);
    this.username = username;
    this.date = date || Date.now();
}

LobbyGame.From = function (obj) {
    return new LobbyGame(obj.creator, new Date(obj.date));
}

// Object without the session id for the web socket
LobbyGame.prototype.ViewData = function() {
    return {
        id: this.id,
        username: this.username,
        date: this.date,
    }
}

module.exports = LobbyGame;