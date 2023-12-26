export default class LobbyController {

    constructor(socket_ctrl, game_table) {
        this.socket_ctrl = socket_ctrl;
        this.game_table = game_table;
        this.user_game_ids = new Set();

        const body = document.querySelector("body");
        body.addEventListener("click", ClickPlayGameCallback.bind(socket_ctrl));
        body.addEventListener("click", ClickShareGameCallback.bind(socket_ctrl));

        this.socket_ctrl.SetCommandCallback("new-game", (game) => this.AddGames([game]));
        this.socket_ctrl.SetCommandCallback("game-list", (games) => {this.ClearGames(); this.AddGames(games);});
        this.socket_ctrl.SetCommandCallback("remove-games", (ids) => this.RemoveGames(ids));
        this.socket_ctrl.SetCommandCallback("game-url", (url) => window.location.assign(url));
        this.socket_ctrl.SetCommandCallback("your-game", (id) => this.user_game_ids.add(id));

        this.socket_ctrl.OnConnect(function() {
            socket_ctrl.SocketMessage("game-list");
            socket_ctrl.SocketMessage("lobby");
        })
    }

    ClearGames() {
        if (!this.game_table?.length) {
            return;
        }
        const table_body = document.querySelector(this.game_table);
        table_body.innerHTML = "";
    }

    AddGames(games) {
        if (!this.game_table?.length) {
            return;
        }
        const table_body = document.querySelector(this.game_table);
        const table_data = games.map(game => {
            return (
                `<tr id="${game.id}">
                    <td>${game.username}</td>
                    <td>${game.color}</td>
                    <td>${game.date}</td>
                    <td>${GetLinkHtml.call(this, game)}</td>
                </tr>`
            )
        });
        table_body.innerHTML += table_data.join("");
    }

    RemoveGames(ids) {
        for (let id of ids) {
            const table_row = document.getElementById(id);
            table_row?.remove();
        }
    }
}

function GetLinkHtml(game) {
    const label = this.user_game_ids.has(game.id) ? "Share Link" : "Join Game";
    const classname = this.user_game_ids.has(game.id) ? "share-game-link" : "play-game-link"
    return `<a href="/invite/${game.id}" class="${classname}" data-id="${game.id}">${label}</a>`
}

function ClickPlayGameCallback(e) {
    if (!e.target.classList.contains("play-game-link")) {
        return true;
    }
    
    e.preventDefault();
    
    // get the color or id
    // color is present when creating a game, id is present when joining a game.
    const color = e.target.dataset["color"];
    const id = e.target.dataset["id"];
    
    this.SocketMessage("play-game", color || id);
        
    return false;
}

function ClickShareGameCallback(e) {
    if (!e.target.classList.contains("share-game-link")) {
        return true;
    }

    e.preventDefault();
    
    Copy(e.target.href);
}

function CopyModern(text) {
    navigator.clipboard.writeText(text)
        .then(() => alert("Game link copied. Send it to a friend to invite them to play."))
        .catch(error => console.error("Failed to copy text:", error));
}

function CopyCompatibility(text) {
    const node = document.createElement("textarea");
    node.value = text;
    document.body.appendChild(node);
    node.select();
    document.execCommand("copy");
    document.body.removeChild(node);
}

// test for modern clipboard features, if they exist then use them. otherwise don't.
const Copy = navigator.clipboard ? CopyModern : CopyCompatibility;