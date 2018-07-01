const Sequelize = require('sequelize');
const Op = Sequelize.Op;

var db = new Sequelize('course_design', '', '', {
    dialect: 'sqlite',
    storage: './database/course_design.sqlite',
    freezeTableName: true,
    operatorsAliases: {
		$and: Op.and,
		$or: Op.or,
		$eq: Op.eq,
		$gt: Op.gt,
		$lt: Op.lt,
		$lte: Op.lte,
		$like: Op.like
    }
});

const player_rank = db.define('player_rank',{
	user_name: {
		type: Sequelize.STRING
	},
	score: {
		type: Sequelize.BIGINT
	}
});

function ChessDB()
{
	this.getTopN = function(n) {
		// body...
	}

	this.update = function(user_name, is_win) {
		//
	}
}

module.exports = ChessDB;

