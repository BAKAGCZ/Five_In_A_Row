const room_number = 1;
const room_capacity = 2;

/* { roomid : [user_id, ...] } */
var rooms = {};
/* { roomid : { room, room_number, white, black } } */
var room_info = {}; 

class Room
{
	constructor() { }

	create(roomid) {
        room_info[roomid] = {};
        room_info[roomid].white = {};
        room_info[roomid].black = {};
        room_info[roomid].roomid = roomid;
        room_info[roomid].is_save = 0; // 对局结果未保存
        room_info[roomid].room_number = 0;
	}

	leave(roomid, userid) {
        if (rooms[roomid] == undefined || room_info[roomid] == undefined) return;
        // 删除用户id
        var index = rooms[roomid].indexOf(user_id);
        if (index != -1)
            rooms[roomid].splice(index, 1);

        // 更新房间信息
        if (rooms[room_id].length == 0)
        {
            delete rooms[room_id];
            delete room_info[room_id];
        }
	}

	saveResult(roomid, winner, loser) {
        if (room_info[roomid].is_save == 0)
        {
            console.log('save_result: winner=>' + winner + ' loser=>'+loser);
            PlayerDB.updateRank(winner, loser);
            room_info[roomid].is_save = 1;
        }
	}
}


module.exports = new Room();