import { Chess } from "./modules/chess.js"

// load options from the body data set
const body = document.querySelector("body");
const session_id = body.dataset["sessionId"];
const color = body.dataset["color"];
const game_id = body.dataset["gameId"];

const board = Chessboard("board", {
    draggable: true,
    position: "start",
    onDrop: DropCallback,
    onDragStart: DragCallback,
    orientation: color
});

const game = new Chess();
game.reset();

function DragCallback(source, piece, position, orientation) {
    if (game.game_over()) {
        return false
    }

    if (game.turn() !== color.charAt(0)) {
        return false;
    }

    const pattern = color === "white" ? /^w/ : /^b/;

    if (!piece.match(pattern)) {
        return false;
    }
}

function DropCallback(source, target, piece, new_pos, old_pos, orientation) {
    const data = {
        from: source,
        to: target,
    };

    const move = game.move(data);

    if (move === null) {
        return "snapback";
    }

    SocketMessage("move", data);
};

// Create WebSocket connection.
SetConnectionMessage("Not connected.");
let socket = Connect();

function Connect() {
    const socket = new WebSocket("ws://localhost:3030");

    // Connection opened
    socket.addEventListener("open", (event) => {
        SetConnectionMessage("Connected.", "green");
        SocketMessage("auth", session_id);
        SocketMessage("play-game2", game_id);
    });

    // Listen for messages
    socket.addEventListener("message", (event) => {
        console.log(event.data);
        HandleServerMessage(event.data);
    });

    socket.addEventListener("close", (event) => {
        console.log(event.type);
        SetConnectionMessage("Disconnected.", "red");
    });
    
    return socket;
}

function SetConnectionMessage(message, color) {
    const node = document.querySelector("#connection-status");
    node.classList.remove("green");
    node.classList.remove("red");
    if (color?.length) {
        node.classList.add(color);
    }
    node.innerHTML = message;
}

function SocketMessage(tag, ...data) {
    socket.send(JSON.stringify([tag, ...data]));
}

function HandleServerMessage(message) {
    const [tag, data] = JSON.parse(message);
    if (tag === "message") {
        console.log(message);
    }
    else if (tag === "opponent-move") {
        if (data.color === color.charAt(0)) {
            return;
        }
        game.move(data)
        board.move(data.from + "-" + data.to);
    }
    else if (tag === "fen") {
        game.load(data);
        board.position(data, false);
    }
}

// reconnect as needed
const interval = setInterval(function() {
    if (socket.readyState === WebSocket.CLOSED) {
        SetConnectionMessage("Reconnecting...", "red");
        socket = Connect();
    }
}, 2000);