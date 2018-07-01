const fs = require('fs');
const Sequelize = require('sequelize');

var database_username = '';
var database_password = '';

fs.readFile('./db.txt', 'utf-8', function(err, data){
    if (err) throw err;
    var s = data.toString().split(';');
    database_username = s[0];
    database_password = s[1];
});

var db = new Sequelize('course_design', database_username, database_password, {
    dialect: 'sqlite',
    storage: './database/course_design.sqlite'
});

const player_rank = Sequelize.define('player_rank',{
	user_name: {
		type: Sequelize.STRING
	},
	score: {
		type: Sequelize.BIGINT
	}
});