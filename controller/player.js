var crypto = require('crypto');

var redisclient = require('../model').redis;
var player_account = require('../model').player_account;
var player_rank = require('../model').player_rank;
var player_chessboard = require('../model').player_chessboard;
var ChessBoard = require('../controller').chessboard;

// const player_automatch_key = 'automatch';
const player_sessionid_key = 'sessionid:';
const player_sessionid_key_expire_time = 60 * 60 * 24;
const player_passcode_length = 4;

const Status = {
    REGISTER_FAILED: -2,
    LOGIN_FAILED: -1,
    GAME_PLAY: 1,
    GAME_READY: 2,
    GAME_VISIT: 3    
};

/* { username : { uname, room, chess } } */
var player = {};
var player_socket = {};

class Player
{
	constructor() { 
        this.md5 = crypto.createHash('md5');
    }

    create(username, socket) {
        player_socket[username] = socket;

        player_rank.findOne({ name: username })
        .then(res => {
            player[username] = {
                uname: username,
                enemyname: '', // 如果有对手
                roomid: null,
                chess: ChessBoard.config.none,
                score: res.score,
                win: res.win, lose: res.lose,
                status: Status.GAME_VISIT
            };
        })
        .catch(err => { throw err; });
    }


    // 加入房间
    join(username, roomid) { player[username].roomid = roomid; }
    // 准备
    ready(username) { player[username].status = Status.GAME_READY; } 

    start(username, enemyname, chess) {
        player[username].chess = chess;
        player[username].enemyname = enemyname;
        player[username].status = Status.GAME_PLAY;
    }

    end(username) {
        player[username].chess = ChessBoard.config.none;
        player[username].status = GAME_VISIT;
    }

    leave(username) {
        player[username].roomid = null;
        player[username].status = Status.GAME_VISIT;
    }

    destory(username) { delete player[username]; }

    // 玩家状态监测
    isVisit(username)   { return player[username].status == Status.GAME_VISIT; }
    isReady(username)   { return player[username].status == Status.GAME_READY; }
    isPlaying(username) { return player[username].status == Status.GAME_PLAY; }
    
    has(username)          { return player[username] != undefined; } // 检查是否有这位玩家的信息
    get(username)          { return player[username]; }
    isInRoom(username)     { return player[username].roomid != null; }
    getEnemyName(username) { return player[username].enemyname; }  
    getChess(username)     { return player[username].chess; }
    getRoomId(username)    { return player[username].roomid; }
    getSocket(username)    { return player_socket[username]; }



    cryptStr(strings) {
        strings += Date();
        return this.md5.update(strings).digest('hex');
    }

    // 登录 成功=> {username, sessionid}  失败=> LOGIN_FAILED(-1)
    login(token) {
        return new Promise((resolve, reject) => {
            if (token == undefined) reject('undefined token');
            if (token.length < player_passcode_length) resolve(Status.LOGIN_FAILED);
            let username = token.substr(0, token.length - player_passcode_length);
            let passcode = token.substr(token.length - player_passcode_length);
            player_account.findOne({
                name: username,
                passcode: passcode
            })
            .then(res => {
                if (!res) 
                    resolve(Status.LOGIN_FAILED);
                else
                {
                    let sessionid = cryptStr(username);
                    redisclient._set(player_sessionid_key + sessionid, username)
                    .then(res => {
                        redisclient.expire(player_sessionid_key + sessionid, player_sessionid_key_expire_time);
                        resolve({username:username, sessionid:sessionid});
                    })
                    .catch(err => { reject(err); });
                }
            })
            .catch(err => {
                reject(err);
            });
        });
    }

    logout(sessionid) {
        return redisclient.del(player_sessionid_key + sessionid);
    }

    // 验证登录状态 成功=> 返回username  失败=> 返回Status.LOGIN_FAILED(-1)
    valid(sessionid) {
        return redisclient._get(player_sessionid_key + sessionid);
    }

    // 注册 成功=> {username, sessionid}  失败=> REGISTER_FAILED(-2)
    register(username, uuid) {
        let passcode = cryptStr(uuid.substr(0, player_passcode_length));
        return new Promise((resolve, reject) => {
            player_account.findOrCreate({ where: {name: username} }, { defaults: {passcode: passcode} })
            .spread((res, created) => {
                if (!created) resolve(Status.REGISTER_FAILED);
                else 
                {
                    let sessionid = cryptStr(username);
                    redisclient._set(player_sessionid_key + sessionid, username)
                    .then(res => { resolve({username: username, sessionid:sessionid}); })
                    .catch(err => { reject(err); });
                }
            })
            .catch(err => {
                reject(err);
            });
        });
    }

    getPlayerCount() {
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
        let roomid = getRoomId(winner);
        player[winner].score++; player[winner].win++;
        player[loser].score--;  player[loser].lose++;
        return Promise.all([
            player_rank.findOrCreate({where: { name: winner }, defaults: { name: winner, score: 0}})
            .spread((rec, created) => {
                rec.increment('score'); rec.increment('win');
                player_rank.findOrCreate({where: { name: loser }, defaults: { name: loser, score: 0}})
                .spread((rec, created) => {
                    rec.decrement('score'); rec.increment('lose')
                }).catch(error => { throw(error); });
            }).catch(error => { throw(error); })
            ,
            player_chessboard.create({
                winner: winner, 
                loser: loser, 
                chessboard: ChessBoard.getChessManual(this.getRoomId(winner)).toString()
            })
        ]);
	}
}

Player.Status = Status;

module.exports = new Player();