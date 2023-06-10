const express = require("express");
const router = express.Router();

router.get("/", function(request, response, next) {

    let context = {
        title: "user1 vs user2",
        form: request.query,
    };

    response.render("game", context);
});

module.exports = router;