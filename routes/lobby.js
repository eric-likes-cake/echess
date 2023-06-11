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