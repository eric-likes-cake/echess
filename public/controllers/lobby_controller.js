export default class LobbyController {

    constructor(socket_ctrl, game_table) {
        this.socket_ctrl = socket_ctrl;
        this.game_table = game_table;

        const body = document.querySelector("body");
        body.addEventListener("click", CreatePlayGameClickHandler(socket_ctrl));

        this.socket_ctrl.SetCommandCallback("new-game", (game) => this.AddGames([game]));
        this.socket_ctrl.SetCommandCallback("game-list", (games) => {this.ClearGames(); this.AddGames(games);});
        this.socket_ctrl.SetCommandCallback("remove-games", (ids) => this.RemoveGames(ids));
        this.socket_ctrl.SetCommandCallback("game-url", (url) => window.location.assign(url));

        this.socket_ctrl.OnConnect(function() {
            socket_ctrl.SocketMessage("game-list");
            socket_ctrl.SocketMessage("lobby");
        })
    }

    ClearGames() {
        const table_body = document.querySelector(this.game_table);
        table_body.innerHTML = "";
    }

    AddGames(games) {
        const table_body = document.querySelector(this.game_table);
        const table_data = games.map(game => {
            return (
                `<tr id="${game.id}">
                    <td>${game.username}</td>
                    <td>${game.color}</td>
                    <td>${game.date}</td>
                    <td><a href="/game/${game.id}" class="play-game-link" data-id="${game.id}">Join Game</a></td>
                </tr>`
            )
        });
        table_body.innerHTML += table_data.join("");
    }

    RemoveGames(ids) {
        for (let id of ids) {
            const table_row = document.getElementById(id);
            table_row.remove();
        }
    }
}

function CreatePlayGameClickHandler(socket_ctrl) {
    return (function(e) {
        if (!e.target.classList.contains("play-game-link")) {
            return true;
        }
    
        e.preventDefault();
    
        // get the color or id
        const color = e.target.dataset["color"];
        const id = e.target.dataset["id"];
    
        if (color) {
            socket_ctrl.SocketMessage("play-game", color);
        }
        else if (id) {
            socket_ctrl.SocketMessage("play-game", id);
        }
        
        return false;
    })
}
