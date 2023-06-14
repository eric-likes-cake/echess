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

    // get the game (thinking i will store it in json, but could be in redis or an alternative in-memory db)
    // if the current user is one of the players, render the game view
    // otherwise, render the spectator view.

    // note: if the game doesnt exist yet we will just error.
    // if a user wants to join the game they should use the interface or go to the confirm link
    // which will look something like /game/confirm/:game_id or /game/:game_id/confirm

    if (request.game_id) {

    }

    response.render("game", context);
});

module.exports = router;