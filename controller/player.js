var crypto = require('crypto');
var redisclient = require('../model').redis;
var player_account = require('../model').player_account;
var player_rank = require('../model').player_rank;
var ChessBoard = require('./controller').chessboard;

const player_passcode_length = 4;
const player_login_failed = -1;

const Status = {
    GAME_PLAY: 1,
    GAME_WAIT: 2,
    GAME_VISIT: 3    
};

/* { username : { uname, room, chess } } */
var player = {};

class Player
{
	constructor() { 
        this.md5 = crypto.createHash('md5');
    }

    create(username) {
        player[username] = {
            uname: username,
            roomid: 0,
            chess: ChessBoard.config.none,
            status: Status.GAME_VISIT
        };
    }

    isPlaying(username) { return player[username].status == Status.GAME_PLAY; }

    join(username, roomid) { player[username].roomid = roomid; }

    ready(username) { player[username].status = Status.GAME_WAIT; }

    start(username, chess) {
        player[username].chess = chess;
        player[username].status = Status.GAME_PLAY;
    }

    end(username) {
        player[username].chess = ChessBoard.config.none;
        player[username].status = GAME_VISIT;
    }

    leave(username) {
        player[username].roomid = 0;
        player[username].status = Status.GAME_VISIT;
    }

    destory(username) { delete player[username]; }


    cryptStr(strings) {
        strings += strings + '0isdWdX';
        return this.md5.update(strings).digest('hex');
    }

    login(token) {
        return new Promise(function(resolve, reject){
            if (token == undefined) reject('undefined token');
            if (token.length < player_passcode_length) resolve(player_login_failed);
            let username = token.substr(0, token.length - player_passcode_length);
            let passcode = token.substr(token.length - player_passcode_length);
            player_account.findOne({
                name: username,
                passcode: passcode
            }).then(res => {
                if (!res) 
                    resolve(player_login_failed);
                else
                {
                    let sessionid = cryptStr(token);
                    redisclient.set('sessionid:'+sessionid, username, function(err){
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