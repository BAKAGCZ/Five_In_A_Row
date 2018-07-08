const Sequelize = require('sequelize');
const room_key = 'room_info';

class RoomDB
{
	constructor(redisclient, mysqlclient) {
		RoomDB.redisclient = redisclient;
		RoomDB.mysqlclient = mysqlclient;
	}
}

RoomDB.redisclient = {};
RoomDB.mysqlclient = {};

module.exports = RoomDB;