const LobbyGame = require("../echess/lobby_game.js");
const Game = require("../echess/game.js");
const User = require("../echess/user.js");

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

    // get the game from redis (game not lobby game)
    // if user is one of the players, render the game view
    // otherwise, user is a spectator, render the spectator view

    const game_svc = new Game.RedisService(request.app.locals.client);
    const user_svc = new User.RedisService(request.app.locals.client);

    game_svc.Load(request.game_id).then(game => {
        console.log(game);
        context.game = game;
        return GetUserNames(user_svc, game);
    })
    .then(users => {
        context.white = users[0]?.username || "Anonymous User";
        context.black = users[1]?.username || "Anonymous User";
        context.title = context.white + " vs " + context.black;
    })
    .then(() => {
        console.log(context);

        if (context.game.IsPlayer(request.session.user_id, request.session.id)) {
            response.render("game", context);
        }
        else {
            response.render("spectator", context);
        }
    })
    .catch(error => {
        console.log(error.message);
        response.redirect("/");
    });
});

async function GetUserNames(user_svc, game) {
    const user1 = await user_svc.LoadUser({id: game.white_id}).catch(console.error);
    const user2 = await user_svc.LoadUser({id: game.black_id}).catch(console.error);
    return [user1, user2];
}

module.exports = router;
