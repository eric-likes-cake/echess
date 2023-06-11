const express = require("express");
const session = require('express-session');
const lobby_router = require("./routes/lobby");
const game_router = require("./routes/game");
const user_router = require("./routes/user");

const app = express();

app.use(session({
    secret: "4bd8e1ac-0701-11ee-99b2-00155d5747af",
    resave: false,
    saveUninitialized: true
}));

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.json());

app.use("/", lobby_router);
app.use("/game", game_router);
app.use("/", user_router);

let port = process.env.PORT;

if (!port) {
    port = 3000;
}

app.listen(port)