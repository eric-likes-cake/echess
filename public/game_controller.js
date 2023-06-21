import { Chess } from "./modules/chess.js"

export default class GameController {
    constructor(socket_ctrl, board_id, color, game_id, is_player) {
        this.socket_ctrl = socket_ctrl;
        this.board_id = board_id;
        this.color = color;
        this.game_id = game_id;
        this.is_player = is_player;
    
        this.board = Chessboard(board_id, {
            draggable: is_player,
            position: "start",
            onDrop: DropCallback.bind(this),
            onDragStart: DragCallback.bind(this),
            orientation: color
        });
        
        if (is_player) {
            this.game = new Chess();
            this.game.reset();
        }
    
        this.socket_ctrl.SetCommandCallback("fen", InitFen.bind(this));
        this.socket_ctrl.SetCommandCallback("opponent-move", PlayerMove.bind(this));
    
        this.socket_ctrl.OnConnect(function() {
            if (is_player) {
                socket_ctrl.SocketMessage("play-game2", game_id);
            }
            else {
                socket_ctrl.SocketMessage("spectate", game_id);
            }
        })
    }
}

function PlayerMove(data) {
    if (this.player && data.color === this.color.charAt(0)) {
        return;
    }
    this.game?.move(data)
    this.board.move(data.from + "-" + data.to);
}

function InitFen(fen) {
    this.game?.load(fen);
    this.board.position(fen, false);
}

function DragCallback(source, piece, position, orientation) {
    if (this.game.game_over()) {
        return false
    }

    if (this.game.turn() !== this.color.charAt(0)) {
        return false;
    }

    const pattern = this.color === "white" ? /^w/ : /^b/;

    if (!piece.match(pattern)) {
        return false;
    }
}

function DropCallback(source, target, piece, new_pos, old_pos, orientation) {
    const data = {
        from: source,
        to: target,
    };

    const move = this.game.move(data);

    if (move === null) {
        return "snapback";
    }

    this.socket_ctrl.SocketMessage("move", data);
};
