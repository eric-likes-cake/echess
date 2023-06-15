const express = require("express");
const session = require('express-session');
const RedisStore = require("connect-redis").default;
const {createClient} = require("redis");

const RedisService = require("./echess/redis_service");
const lobby_router = require("./routes/lobby");
const game_router = require("./routes/game");
const user_router = require("./routes/user");

const app = express();
const redis_client = createClient();
redis_client.connect().catch(console.error);

RedisService.SetClient("echess", redis_client);

const redis_store = new RedisStore({
    client: redis_client,
    prefix: "echess:session:",
})

app.use(session({
    store: redis_store,
    resave: false, // required: force lightweight session keep alive (touch)
    saveUninitialized: false, // recommended: only save session when data exists
    secret: "4bd8e1ac-0701-11ee-99b2-00155d5747af", // probably should be kept secret
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
