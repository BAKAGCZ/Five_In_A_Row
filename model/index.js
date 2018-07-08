var _db = require('./_db');
var mysqlclient = _db.mysql;
var redisclient = _db.redis;
var player_account = mysqlclient.import('./player_account');
var player_rank = mysqlclient.import('./player_rank');

player_account.hasOne(player_rank);
player_rank.belongsTo(player_account);

mysqlclient.sync(/*{ force: true }*/);

module.exports.player_account = player_account;
module.exports.player_rank = player_rank;

module.exports.redis = redisclient;