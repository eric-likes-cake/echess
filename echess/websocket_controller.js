const LobbyController = require("./websocket_lobby_controller");
const GameController = require("./websocket_game_controller").default;
const WebSocket = require("ws");
const User = require("./user");

/**
 * Websocket controller for handling requests and responses
 * @param {WebSocketServer} wss Web socket server
 * @param client redis client
 */
function WebSocketController(wss, client) {
    this.wss = wss;
    this.client = client;

    // socket -> state object for each user
    this.state = new Map();
    // session id -> socket
    this.socket_map = new Map();

    this.lobby_controller = new LobbyController(this);
    this.game_controller = new GameController(this);

    // web socket command handlers
    this.commands = new Map();
    this.commands.set("auth", this.AuthenticateCommand.bind(this));
    
    // lobby controller handlers
    this.commands.set("lobby", this.lobby_controller.JoinLobbyCommand.bind(this.lobby_controller));
    this.commands.set("play-game", this.lobby_controller.PlayGameCommand.bind(this.lobby_controller));
    this.commands.set("game-list", this.lobby_controller.ListGameCommand.bind(this.lobby_controller));

    // game controller handlers
    this.commands.set("spectate", this.game_controller.SpectateGameCommand.bind(this.game_controller));
    this.commands.set("play-game2", this.game_controller.PlayGameCommand.bind(this.game_controller));
    this.commands.set("move", this.game_controller.MoveCommand.bind(this.game_controller));
}

WebSocketController.prototype.InitConnection = function(socket) {
    this.state.set(socket, {
        session_id: "",
        username: "",
        user_id: "",
    });
}

/**
 * Event handler for socket message.
 * Determines the command from the client and executes the appropriate code
 * @param {WebSocket} socket 
 * @param {Buffer|ArrayBuffer|Buffer[]} data Socket data
 */
WebSocketController.prototype.SocketMessageCallback = function (socket, data) {
    console.log("===========================");
    console.log("received: %s", data);

    const [tag, ...args] = ParseRequest(data);

    if (!this.commands.has(tag)) {
        socket.send(this.Response("error", "Not a valid request."));
    }
    else {
        const command = this.commands.get(tag)
        command(socket, ...args);
    }
    
    console.log("===========================");
}

function ParseRequest(data) {
    // return a command that doesnt exist so that the other function remains neat.
    const stub = ["none"];

    try {
        const request = JSON.parse(data);
        if (!request.length) {
            return stub;
        }
        return request;
    }
    catch (error) {
        console.error(error);
    }

    return stub
}

// event handler for when a client disconnects
WebSocketController.prototype.CloseConnectionCallback = function (socket) {

    // get the session id
    const entry = this.state.get(socket);

    // delete the state
    this.state.delete(socket);
    this.socket_map.delete(entry.session_id);

    // delete the user's games
    this.lobby_controller.DeleteUserGames(entry.session_id);
    this.lobby_controller.UserDisconnected(socket);
    this.game_controller.UserDisconnected(socket);
}

WebSocketController.prototype.AuthenticateCommand = function (socket, session_id) {
    // set the session id and username in the state entry for this socket
    // username is acquired from redis
    
    const entry = this.state.get(socket);

    entry.session_id = session_id;
    entry.username = "Anonymous User";
    entry.user_id = "";

    this.socket_map.set(session_id, socket);

    // look up the username of the given session id and set entry.username
    const svc = new User.RedisService(this.client);
    svc.GetSession(session_id)
        .then(session => {
            if (session.username?.length) {
                entry.username = session.username;
            }
            if (session.user_id?.length) {
                entry.user_id = session.user_id;
            }
        })
        .catch(console.error);
}

// common functions

// Structured broadcast with tag and data. Sends data to all clients using the format ["tag", data].
WebSocketController.prototype.Broadcast = function (tag, ...args) {
    this.wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(this.Response(tag, ...args))
        }
    });
}

// Structured response with tag and data. Sends data to the client using the format ["tag", data].
WebSocketController.prototype.Response = function (tag, ...args) {
    return JSON.stringify([tag, ...args]);
}

module.exports = WebSocketController;