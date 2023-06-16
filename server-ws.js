
const WebSocket = require("ws");
const {createClient} = require("redis");

const WebSocketController = require("./echess/websocket_controller")
const RedisService = require("./echess/redis_service");

// create the web socket server and redis client service for the web socket controller
const wss = new WebSocket.WebSocketServer({ port: 3030 });
const controller = new WebSocketController(wss, RedisService.CreateWithClient());

wss.on("connection", function (socket, request, client) {
    controller.InitConnection(socket);

    socket.on("error", console.error);
    socket.on("message", data => controller.SocketMessageCallback(socket, data));
    socket.on("close", () => controller.CloseConnectionCallback(socket));

    socket.send(controller.Response("message", "Hello from the web socket server"));
});
