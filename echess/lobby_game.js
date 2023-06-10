/**
 * Creates a lobby game object..
 * @param {string} creator Creator name
 * @param {Date} date Created time in UTC timezone.
 */
function LobbyGame(creator, date) {
    this.creator = String(creator);
    this.date = date || Date.now();
}

LobbyGame.From = function (obj) {
    return new LobbyGame(obj.creator, new Date(obj.date));
}

LobbyGame.prototype.toString = function() {
    const date = this.date.toLocaleDateString("en-US", {timeZone: "UTC"});
    return `LobbyGame(${this.creator}, ${date})`;
}

module.exports = LobbyGame;