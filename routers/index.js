const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const redisclient = require('../model').redis;
const ChatDB = require('../controller').chat,
      Room = require('../controller').room,
      Player = require('../controller').player,
      ChessBoard = require('../controller').chessboard;

const TIME_LIMIT = 60; // 每步时长60s 
var timer = {};
const autoMatchKey = 'autoMatch';

function Init()
{
    var autoMatch = setInterval(function(){
        redisclient._scard(autoMatchKey)
        .then(res => {
            while (res>=2)
            {
                let usernames = [autoMatchKey, autoMatchKey].map(item => { return redisclient._spop(item); });
                let p1socket = Player.getSocket(usernames[0]),
                    p2socket = Player.getSocket(usernames[1]);

                let room_id = p1socket.id;

                Room.create(room_id, player1+'&'+player2);
                Room.join(room_id, res[0]);
                Room.join(room_id, res[1]);
                p1socket.join(room_id);
                p2socket.join(room_id);
                io.sockets.in(room_id).emit('confirm_join_room', room_id);

                res -= 2;
            }
        })
        .catch(err => { throw err; });
    }, 1000);


    io.on('connection', function(socket){
        console.log('socket.id: ' + socket.id + ' connected. ' + Date());
        let user_id = socket.id;
        let room_id = ''; // 创建者的user_id
        let times = TIME_LIMIT; // 每步时长
        let valid_code = user_id.substr(0, 4); // 验证码

        // 需要双方同步的信息
        let my_name = '', enemy_name = '';
        let my_chess = 0, enemy_chess = 0;

        /* ----- 倒计时 START ----- */
        function setCountDown(playing, waiting) {
            if (playing == undefined) playing = my_chess;
            if (waiting == undefined) waiting = enemy_chess;
            times = TIME_LIMIT;
            timer[room_id] = setInterval(function(){
                io.sockets.in(room_id).emit('notify_play_countdown', times--);
                if (times < 0) {
                    io.sockets.in(room_id).emit('notify_play_timeout', playing);
                    clearInterval(timer[room_id]);
                    if (playing == my_chess)
                        Room.end(room_id, enemy_name, my_name);
                    else
                        Room.end(room_id, my_name, enemy_name);

                    io.sockets.in(room_id).emit('notify_game_over');
                }
            }, 1000);
        }

        function cancelCountDown() {
            clearInterval(timer[room_id]);
        }

        function resetCountDown() {
            cancelCountDown();
            setCountDown();
        }
        /* ----- 倒计时 END ----- */

        /* ----- 自动匹配 START ----- */
        socket.on('notify_join_automatch',function(){
            if (!Player.has(my_name)) return;

            redisclient.sadd(autoMatchKey, my_name, (err, res) => {
                if (err) throw err;
                else socket.emit('confirm_join_automatch', my_name);
            });
        });

        socket.on('notify_leave_automatch',function(){
            if (!Player.has(my_name)) return;

            redisclient.srem(autoMatchKey, my_name, (err, res) => {
                if (err) throw err;
                else socket.emit('confirm_leave_automatch', my_name);
            });
        });
        /* ----- 自动匹配 END ----- */

        /* ----- 房间 START ----- */
        socket.on('notify_create_room', function(roomname){
            if (!Player.has(my_name)) return;

            room_id = user_id; // 创建者ID为房间ID
            Room.create(room_id, roomname);
            Room.join(room_id, my_name);

            socket.join(room_id);
            socket.emit('confirm_create_room');
        });


        socket.on('notify_join_room', function(roomid){
            if (!Player.has(my_name)) return;

            room_id = roomid;
            Room.join(room_id, my_name);
            
            socket.join(room_id);
            io.sockets.in(room_id).emit('confirm_join_room',room_id);
        });

        socket.on('notify_game_ready', function(){
            if (!Player.has(my_name) || !Player.isInRoom(my_name)) return;

            Player.ready(my_name);
            if (Room.isAllReady(room_id))
            {
                Room.start(room_id);
                // 生成棋盘
                if (!ChessBoard.has(room_id))
                    ChessBoard.create(room_id);
                else
                    ChessBoard.reset(room_id);
                
                io.sockets.in(room_id).emit('notify_game_start');
            }
        });

        function leave_room()
        {
            if (!Player.has(my_name)) return; // 用户没有登录

            // 玩家在游戏未结束时 直接退出算认输
            if (Player.isPlaying(my_name))
            {
                Room.end(room_id, enemy_name, my_name);
                socket.broadcast.to(room_id).emit('play_defeat', my_chess);

                // 删除定时器
                cancelCountDown();
                if (timer[room_id]) delete timer[room_id];

                // 初始化棋盘
                if (ChessBoard.has(room_id)) ChessBoard.reset(room_id);
                
                io.sockets.in(room_id).emit('notify_game_over');
            }

            console.log(my_name + ' leave_room.')
            console.log('leave_room('+room_id+')  have '+Room.getPlayerNumber(room_id)+' players and ' 
                + Room.getVisitorNumber(room_id) + ' visitors.');

            Room.leave(room_id, my_name);

            socket.broadcast.to(room_id).emit('confirm_leave_room', room_id);        
            socket.leave(room_id);
        }

        socket.on('notify_leave_room', leave_room);
        socket.on('disconnect', function(){
            if (!Player.has(my_name)) return;
            if (Player.isInRoom(username))
                leave_room();
            Player.destory(my_name);
        });
        /* ----- 房间 END ----- */

        /* ----- 游戏状态 START ----- */
        // 该房间游戏开始 同步状态
        socket.on('confirm_game_start', function(){
            if (!Player.has(my_name)) return;

            if (Player.isPlaying(my_name))
            {
                enemy_name = Player.getEnemyName(my_name);
                my_chess = Player.getChess(my_name);
                enemy_chess = Player.getChess(enemy_name);
                if (Room.iConfirm(room_id, my_name)) setCountDown(ChessBoard.config.black, ChessBoard.config.white);
            }
        });
        
        // 该房间游戏结束 同步状态
        socket.on('confirm_game_over', function(){
            if (!Player.has(my_name)) return;

            console.log(my_name + ' game over.')
            Player.end(my_name);
        });

        // 下一步棋
        socket.on('notify_play_one', function(data){
            // console.log(my_name + ' -> play_one');
            if (!Player.has(my_name)
                || !Player.isPlaying(my_name)) return;

            let play_state = ChessBoard.play(room_id, data.chess, data.x, data.y);

            io.sockets.in(room_id).emit('confirm_play_one', {
                chess: data.chess,
                state: play_state,
                x: data.x,
                y: data.y
            });
            
            if (play_state == ChessBoard.config.play_keep)
                resetCountDown();
            else if (play_state == ChessBoard.config.play_win)
            {
                Room.end(room_id, my_name, enemy_name);
                cancelCountDown();
                io.sockets.in(room_id).emit('notify_game_over');
            }
        });

        // 一方认输
        socket.on('notify_play_defeat', function(){
            if (!Player.has(my_name) || !Player.isPlaying(my_name)) return;

            Room.end(room_id ,enemy_name,my_name);
            cancelCountDown();
            io.sockets.in(room_id).emit('confirm_play_defeat', my_chess);
            io.sockets.in(room_id).emit('notify_game_over');
        });
        /* ----- 游戏状态 END ----- */

        /* ----- 信息获取 START ----- */
        // 获取自己所在的房间信息
        socket.on('get_my_room', function(){
            if (!Player.isInRoom(my_name)) return;
            socket.emit('get_my_room', Room.get(Player.getRoomId(my_name)));
        });

        // 获取指定id的房间信息
        socket.on('get_room_info', function(room_id){
            if (!Room.has(room_id)) return;
        	socket.emit('get_room_info', Room.get(room_id));
        });

        socket.on('get_player_info', function(){
            if (!Player.has(my_name)) return;
            socket.emit('get_player_info', Player.get(my_name));
        });

        socket.on('get_room_list', function(data){
            if (!Player.has(my_name)) return;
            socket.emit('get_room_list', Room.getRoomList(data.currentPage, data.countPerPage));
        });

        socket.on('get_player_rank', function(data){
            Player.getTopN(data.currentPage, data.countPerPage)
            .then(res => { socket.emit('get_player_rank', res); })
            .catch(err => { throw err; });
        });

        // 玩家总数
        socket.on('get_player_number', function(){
            if (!Player.has(my_name)) return;
            Player.getPlayerCount()
            .then(res => { socket.emit('get_player_number', res); })
            .catch(err => { throw err; });
        });
        /* ----- 信息获取 END ----- */

        /* ----- 通讯 START ----- */
        // 房间内通讯
        socket.on('room_chat_message', function(data){ io.sockets.in(room_id).emit('room_chat_message', data); });

        // 公频通讯
        socket.on('chat_message', function(data){
            // console.log(data.sender+ ' '+data.msg);
            ChatDB.add(data)
            .then(res => { io.sockets.emit('chat_message', data); })
            .catch(err => { throw(err); });
        });

        socket.on('get_chat_history', function(data){
            ChatDB.get(data.currentPage, data.countPerPage)
            .then(res => { socket.emit('get_chat_history', res); })
            .catch(err => { throw err; });
        });
        /* ----- 通讯 END ----- */


        /* ----- 登录绑定 START ----- */
        socket.on('notify_registr', function(data){
            Player.register(data.username, data.email, data.vcode)
            .then(res => { socket.emit('confirm_register', res); })
            .catch(err => { throw err; });
        });

        socket.on('notify_login', function(data){
            if (data.vcode == valid_code)
            {
                Player.login(data.email)
                .then(res => { socket.emit('confirm_login', res); })
                .catch(err => { throw err; });
            }
        });

        socket.on('notify_logout', function(sessionid){
            if (!Player.has(my_name)) return;
            if (Player.isInRoom(username))
                leave_room();
            Player.destory(my_name);

            Player.logout(sessionid)
            .then(res => { socket.emit('confirm_logout'); })
            .catch(err => { throw err; });
        });

        socket.on('notify_login_valid', function(sessionid){
            Player.valid(sessionid)
            .then(res => {
                if (res)
                {
                    my_name = res;
                    Player.create(my_name, socket);
                    socket.emit('confirm_login_valid');
                }
                else
                    socket.emit('confirm_login_invalid'); 
            })
            .catch(err => { throw err; });
        });


        socket.on('notify_sendmail', function(email){
            Player.sendMail(user_id, "验证码: " + valid_code)
            .then(res => { socket.on('confirm_sendmail'); })
            .catch(err => { throw err; });
        });
        /* ----- 登录绑定 START ----- */

    });
}

module.exports = Init;