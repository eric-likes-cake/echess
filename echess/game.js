const crypto = require("crypto");

class Game {
    /**
     * Currently playing game object
     * @param {*} id unique id for the game
     * @param {*} white_id either the user id or the session id of the player
     * @param {*} black_id either the user id or the session id of the other player
     * @param {Array<string>} moves list of moves
     */
    constructor(id, white_id, black_id, moves) {
        this.id = id;
        this.white_id = white_id;
        this.black_id = black_id;
        this.moves = moves;
    }

    IsWhite(user_id, session_id) {
        return this.white_id === user_id || this.white_id === session_id;
    }

    IsBlack(user_id, session_id) {
        return this.black_id === user_id || this.black_id === session_id;
    }

    IsPlayer(user_id, session_id) {
        return this.IsWhite(user_id, session_id) || this.IsBlack(user_id, session_id);
    }
}

class RedisService {
    constructor(client) {
        this.client = client;
    }

    // create means this is a new game, save moves by calling AddMoves
    async Create(game) {
        if (game.moves.length) {
            throw new Error("Moves should be empty for a new game");
        }

        await this.client.HSET(`echess:game:${game.id}`, this.Flat(game));
        await this.client.SAVE();

        return game;
    }

    // Save one or more moves. RPUSHX would be safer, but then we'd need a function for the first move
    async AddMoves(game_id, moves) {
        await this.client.RPUSH(`echess:game:moves:${game_id}`, moves);
        await this.client.SAVE();
    }

    async Load(game_id) {
        const object = await this.client.HGETALL(`echess:game:${game_id}`);

        if (!Object.keys(object).length) {
            throw new Error("Game id not found: " + game_id);
        }

        const game = Object.assign(new Game(), object);

        const len = await this.client.LLEN(`echess:game:moves:${game_id}`)
        game.moves = await this.client.LRANGE(`echess:game:moves:${game_id}`, 0, len);

        return game;
    }

    // Object.entries(game).flat() includes the moves which is a problem
    Flat(game) {
        return ["id", game.id, "white_id", game.white_id, "black_id", game.black_id];
    }
}

module.exports = {
    Game, RedisService
}