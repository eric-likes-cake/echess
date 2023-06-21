const fs = require("fs/promises");
const path = require('node:path');

const CONFIG_FILE_PATH = "data/config.json";

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
    LoadJsonFromDisk, SaveJsonToDisk, CONFIG_FILE_PATH,
};