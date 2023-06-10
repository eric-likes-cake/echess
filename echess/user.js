const bcrypt = require("bcrypt");

function User(username, email, password_hash, session_id) {
    this.username = username;
    this.email = email;
    this.password_hash = password_hash;
    this.session_id = session_id;
}

User.FromObject = function(object) {
    // const result = new User();
    // return Object.assign(result, object)
    return new User(object.username, object.email, object.password_hash, object.session_id);
}

User.CreateHash = function(password) {
    const salt_rounds = 10;
    return bcrypt.hash(password, salt_rounds);
}

User.prototype.ComparePassword = function(password) {
    return bcrypt.compare(password, this.password_hash);
}

module.exports = User;