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

const db = new Sequelize('ChessDB', '', '', {
    dialect: 'sqlite',
    storage: './database/ChessDB.sqlite',
    freezeTableName: true,
    logging: false,
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

	update(winner, loser) {
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

