// the purpose of this module is to make redis client(s) globally available
// and so I don't have to keep reconnecting on every request.

const clients = new Map();

function SetClient(key, client) {
    clients.set(key, client);
}

function GetClient(key) {
    return clients.get(key);
}

function DeleteClient(key) {
    return clients.delete(key);
}

module.exports = {
    SetClient, GetClient, DeleteClient
}