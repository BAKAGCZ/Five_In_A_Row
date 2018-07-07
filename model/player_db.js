const player_key = 'room_info';

class PlayerDB
{
	constructor(client) {
		PlayerDB.client = client;
	}
}

PlayerDB.client = {};

module.exports = PlayerDB;