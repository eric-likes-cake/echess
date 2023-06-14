const fs = require("fs/promises");
const path = require('node:path');

const NODEMAILER_CONFIG_FILEPATH = "data/nodemailer_config.json";

function SaveJsonToDisk(filepath, json) {
    // make the directory first
    return fs.mkdir(path.dirname(filepath), { recursive: true })
        .then(_ => fs.writeFile(filepath, json))
}

function LoadJsonFromDisk(filepath) {
    return fs.readFile(filepath, { encoding: "utf8" })
        .then(json => Promise.resolve(JSON.parse(json)))
}

module.exports = {
    LoadJsonFromDisk, SaveJsonToDisk, NODEMAILER_CONFIG_FILEPATH,
};