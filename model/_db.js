const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');

const redis = require('redis');
const redisclient = redis.createClient();

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

// 数据库名字
const databasename = 'chessdb';
var username = filecontent[0].trim(), password = filecontent[1].trim();
console.log(username, password);

const mysqlclient = new Sequelize(databasename, username, password, {
    // dialect: 'sqlite',
    // storage: './database/ChessDB.sqlite',
    host: 'localhost',
    port: 3306,
    dialect: 'mysql',
    dialectOptions: {
        charset: 'utf8mb4'
    },
    freezeTableName: true,
    timestamps: true,
    logging: false,
    pool: {
        max: 5,
        min: 0,
        acquire: 3000,
        idle: 10000 // 10s release thread
    },
    operatorsAliases
});

mysqlclient.authenticate().then(() => {
    console.log('Connection has been established successfully.');
}).catch(err => {
    console.error('Unable to connect to the database:', err);
});

module.exports.mysql = mysqlclient;
module.exports.redis = redisclient;
