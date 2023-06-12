
const WebSocket = require("ws");
const WebSocketController = require("./echess/websocket_controller")

const wss = new WebSocket.WebSocketServer({ port: 3030 });
const controller = new WebSocketController(wss);

wss.on("connection", function (socket, request, client) {
    controller.InitConnection(socket);

    socket.on("error", console.error);
    socket.on("message", data => controller.SocketMessageCallback(socket, data));
    socket.on("close", () => controller.CloseConnectionCallback(socket));

    socket.send(controller.Response("message", "Hello from the web socket server"));
});