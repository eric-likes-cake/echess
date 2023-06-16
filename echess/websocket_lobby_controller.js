const crypto = require("crypto");
const LobbyGame = require("./lobby_game");
const User = require("./user");
const Game = require("./game");
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
    // copy and delete the lobby game
    const lg = this.lobby.get(id);

    if (!this.lobby.delete(id)) {
        return;
    }

    // determine who the two users are, this user and the one who created the game
    const socket1 = socket;
    const user1 = this.wsc.state.get(socket1);
    const socket2 = this.wsc.socket_map.get(lg.session_id);
    const user2 = this.wsc.state.get(socket2);

    // use the user id if they're logged in, otherwise the session id.
    const joiner = user1.user_id?.length ? user1.user_id : user1.session_id;
    const creator = user2.user_id?.length ? user2.user_id : user2.session_id;

    let white, black;

    // choose who will be white and who will be black
    if (lg.color === "white") {
        white = creator;
        black = joiner;
    }
    else if (lg.color === "black") {
        white = joiner;
        black = creator;
    }
    else {
        white = RandomNumber(2) === 0 ? joiner : creator;
        black = white === joiner ? creator : joiner;
    }

    const game = new Game.Game(lg.id, white, black, []);
    const game_svc = new Game.RedisService(this.wsc.client);

    game_svc.Create(game).then(() => {
        // send both players the game url to join the game
        const response = this.wsc.Response("game-url", `/game/${id}`)
        socket1.send(response);
        socket2.send(response);
    })
    .catch(console.error);

    this.wsc.Broadcast("remove-games", [id]);

    // These calls shouldn't be necessary because they're going to leave the page when they get the game url.
    // after they leave, they will disconnect and their games will be removed automatically by the web socket controller.
    // this.DeleteUserGames(user1.session_id);
    // this.DeleteUserGames(user2.session_id);
}

function RandomNumber(max) {
    return Math.floor(Math.random() * max);
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