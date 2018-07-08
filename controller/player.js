var crypto = require('crypto');
var redisclient = require('../model').redis;
var player_account = require('../model').player_account;
var player_rank = require('../model').player_rank;

const player_passcode_length = 4;
const player_login_failed = -1;

const Status = {
    GAME_PLAY: 1,
    GAME_WAIT: 2,
    GAME_VISIT: 3    
};

/* { user_id : { uname, room, chess } } */
var player_info = {};

class Player
{
	constructor() { 
        this.md5 = crypto.createHash('md5');
    }

    cryptStr(strings) {
        strings += strings + '0isdWdX';
        return this.md5.update(strings).digest('hex');
    }

    login(token) {
        return new Promise(function(resolve, reject){
            if (token == undefined) reject('undefined token');
            if (token.length < player_passcode_length) resolve(player_login_failed);
            let usename = token.substr(0, token.length - player_passcode_length);
            let passcode = token.substr(token.length - player_passcode_length);
            player_account.findOne({
                name: usename,
                passcode: passcode
            }).then(res => {
                if (!res) 
                    resolve(player_login_failed);
                else
                {
                    let sessionid = cryptStr(token);
                    redisclient.set('sessionid:'+sessionid, usename, function(err){
                        if (err) reject(err);
                    });
                    resolve(cryptStr(sessionid));
                }
            }).catch(err => {
                reject(err);
            });
        });
    }

    valid(sessionid) {
        return new Promise(function(resolve, reject){
            redisclient.get('sessionid:'+sessionid, function(err, res){
                if (err) reject(err);
                else if (!res) resolve(player_login_failed);
                else resolve(res);
            })
        });
    }

    register(username) {
        //
    }

    set(userid, username) {
            //     player_info[user_id] = {};
    //     player_info[user_id].uname = my_name;
    //     player_info[user_id].room_id = 0;
    //     player_info[user_id].chess = 0;
    //     player_info[user_id].status = GAME_WAIT;
    }

    join(userid, roomid) {
        player_info[user_id].roomid = roomid;
    }


    getCount() {
        return player_rank.findAll().count();
    }

	getTopN(currentPage, countPerPage) {
		return player_rank.findAll({ 
            limit: countPerPage, 
            offset: currentPage * countPerPage < 0 ? 0 : currentPage * countPerPage,
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

Player.Status = Status;

module.exports = new Player();