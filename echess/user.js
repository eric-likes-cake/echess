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

module.exports = {
    User, CreateHash
};
