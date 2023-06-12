const body = document.querySelector("body");
const session_id = body.dataset["sessionId"];

body.addEventListener("click", PlayGameClick)

function PlayGameClick(e) {
    if (!e.target.classList.contains("play-game-link")) {
        return true;
    }

    e.preventDefault();

    // get the color or id
    const color = e.target.dataset["color"];
    const id = e.target.dataset["id"];

    if (color) {
        socket.send(`play-game color: ${color}`);
    }
    else if (id) {
        socket.send(`play-game id: ${id}`);
    }
    
    return false;
}

// Create WebSocket connection.
SetConnectionMessage("Not connected.");
let socket = Connect();

function Connect() {
    const socket = new WebSocket("ws://localhost:3030");

    // Connection opened
    socket.addEventListener("open", (event) => {
        SetConnectionMessage("Connected.", "green");
        socket.send("game-list");
        socket.send(`auth ${session_id}`);
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
    const td = document.querySelector("td#connection-status");
    td.classList.remove("green");
    td.classList.remove("red");
    if (color?.length) {
        td.classList.add(color);
    }
    td.innerHTML = message;
}

// reconnect as needed
const interval = setInterval(function() {
    if (socket.readyState === WebSocket.CLOSED) {
        SetConnectionMessage("Reconnecting...", "red");
        socket = Connect();
    }
}, 2000);

function HandleServerMessage(message) {
    const [tag, data] = JSON.parse(message);
    if (tag === "message") {
        console.log(message);
    }
    else if (tag === "new-game") {
        AddGames([data]);
    }
    else if (tag === "game-list") {
        ClearGames();
        AddGames(data);
    }
    else if (tag === "remove-games") {
        RemoveGames(data);
    }
}

function ClearGames() {
    const table_body = document.querySelector("#games");
    table_body.innerHTML = "";
}

function AddGames(games) {
    const table_body = document.querySelector("#games");
    const table_data = games.map(game => {
        return (
            `<tr id="${game.id}">
                <td>${game.username}</td>
                <td>${game.color}</td>
                <td>${game.date}</td>
                <td><a href="#" class="play-game-link" data-id="${game.id}">Join Game</a></td>
            </tr>`
        )
    });
    table_body.innerHTML += table_data.join("");
}

function RemoveGames(ids) {
    for (let id of ids) {
        const table_row = document.getElementById(id);
        table_row.remove();
    }
}