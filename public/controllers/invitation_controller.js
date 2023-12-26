
export default class InvitationController {

    constructor(socket_ctrl, game_id, display_wrapper) {
        this.socket_ctrl = socket_ctrl;
        this.game_id = game_id;
        this.display_wrapper = display_wrapper;

        // handle responses
        this.socket_ctrl.SetCommandCallback("game-list", DisplayInvitation.bind(this));
        this.socket_ctrl.SetCommandCallback("remove-games", RemoveGames.bind(this));
        this.socket_ctrl.SetCommandCallback("game-url", (url) => window.location.assign(url));

        // send game list request
        this.socket_ctrl.OnConnect(function() {
            socket_ctrl.SocketMessage("game-list");
        })
    }
}

function DisplayInvitation(games) {
    const display = document.querySelector(this.display_wrapper);
    const game = games.find(g => g.id == this.game_id);

    if (!game) {
        alert("no such game");
    }
    else {
        console.log(game);
    }

    let html = ""
    html += `<p>Opponent: ${game.username} (${game.color} side)</p>`
    const color = game.color == "white" ? "black" : game.color == "black" ? "white" : game.color;
    // play game click is handled in the lobby controller, which must be present on the invitation page 
    // because the server needs to keep track of connected users during the game join process.
    html += `<input type="button" value="Join Game" class="play-game-link" data-id="${game.id}">`;

    display.innerHTML = html;
}

function RemoveGames(ids) {
    for (let id of ids) {
        if (id === this.game_id) {
            alert("This game invitation has expired. Returning to lobby...");
            setTimeout(3000, window.location.assign("/"))
        }
    }
}