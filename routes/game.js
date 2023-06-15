const LobbyGame = require("../echess/lobby_game.js");

const crypto = require("crypto");
const express = require("express");
const router = express.Router();

router.param("game_id", (request, response, next, game_id) => {
    request.game_id = game_id
    next();
});

router.get("/:game_id", (request, response, next) => {

    let context = {
        title: "user1 vs user2",
    };

    console.log(request.game_id);

    // get the game from redis (game not lobby game)
    // if user is one of the players, render the game view
    // otherwise, user is a spectator, render the spectator view

    response.render("game", context);
});

router.get("/:game_id/confirm", (request, response, next) => {

    let context = {
        title: "user1 wants to play a game",
        lobby_game: new LobbyGame(crypto.randomUUID(), "session_id", "user1", new Date(), "random")
    };
    
    // look up the lobby game in redis
    // be sure not to expose the user's session id to this other user.
    // render the view
    // confirm view works the same as the main screen, except there's only one game to join.
    
    response.render("confirm", context);
});

module.exports = router;
