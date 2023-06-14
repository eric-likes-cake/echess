const bcrypt = require("bcrypt");

function User(id, username, email, password_hash) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.password_hash = password_hash;
}

function CreateHash(password) {
    const salt_rounds = 10;
    return bcrypt.hash(password, salt_rounds);
}

User.prototype.ComparePassword = function(password) {
    return bcrypt.compare(password, this.password_hash);
}

/**
 * Loads a user and returns a promise.
 * @param {object} filter {username} or {id} 
 * @param {*} client redis client
 */
function LoadUserFromRedis(filter, client) {
    let {username, id} = filter;
    let promise = Promise.resolve(id)

    if (!id) {
        promise = client.GET(`echess:user_id:${username}`).then(result => {
            if (result) {
                return id = result;
            }
            return Promise.reject(new Error("User ID not found. Username: " + username));
        })
    }
        
    return promise.then(id => client.HVALS(`echess:user:${id}`))
        .then(array => {
            if (array?.length) {
                return array;
            }
            return Promise.reject(new Error("User ID not found: " + id));
        })
        .then(array => new User(array[0], array[1], array[2], array[3]));
}

/**
 * Saves the given user and returns a promise.
 * @param {User} user 
 * @param {*} client redis client
 * @returns {Promise}
 */
function SaveUserToRedis(user, client) {
    return client.MULTI()
        .SET(`echess:user_id:${user.username}`, user.id)
        .HSET(`echess:user:${user.id}`, Object.entries(user).flat())
        .EXEC().then(results => {
            if (results[0] != "OK") {
                return Promise.reject("User name")
            }
            return client.SAVE();
        })
}

module.exports = {
    User, LoadUserFromRedis, SaveUserToRedis, CreateHash
};
