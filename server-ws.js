const crypto = require("crypto");
const WebSocket = require("ws");
const LobbyGame = require("./echess/lobby_game");
const JsonService = require("./echess/json_service");

// websocket server
const wss = new WebSocket.WebSocketServer({ port: 3030 });

const state = new Map();

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

    if (auth_match) {
        Authenticate(socket, auth_match[1]);
    }
    else if (data == "create-game") {
        CreateLobbyGame(socket);
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

    const user_svc = new JsonService(JsonService.USERDATA_FILEPATH);
    user_svc.Find({session_id: entry.session_id}).then(results => results.length ? entry.username = results[0].username : void 0).catch(console.error);
}

function CreateLobbyGame(socket) {
    const {session_id, username} = state.get(socket);
    const game_svc = new JsonService(JsonService.LOBBY_DATA_FILEPATH);
    const game = new LobbyGame(crypto.randomUUID(), session_id, username, new Date());

    return game_svc.Create(game).then(() => BroadcastMessage(Response("new-game", game.ViewData(username))))
        .catch(console.error);
}

function SendGameList(socket) {
    const game_svc = new JsonService(JsonService.LOBBY_DATA_FILEPATH);
    game_svc.Read().then(results => {
        const games = results.map(game => LobbyGame.prototype.ViewData.apply(game));
        socket.send(Response("game-list", games));
    }).catch(console.error);
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
    const game_svc = new JsonService(JsonService.LOBBY_DATA_FILEPATH);
    game_svc.Destroy(game => game.username === entry.username || game.session_id === entry.session_id)
        .then(DeletedGamesResponse)
        .catch(console.error);
}

function DeletedGamesResponse(games) {
    const ids = games.map(game => game.id);
    BroadcastMessage(Response("remove-games", ids))
}