const room_key = 'room_info';

class RoomDB
{
	constructor(client) {
		RoomDB.client = client;
	}
}

RoomDB.client = {};

module.exports = RoomDB;