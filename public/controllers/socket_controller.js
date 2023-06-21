export default class SocketController {

    constructor(url, connected_node, session_id) {
        this.url = url;
        this.connected_node = connected_node;
        this.session_id = session_id;

        this.commands = new Map()
        this.commands.set("message", console.log);
        this.commands.set("error", console.error);
        
        this.SetConnectionMessage("Not connected.");

        this.open_callbacks = [];
    }

    // Call this before connecting. The given callback will be called when the socket connection is opened
    OnConnect(callback) {
        this.open_callbacks.push(callback);
    }

    Connect() {
        this.socket = new WebSocket(this.url);
    
        // Connection opened
        this.socket.addEventListener("open", (event) => {
            this.SetConnectionMessage("Connected.", "green");
            this.SocketMessage("auth", this.session_id);
        });

        for (let callback of this.open_callbacks) {
            this.socket.addEventListener("open", callback);
        }
    
        // Listen for messages
        this.socket.addEventListener("message", (event) => {
            console.log(event.data);
            this.HandleServerMessage(event.data);
        });
    
        this.socket.addEventListener("close", (event) => {
            console.log(event.type);
            this.SetConnectionMessage("Disconnected.", "red");
        });
    }

    SetConnectionMessage(message, color) {
        const node = document.querySelector(this.connected_node);
        node.classList.remove("green");
        node.classList.remove("red");
        if (color?.length) {
            node.classList.add(color);
        }
        node.innerHTML = message;
    }

    // reconnect as needed
    EnableReconnection() {
        const self = this;

        self.interval = setInterval(function() {
            if (self.socket.readyState === WebSocket.CLOSED) {
                self.SetConnectionMessage("Reconnecting...", "red");
                self.Connect()
            }
        }, 2000);
    }

    DisableReconnection() {
        clearInterval(this.interval);
        this.interval = null;
    }

    HandleServerMessage(message) {
        const [tag, data] = JSON.parse(message);

        if (!this.commands.has(tag)) {
            console.error("Unrecognized message from websocket server: " + message);
            return;
        }

        const command = this.commands.get(tag);
        command(data);
    }

    SetCommandCallback(tag, callback) {
        if (this.commands.has(tag)) {
            console.warn("Warning: command was already set for " + tag + " and will now be replaced");
        }

        this.commands.set(tag, callback);
    }

    SocketMessage(tag, ...data) {
        this.socket.send(JSON.stringify([tag, ...data]));
    }
}