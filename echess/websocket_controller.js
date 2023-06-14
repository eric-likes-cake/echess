const LobbyController = require("./websocket_lobby_controller");
const WebSocket = require("ws");
const RedisService = require("./redis_service");

/**
 * Websocket controller for handling requests and responses
 * @param {WebSocketServer} wss Web socket server
 */
function WebSocketController(wss) {
    this.wss = wss;

    // socket -> state object for each user
    this.state = new Map();
    // session id -> socket
    this.socket_map = new Map();

    this.lobby_controller = new LobbyController(this);

    this.commands = new Map();
    this.commands.set("auth", this.AuthenticateCommand.bind(this));
    this.commands.set("play-game", this.lobby_controller.PlayGameCommand.bind(this.lobby_controller));
    this.commands.set("game-list", this.lobby_controller.ListGameCommand.bind(this.lobby_controller));
}

WebSocketController.prototype.InitConnection = function(socket) {
    this.state.set(socket, {
        session_id: "",
        username: "",
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
        return;
    }

    const command = this.commands.get(tag)
    command(socket, ...args);
    
    console.log("===========================");
}

function ParseRequest(data) {
    // return a command that doesnt exist so that the other function remains neat.
    const stub = ["none"];

    try {
        const response = JSON.parse(data);
        if (!response.length) {
            return stub;
        }
        return response;
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
}

WebSocketController.prototype.AuthenticateCommand = function (socket, session_id) {
    // set the session id and username in the state entry for this socket
    // username is acquired from redis
    
    const entry = this.state.get(socket);

    entry.session_id = session_id;
    entry.username = "Anonymous User";

    this.socket_map.set(session_id, socket);

    // look up the username of the given session id and set entry.username

    const client = RedisService.GetClient("echess");
    client.get(`echess:session:${session_id}`)
        .then(session => {
            if (session) {
                entry.username = JSON.parse(session).username
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