const User = require("./user")
const {RedisClientType} = require("redis");
const {createClient} = require("redis");

class RedisService {

    /**
     * @param {RedisClientType} client 
     */
    constructor(client) {
        this.client = client;
    }

    /**
     * Loads a user and returns a promise.
     * @param {object} filter {username} or {id} 
     */
    LoadUserFromRedis(filter) {
        let {username, id} = filter;
    
        return (id?.length ? Promise.resolve(id) : this.client.GET(`echess:user_id:${username}`))
            .then(id => this.client.HVALS(`echess:user:${id}`))
            .then(array => array?.length > 0 ? array : Promise.reject(new Error(`User not found: ${JSON.stringify(filter)}`)))
            .then(array => new User.User(array[0], array[1], array[2], array[3]))
    }
    
    /**
     * Saves the given user and returns a promise.
     * @param {User} user 
     * @returns {Promise}
     */
    SaveUserToRedis(user) {
    
        return this.client.MULTI()
            .SET(`echess:user_id:${user.username}`, user.id)
            .HSET(`echess:user:${user.id}`, Object.entries(user).flat())
            .EXEC().then(results => results[0] == "OK" ? this.client.SAVE() : Promise.reject("Error saving user"))
    }
    
    IsAdmin(id) {
        return this.client.SISMEMBER("echess:admins", id)
    }
    
    UsernameExists(username) {
        return this.client.EXISTS(`echess:user_id:${username}`)
    }
}

function CreateWithClient() {
    const client = createClient();
    client.connect().catch(console.error);
    return new RedisService(client);
}

module.exports = {
    RedisService, CreateWithClient
}
