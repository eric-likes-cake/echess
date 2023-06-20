const { Chess } = require("chess.js");
const Game = require("./game");
const User = require("./user");

class WebsocketGameController {

    /**
     * @param {WebSocketController} wsc
     */
    constructor(wsc) {
        this.wsc = wsc;
        this.game_svc = new Game.RedisService(this.wsc.client);
        this.user_svc = new User.RedisService(this.wsc.client);

        // socket -> echess game record
        this.games = new Map()
        // socket -> chess.js game for validation
        this.engines = new Map()
        // game id -> [sockets of players and spectators]
        this.clients = new Map()
    }

    PlayGameCommand(socket, game_id) {
        this.game_svc.Load(game_id).then(game => {
            const {session_id, user_id} = this.wsc.state.get(socket);

            if (!game.IsPlayer(user_id, session_id)) {
                throw new Error("User is not a player for this game id.");
            }

            const engine = new Chess();
            game.moves.forEach(move => engine.move(move));

            SetState.call(this, socket, game, engine);

            socket.send(this.wsc.Response("fen", engine.fen()));
        }).catch(error => {
            console.error(error);
            socket.send(this.wsc.Response("error", "An error occurred"));
        });
    }

    SpectateGameCommand(socket, game_id) {
        console.log(game_id);
    }

    MoveCommand(socket, move) {
        const result = MakeMove.call(this, socket, move);

        if (!result) {
            return;
        }

        const game = this.games.get(socket);
        this.game_svc.AddMoves(game.id, result.san);
        
        this.clients.get(game.id).forEach(client => {
            client.send(this.wsc.Response("opponent-move", result));
            // one of these clients is the opponent, so call this function for them too
            MakeMove.call(this, client, move);
        })
    }

    UserDisconnected(socket) {
        if (this.games.has(socket)) {
            ClearState.call(this, socket);
        }
    }
}

function MakeMove(socket, move) {
    if (!this.games.has(socket) || !this.engines.has(socket)) {
        console.error("No game state for given user.")
        return false;
    }

    try {
        const engine = this.engines.get(socket);
        return engine.move(move);
    }
    catch (error) {
        console.error(error);
        return false;
    }
}

function SetState(socket, game, engine) {
    this.games.set(socket, game);
    this.engines.set(socket, engine);
    if (!this.clients.has(game.id)) {
        this.clients.set(game.id, []);
    }
    const list = this.clients.get(game.id);
    list.push(socket);
}

function ClearState(socket) {
    const game = this.games.get(socket);
    this.games.delete(socket);
    this.engines.delete(socket);
    const list = this.clients.get(game.id);
    const idx = list.indexOf(socket);
    list.splice(idx, 1);
    this.clients.set(game.id, list);
}

module.exports = {
    WebsocketGameController,
    default: WebsocketGameController
}