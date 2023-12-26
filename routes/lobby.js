const express = require("express");
const router = express.Router();

router.param("game_id", (request, response, next, game_id) => {
    request.game_id = game_id
    next();
});

router.get("/", function(request, response, next) {

    let context = {
        title: "Lobby",
        session_id: request.session.id,
        username: request.session.username || "",
        error: "",
        config: request.app.locals.config
    };

    response.render("lobby", context)
});

router.get("/invite/:game_id", (request, response, next) => {

    let context = {
        title: "Game Invitation",
        session_id: request.session.id,
        username: request.session.username || "",
        game_id: request.game_id,
        error: "",
        config: request.app.locals.config
    };

    response.render("invite", context);
});

module.exports = router;