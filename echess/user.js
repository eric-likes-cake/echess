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

class RedisService {
    constructor(client) {
        this.client = client;
    }

    /**
     * Loads a user and returns a promise.
     * @param {object} filter {username} or {id} 
     */
    LoadUser(filter) {
        let {username, id} = filter;
        return (id?.length ? Promise.resolve(id) : this.client.GET(`echess:user_id:${username}`))
            .then(id => this.client.HVALS(`echess:user:${id}`))
            .then(array => array?.length > 0 ? array : Promise.reject(new Error(`User not found: ${JSON.stringify(filter)}`)))
            .then(array => new User(array[0], array[1], array[2], array[3]))
    }
    
    SaveUser(user) {
        return this.client.MULTI()
            .SET(`echess:user_id:${user.username}`, user.id)
            .HSET(`echess:user:${user.id}`, Object.entries(user).flat())
            .EXEC().then(results => results[0] == "OK" ? this.client.SAVE() : Promise.reject(new Error("Error saving user")))
    }

    MakeAdmin(id) {
        return this.client.SADD("echess:admins", id).SAVE();
    }

    RevokeAdmin(id) {
        return this.client.SREM("echess:admins", id).SAVE();
    }

    IsAdmin(id) {
        return this.client.SISMEMBER("echess:admins", id)
    }

    GetUserID(username) {
        return this.client.GET(`echess:user_id:${username}`);
    }
    
    UsernameExists(username) {
        return this.client.EXISTS(`echess:user_id:${username}`);
    }

    // So that the websocket server can access the session username
    GetSession(session_id) {
        return this.client.GET(`echess:session:${session_id}`)
            .then(session => session?.length ? JSON.parse(session) : Promise.reject(new Error(`Session not found: ${session_id}`)))
    }
}

module.exports = {
    User, CreateHash, RedisService
};
