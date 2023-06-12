const fs = require("fs/promises");
const path = require('node:path');

function JsonService(filepath) {
    this.filepath = filepath;
}

JsonService.USERDATA_FILEPATH = "data/users.json";
JsonService.LOBBY_DATA_FILEPATH = "data/lobby.json";
JsonService.NODEMAILER_CONFIG_FILEPATH = "data/nodemailer_config.json";

function SaveJsonToDisk(filepath, json) {
    // make the directory first
    return fs.mkdir(path.dirname(filepath), { recursive: true })
        .then(_ => fs.writeFile(filepath, json))
        .catch(error => console.log(error.message))
}

function LoadJsonFromDisk(filepath) {
    return fs.readFile(filepath, { encoding: "utf8" })
        .then(json => Promise.resolve(JSON.parse(json)))
        .catch(function(error) {
            console.log(error.message)
            return Promise.resolve([]);
        });
}

JsonService.prototype.Create = function (record) {
    console.log("Create()")
    return this.Read().then(data => {
        data.push(record);
        return SaveJsonToDisk(this.filepath, JSON.stringify(data, null, 4));
    }, error => {console.log(error)});
}

JsonService.prototype.Read = function () {
    return LoadJsonFromDisk(this.filepath);
}

JsonService.prototype.Find = function (filter) {
    return this.Read()
        .then(results => {
            return Promise.resolve(results.filter(entry => Matches(entry, filter)))
        })
        .catch(function(error) {
            console.log(error.message)
            return Promise.resolve([]);
        });
}

// returns the number of records updated
JsonService.prototype.Update = function (filter, data) {
    console.log("Update(%s, %s)", JSON.stringify(filter), JSON.stringify(data));

    const filepath = this.filepath;

    return this.Read()
        .then(function (results) {
            let count = 0;

            results.forEach(function(entry) {
                if (!Matches(entry, filter)) {
                    return true;
                }
                for (const key of Object.keys(data)) {
                    if (entry.hasOwnProperty(key)) {
                        entry[key] = data[key]
                    }
                    else {
                        // to do: test that this condition works, may need to use reject instead
                        throw new Error(`${key} is not in ${JSON.stringify("entry")}`);
                    }
                }
                count++;
            });

            return SaveJsonToDisk(filepath, JSON.stringify(results, null, 4)).then(_ => Promise.resolve(count));
        })
        .catch(error => {
            console.log(error.message);
            return Promise.resolve(0);
        });
}

/**
 * Deletes records from the json file.
 * @param {Function} match_callback 
 * @returns {Promise} The deleted records
 */
JsonService.prototype.Destroy = function(match_callback) {
    const filepath = this.filepath;

    return this.Read()
        .then(results => {
            const deleted = results.filter(entry => match_callback(entry));
            const others = results.filter(entry => !match_callback(entry));
            return SaveJsonToDisk(filepath, JSON.stringify(others, null, 4)).then(_ => Promise.resolve(deleted));
        })
        .catch(function(error) {
            console.log(error.message)
            return Promise.resolve([])
        });
}

function Matches(entry, filter) {
    for (const key of Object.keys(filter)) {
        if (entry.hasOwnProperty(key) && entry[key] === filter[key]) {
            continue;
        }
        return false;
    }

    return true;
}

module.exports = JsonService;