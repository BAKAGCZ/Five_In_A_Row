const Sequelize = require('sequelize');
const player_key = 'player_info';

class PlayerDB
{
	constructor(redisclient, mysqlclient) {
		PlayerDB.redisclient = redisclient;
		PlayerDB.mysqlclient = mysqlclient;
		PlayerDB.account = PlayerDB.mysqlclient.define('player_account', {
		    id: {
		        type: Sequelize.INTEGER, 
		        primaryKey: true,
		        autoIncrement: true       
		    },
		    name: {
		        type: Sequelize.STRING,
		        unique: true
		    },
		    passcode: {
		        type: Sequelize.STRING
		    }
		});

		PlayerDB.rank = PlayerDB.mysqlclient.define('player_rank', {
		    id: {
		        type: Sequelize.INTEGER, 
		        primaryKey: true,
		        autoIncrement: true
		    },
			name: {
				type: Sequelize.STRING,
		        unique: true
			},
			score: {
				type: Sequelize.BIGINT, defaultValue: 0
			}
		});

		PlayerDB.rank.sync(/*{force: true}*/).then(() => {
	    	console.log('Sync to table player_rank successfully.');
		}).catch(() => {
		    console.log('Unable sync to table player_rank.');
		})
	}

    getCount() {
        return PlayerDB.rank.findAll().count();
    }

	getTopN(currentPage, countPerPage) {
		return PlayerDB.rank.findAll({ 
            limit: countPerPage, 
            offset: currentPage * countPerPage < 0 ? 0 : currentPage * countPerPage,
            order: [['score', 'desc']] 
        },{
            plain: true
        });
	}

	updateRank(winner, loser) {
        return PlayerDB.rank.findOrCreate({where: { name: winner }, defaults: { name: winner, score: 0}})
        .spread((rec, created) => {
            rec.increment('score');
            
            PlayerDB.rank.findOrCreate({where: { name: loser }, defaults: { name: loser, score: 0}})
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

PlayerDB.redisclient = {};
PlayerDB.mysqlclient = {};
PlayerDB.account = {};
PlayerDB.rank = {};

module.exports = PlayerDB;