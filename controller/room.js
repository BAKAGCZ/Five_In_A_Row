var Player = require('../controller').player,
    ChessBoard = require('../controller').chessboard;

const room_capacity = 2;

var room_number = 1;
var room = {}; 
var roomid_list = [];

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
            room_number: 0,
            roomid: roomid
        };

        roomid_list.push(roomid);
	}

	has(roomid) { return room[roomid] != undefined; }
    get(roomid) { return room[roomid]; }
    getPlayerNumber(roomid)  { return room[roomid].player.length; }
    getVisitorNumber(roomid) { return room[roomid].visitor.length; }
    getRoomList(offest, n) {
    	return roomid_list.slice(offest, offest + n).map(roomid => { return this.get(roomid); });
    }

    join(roomid, username) {
        if (room[roomid].player.length < 2) room[roomid].player.push(username);
        else room[roomid].visitor.push(username);
        Player.join(username, roomid);
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
        if (room[roomid].player.length == 0 && room[roomid].visitor.length == 0)
        {
            delete room[roomid];
            let index = roomid_list.indexOf(roomid);
            if (index != -1) roomid_list.splice(index, 1);
        }

        Player.leave(username);
	}

    start(roomid) {
        let player1 = room[roomid].player[0],
            player2 = room[roomid].player[1];
        
        if (Math.random()>0.5)
        {
            Player.start(player1, player2, ChessBoard.config.white);
            Player.start(player2, player1, ChessBoard.config.black);
            room[roomid].white = player1;
            room[roomid].black = player2;
        }
        else
        {
            Player.start(player2, player1, ChessBoard.config.white);
            Player.start(player1, player2, ChessBoard.config.black);
            room[roomid].white = player2;
            room[roomid].black = player1;
        }
        
        room[roomid].room_number = room_number++;
        room[roomid].is_save = 0;
    }

	end(roomid, winner, loser) {
        if (room[roomid].is_save == 0)
        {
            console.log('save_result: winner=>' + winner + ' loser=>'+loser);
            Player.updateRank(winner, loser)
            .then(res => {
            	room[roomid].is_save = 1;
            })
            .catch(err => { 
            	throw err; 
            });
        }
	}

	isAllReady(roomid) {
		return room[roomid].player.length == 2 
			&& Player.isReady(room[roomid].player[0]) 
			&& Player.isReady(room[roomid].player[1]);
	}

	isPlayer(roomid, username) {
		let flag = false;
		for (let i=0;i<room[roomid].player.length;i++)
			if (room[roomid].player[i]==username)
			{
				flag = true;
				break;
			}
		return flag;
	}
}


module.exports = new Room();