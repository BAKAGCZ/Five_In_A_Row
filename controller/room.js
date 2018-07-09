var Player = require('./controller').player,
    ChessBoard = require('./controller').chessboard;

const room_capacity = 2;

var room_number = 1;
var room = {}; 

class Room
{
	constructor() { }

	create(roomid) {
        room[roomid] = {
            white: {},
            black: {},
            player: [], // 前两名进入的用户为玩家 玩家uid
            visitor: [], // 观众uid
            is_save: 0, // 对局结果未保存
            room_number: 0
        };
	}

    getRoom(roomid) { return room[roomid]; }

    join(roomid, username) {
        room[roomid].player.push(username);
    }

	leave(roomid, username) {
        if (room[roomid] == undefined) return;
        // 删除用户id
        let index = room[roomid].player.indexOf(username);
        if (index != -1) room[roomid].player.splice(index, 1);
        else {
            let index = room[roomid].visitor.indexOf(username);
            if (index != -1) room[roomid].visitor.splice(index, 1);
        }

        // 更新房间信息
        if (room[room_id].player.length == 0 && room[roomid].visitor.length == 0)
            delete room[room_id];
	}

    start(roomid) {
        let player1 = room[roomid].player[0],
            player2 = room[roomid].player[1];
        
        if (Math.random()>0.5)
        {
            player.start(player1, ChessBoard.config.white);
            player.start(player2, ChessBoard.config.black);
            room[roomid].white = player1;
            room[roomid].black = player2;
        }
        else
        {
            player.start(player2, ChessBoard.config.white);
            player.start(player1, ChessBoard.config.black);
            room[roomid].white = player2;
            room[roomid].black = player1;
        }
        
        room_info[room_id].room_number = room_number++;
        room_info[room_id].is_save = 0;
    }

	end(roomid, winner, loser) {
        if (room[roomid].is_save == 0)
        {
            console.log('save_result: winner=>' + winner + ' loser=>'+loser);
            Player.updateRank(winner, loser);
            room[roomid].is_save = 1;
        }
	}
}


module.exports = new Room();