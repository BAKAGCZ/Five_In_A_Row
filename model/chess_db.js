const fs = require('fs');
const path = require('path');

const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const operatorsAliases = {
    $eq: Op.eq,
    $ne: Op.ne,
    $gte: Op.gte,
    $gt: Op.gt,
    $lte: Op.lte,
    $lt: Op.lt,
    $not: Op.not,
    $in: Op.in,
    $notIn: Op.notIn,
    $is: Op.is,
    $like: Op.like,
    $notLike: Op.notLike,
    $iLike: Op.iLike,
    $notILike: Op.notILike,
    $regexp: Op.regexp,
    $notRegexp: Op.notRegexp,
    $iRegexp: Op.iRegexp,
    $notIRegexp: Op.notIRegexp,
    $between: Op.between,
    $notBetween: Op.notBetween,
    $overlap: Op.overlap,
    $contains: Op.contains,
    $contained: Op.contained,
    $adjacent: Op.adjacent,
    $strictLeft: Op.strictLeft,
    $strictRight: Op.strictRight,
    $noExtendRight: Op.noExtendRight,
    $noExtendLeft: Op.noExtendLeft,
    $and: Op.and,
    $or: Op.or,
    $any: Op.any,
    $all: Op.all,
    $values: Op.values,
    $col: Op.col
};

var filecontent = fs.readFileSync(path.join(__dirname, '../database/mysql.txt'), 'utf-8').split(';');
var username = filecontent[0], password = filecontent[1];
console.log(username, password);

const db = new Sequelize('ChessDB', username, password, {
    // dialect: 'sqlite',
    // storage: './database/ChessDB.sqlite',
    dialect: 'mysql',
    freezeTableName: true,
    logging: false,
    pool: {
        max: 5,
        min: 0,
        idle: 10000 // 10s release thread
    },
    operatorsAliases
});

db.authenticate().then(() => {
    console.log('Connection has been established successfully.');
}).catch(err => {
    console.error('Unable to connect to the database:', err);
});

var player_rank = db.define('player_rank', {
	name: {
		type: Sequelize.STRING
	},
	score: {
		type: Sequelize.BIGINT, defaultValue: 0
	}
});

player_rank.sync(/*{force: true}*/).then(() => {
    console.log('Sync to table player_rank successfully.');
}).catch(() => {
    console.log('Unable sync to table player_rank.');
})

class ChessDB
{
	getTopN(currentPage, countPerPage) {
		return player_rank.findAll({ 
            limit: countPerPage, 
            offset: currentPage * countPerPage,
            order: [['score', 'desc']] 
        },{
            plain: true
        });
	}

	updateRank(winner, loser) {
        return player_rank.findOrCreate({where: { name: winner }, defaults: { name: winner, score: 0}})
        .spread((rec, created) => {
            rec.increment('score');
            
            player_rank.findOrCreate({where: { name: loser }, defaults: { name: loser, score: 0}})
            .spread((rec, created) => {
                rec.decrement('score');
            }).catch(function(error) {
                throw(error);
            });
        
        }).catch(function(error) {
            throw(error);
        });
	}
}

module.exports = new ChessDB();

