const WebSocket = require("ws");
const LobbyGame = require("./echess/lobby_game");

// websocket server
const wss = new WebSocket.Server({ port: 3030 });

wss.on("connection", function (ws, request, client) {

    ws.on("error", console.error);
    
    ws.on("message", function (data) {
        console.log("===========================");
        console.log("received: %s", data);
        const start = "connect.sid=s%3A".length;
        const sessid = request.headers.cookie.slice(start);
        console.log("cookie: %s", request.headers.cookie);
        console.log("sessid: %s", sessid);
        // client seems to be always undefined
        // console.log("CLIENT");
        // console.log(client);
        console.log("===========================");

        ws.send(`Server received: ${data}`);

        if (data.indexOf("Create a game")) {
            const game = new LobbyGame("username needed", new Date());
            BroadcastMessage(JSON.stringify(game));
        }
    });

    ws.send("Hello from the web socket server");
});

function BroadcastMessage(msg) {
    wss.clients.forEach((client) => client.readyState === WebSocket.OPEN ? client.send(msg) : void 0);
}