const bcrypt = require("bcrypt");

function User(username, email, email_verified, password_hash, session_id) {
    this.username = username;
    this.email = email;
    this.email_verified = email_verified;
    this.password_hash = password_hash;
    this.session_id = session_id;
}

User.FromObject = function(object) {
    const result = new User();
    return Object.assign(result, object);
}

User.CreateHash = function(password) {
    const salt_rounds = 10;
    return bcrypt.hash(password, salt_rounds);
}

User.prototype.ComparePassword = function(password) {
    return bcrypt.compare(password, this.password_hash);
}

module.exports = User;