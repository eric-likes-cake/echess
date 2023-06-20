const fs = require("fs");
const https = require("https");
const WebSocket = require("ws");
const {createClient} = require("redis");
const WebSocketController = require("./echess/websocket_controller")

// create a secure server for the websocket server
const private_key = fs.readFileSync("data/cert.key");
const certificate = fs.readFileSync("data/cert.crt");

const server = https.createServer({
    key: private_key,
    cert: certificate
})

// create the web socket server and redis_client for the web socket controller
const wss = new WebSocket.WebSocketServer({ server });
const redis_client = createClient();
redis_client.connect().catch(console.error);
const controller = new WebSocketController(wss, redis_client);

wss.on("connection", function (socket, request, client) {
    controller.InitConnection(socket);

    socket.on("error", console.error);
    socket.on("message", data => controller.SocketMessageCallback(socket, data));
    socket.on("close", () => controller.CloseConnectionCallback(socket));

    socket.send(controller.Response("message", "Hello from the web socket server"));
});


// development note: to add the exception for my self-signed certificate for my wss:// connection
// I had to visit https://localhost:3030 by typing it into the url. then I was able to add the exception
// and go back to the site and the websocket worked.
server.listen(3030);
