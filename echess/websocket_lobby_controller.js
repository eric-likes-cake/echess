const crypto = require("crypto");
const LobbyGame = require("./lobby_game");
const WebSocketController = require("./websocket_controller");

/**
 * @param {WebSocketController} wsc
 */
function WebSocketLobbyController(wsc) {
    // game id -> game.
    this.lobby = new Map();
    this.wsc = wsc;
}

WebSocketLobbyController.prototype.PlayGameCommand = function(socket, data) {
    const colors = "white black random".split(" ");
    
    if (colors.indexOf(data) >= 0) {
        CreateLobbyGame.call(this, socket, data);
    }
    else {
        JoinGame.call(this, socket, data);
    }
}

WebSocketLobbyController.prototype.ListGameCommand = function(socket) {
    const games = Array.from(this.lobby.values()).map(game => LobbyGame.prototype.ViewData.call(game));
    socket.send(this.wsc.Response("game-list", games));
}

function CreateLobbyGame(socket, color) {
    const {session_id, username} = this.wsc.state.get(socket);

    // add a new game to the lobby
    const game = new LobbyGame(crypto.randomUUID(), session_id, username, new Date(), color);
    this.lobby.set(game.id, game);

    this.wsc.Broadcast("new-game", game.ViewData());
}

function JoinGame(socket, id) {

    // delete the lobby game
    const entry = this.wsc.state.get(socket);
    const game = this.lobby.get(id);

    if (!this.lobby.delete(id)) {
        return;
    }

    // send both players the game url to join the game
    const response = this.wsc.Response("game-url", `/game/${id}`)
    socket.send(response);
    if (this.wsc.socket_map.has(game.session_id)) {
        const other = this.wsc.socket_map.get(game.session_id);
        other.send(response);
    }

    this.wsc.Broadcast("remove-games", [id]);

    // These calls shouldn't be necessary because they're going to leave the page when they get the game url
    // after they leave, they will disconnect and their games will be removed automatically by the web socket controller.
    this.DeleteUserGames(game.session_id);
    this.DeleteUserGames(entry.session_id);
}

WebSocketLobbyController.prototype.DeleteUserGames = function(session_id) {
    const games = [];
    for (const game of this.lobby.values()) {
        if (game.session_id === session_id) {
            games.push(game);
            this.lobby.delete(game.id);
        }
    }
    const ids = games.map(game => game.id);
    this.wsc.Broadcast("remove-games", ids);
}

module.exports = WebSocketLobbyController