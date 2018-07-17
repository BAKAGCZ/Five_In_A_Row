var _db = require('./_db');
var mysqlclient = _db.mysql;
var redisclient = _db.redis;
var player_account = mysqlclient.import('./player_account');
var player_rank = mysqlclient.import('./player_rank');
var player_chessboard = mysqlclient.import('./player_chessboard');

player_account.hasOne(player_rank);
player_rank.belongsTo(player_account);
player_account.hasOne(player_chessboard);
player_chessboard.belongsTo(player_account);

mysqlclient.sync({ force: true });

/* ----- redis wrapper ----- */
redisclient._set = function(key, value) {
    return new Promise((resolve, reject) => {
        redisclient.set(key, value, (err, res) => {
            if (err) reject(err);
            else resolve(res);
        });
    });
}

redisclient._get = function(key) {
    return new Promise((resolve, reject) => {
        redisclient.get(key, (err, res) => {
            if (err) reject(err);
            else resolve(res);
        });
    });
}

redisclient._del = function(key) {
    return new Promise((resolve, reject) => {
        redisclient.del(key, (err, res) => {
            if (err) reject(err);
            else resolve(res);
        });
    });
}

redisclient._spop = function(key) {
    return new Promise((resolve, reject) => {
        redisclient.spop(key, (err, res) => {
            if (err) reject(err);
            else resolve(res);
        });
    });
}

redisclient._scard = function(key) {
    return new Promise((resolve, reject) => {
        redisclient.scard(key, (err, res) => {
            if (err) reject(err);
            else resolve(res);
        });
    });
}

module.exports.player_account = player_account;
module.exports.player_rank = player_rank;
module.exports.player_chessboard = player_chessboard;

module.exports.redis = redisclient;