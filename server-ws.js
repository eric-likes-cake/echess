const crypto = require("crypto");
const WebSocket = require("ws");
const LobbyGame = require("./echess/lobby_game");
const JsonService = require("./echess/json_service");

// websocket server
const wss = new WebSocket.WebSocketServer({ port: 3030 });

// socket -> state object for each user
const state = new Map();
// session id -> socket
const socket_map = new Map();
// game id -> game.
const lobby = new Map();

wss.on("connection", function (socket, request, client) {

    state.set(socket, {
        session_id: "",
        username: "",
    })

    socket.on("error", console.error);
    socket.on("message", SocketMessageCallback);
    socket.on("close", CloseConnection);

    socket.send(Response("message", "Hello from the web socket server"));
});

function SocketMessageCallback(data) {
    console.log("===========================");
    console.log("received: %s", data);

    const socket = this;
    const auth_match = data.toString().match(/^auth (.+)$/);
    const play_color_match = data.toString().match(/^play-game color: (.+)$/);
    const play_id_match = data.toString().match(/^play-game id: (.+)$/);

    if (auth_match) {
        Authenticate(socket, auth_match[1]);
    }
    else if (play_color_match) {
        // to do: join an existing game
        // color == random -> lobby game == random
        // color == white -> lobby game == black
        // color == black -> lobby game == white
        CreateLobbyGame(socket, play_color_match[1]);
    }
    else if (play_id_match) {
        JoinGame(socket, play_id_match[1]);
    }
    else if (data == "game-list") {
        SendGameList(socket);
    }
    
    console.log("===========================");
}

function Authenticate(socket, session_id) {
    // set the session id and username in the state entry for this socket
    // username is acquired from the database/json
    const entry = state.get(socket);
    entry.session_id = session_id;
    entry.username = "Anonymous User";

    socket_map.set(session_id, socket);

    const user_svc = new JsonService(JsonService.USERDATA_FILEPATH);
    user_svc.Find({session_id: entry.session_id}).then(results => results.length ? entry.username = results[0].username : void 0).catch(console.error);
}

function CreateLobbyGame(socket, color) {
    const {session_id, username} = state.get(socket);

    // add a new game to the lobby
    const game = new LobbyGame(crypto.randomUUID(), session_id, username, new Date(), color);
    lobby.set(game.id, game);

    BroadcastMessage(Response("new-game", game.ViewData()));
}

function JoinGame(socket, id) {

    const entry = state.get(socket);
    const game = lobby.get(id);
    
    if (!lobby.delete(id)) {
        return;
    }

    const response = Response("game-url", `/game/${id}`)

    socket.send(response);
    BroadcastMessage(Response("remove-games", [id]));
    DeleteUserGames(game.session_id);
    DeleteUserGames(entry.session_id);

    if (socket_map.has(game.session_id)) {
        const other = socket_map.get(game.session_id);
        other.send(response);
    }
}

function SendGameList(socket) {
    const games = Array.from(lobby.values()).map(game => LobbyGame.prototype.ViewData.apply(game));
    socket.send(Response("game-list", games));
}

function BroadcastMessage(msg) {
    wss.clients.forEach((client) => client.readyState === WebSocket.OPEN ? client.send(msg) : void 0);
}

function Response(tag, data) {
    return JSON.stringify([tag, data]);
}

// event handler for when a client disconnects
function CloseConnection() {
    const socket = this;

    // this function will be called any time a tab is closed, so we need to use a timeout
    // and probably a heartbeat (ping/pong) to clear the timeout for active tabs.
    // if the timeout function is called, then it will do 2 things:
    // 1. clear their lobby games from the db.
    // 2. delete their entry from the state object above.
    // I could also just not worry about multiple tabs since that is a goofy thing for a person to do on the site.

    const entry = state.get(socket);
    state.delete(socket);
    socket_map.delete(entry.session_id);

    DeleteUserGames(entry.session_id);
}

function DeleteUserGames(session_id) {
    const games = [];
    for (const game of lobby.values()) {
        if (game.session_id === session_id) {
            games.push(game);
            lobby.delete(game.id);
        }
    }
    DeletedGamesResponse(games);
}

function DeletedGamesResponse(games) {
    const ids = games.map(game => game.id);
    BroadcastMessage(Response("remove-games", ids))
}