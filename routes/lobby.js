const JsonService = require("../echess/json_service");
const User = require("../echess/user")

const express = require("express");
const router = express.Router();

router.get("/", function(request, response, next) {

    let context = {
        title: "Lobby",
        session_id: request.session.id,
        username: request.session.username || "",
        error: ""
    };

    response.render("lobby", context)
});

module.exports = router;