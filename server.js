const express = require("express");
const session = require('express-session');
const {createClient} = require("redis");
const RedisStore = require("connect-redis").default;
const fs = require("node:fs");
const https = require("node:https");
const crypto = require("crypto");

const lobby_router = require("./routes/lobby");
const game_router = require("./routes/game");
const user_router = require("./routes/user");
const JsonService = require("./echess/json_service");

// create the express app

const app = express();
// store redis client in the app.locals so we can access it during a request without reconnecting
const client = createClient();
client.connect().catch(console.error);
app.locals.redis_client = client;

const redis_store = new RedisStore({
    client: client,
    prefix: "echess:session:",
})

app.use(session({
    store: redis_store,
    resave: false, // required: force lightweight session keep alive (touch)
    saveUninitialized: true, // I chose true here so I can save the session id without logging in, false is recommended
    secret: process.env.EXPRESSJS_SECRET?.length ? process.env.EXPRESSJS_SECRET : crypto.randomUUID()
}));

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.json());

// set routes

app.all('*', ReloadConfig);
app.use("/", lobby_router);
app.use("/game", game_router);
app.use("/", user_router);
    
function ReloadConfig(request, response, next) {
    JsonService.LoadJsonFromDisk(JsonService.CONFIG_FILE_PATH)
        .then((config) => app.locals.config = config)
        .catch((error) => console.error(error))
        .finally(() => next())
}

// create secure server and accept connections

const port = 3000;
const private_key = fs.readFileSync("data/cert.key");
const certificate = fs.readFileSync("data/cert.crt");

https.createServer({
    key: private_key,
    cert: certificate
}, app).listen(port);

