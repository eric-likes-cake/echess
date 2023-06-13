
const WebSocket = require("ws");
const {createClient} = require("redis");

const WebSocketController = require("./echess/websocket_controller")
const RedisService = require("./echess/redis_service");

const wss = new WebSocket.WebSocketServer({ port: 3030 });
const controller = new WebSocketController(wss);

wss.on("connection", function (socket, request, client) {
    controller.InitConnection(socket);

    socket.on("error", console.error);
    socket.on("message", data => controller.SocketMessageCallback(socket, data));
    socket.on("close", () => controller.CloseConnectionCallback(socket));

    socket.send(controller.Response("message", "Hello from the web socket server"));
});

// create a redist client, connect and store it so it globally so it can be used in other files
const redis_client = createClient();
redis_client.connect().catch(console.error);
RedisService.SetClient("echess", redis_client);