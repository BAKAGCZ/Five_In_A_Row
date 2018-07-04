const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');


const ChessDB = require('./model/chess_db');
const ChessBoard = require('./controller/chess_board');

/* { room_id : [user_id, ...] } */
var rooms = {};
/* { room_id : { room, room_number, white, black } } */
var room_info = {}; 
/* { user_id : { uname, room, chess } } */
var player_info = {};
const TIME_LIMIT = 60; // 每步时长60s 
var player_timer = {};

var room_number = 1;
var room_capacity = 2;
var chess_boards = {};


app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res){
    res.sendFile(__dirname + '/view/index.html');
});

app.get('/generals', function(req, res){
	if (req.headers['x-pjax'] != 'true') res.sendFile(__dirname + '/view/index.html')
    else res.sendFile(__dirname + '/view/generals.html');
});

app.get('/waiting', function(req, res){
    if (req.headers['x-pjax'] != 'true') res.sendFile(__dirname + '/view/index.html')
    else res.sendFile(__dirname + '/view/waiting.html');
});

app.get('/battle', function(req, res){
    if (req.headers['x-pjax'] != 'true') res.sendFile(__dirname + '/view/index.html')
    else res.sendFile(__dirname + '/view/battle.html');
});

app.get('/chat_room', function(req, res){
    if (req.headers['x-pjax'] != 'true') res.sendFile(__dirname + '/view/index.html')
    else res.sendFile(__dirname + '/view/chat_room.html');
});

app.get('/ranking_list', function(req, res){
    if (req.headers['x-pjax'] != 'true') res.sendFile(__dirname + '/view/index.html')
    else res.sendFile(__dirname + '/view/ranking_list.html');
});

app.get('/about', function(req, res){
    if (req.headers['x-pjax'] != 'true') res.sendFile(__dirname + '/view/index.html')
    else res.sendFile(__dirname + '/view/about.html');
});

io.on('connection', function(socket){
    console.log('socket.id: ' + socket.id + ' connected. ' + Date());
    var user_id = socket.id;
    var room_id = ''; // 创建者的user_id
    var my_name = '';
    var enemy_name = '';
    var is_leave = 0; // 是否离开房间
    var times = TIME_LIMIT; // 每步时长

    /* ----- 倒计时 ----- */
    function setCountDown() {
        times = TIME_LIMIT;
        player_timer[room_id] = setInterval(function(){
            io.sockets.in(room_id).emit('play_countdown', times--);
            if (times < 0) {
                io.sockets.in(room_id).emit('play_timeout', my_name);
                clearInterval(player_timer[room_id]);
                ChessDB.update(winner=enemy_name, loser=my_name);
                room_info[room_id].is_end = 1;
            }
        }, 1000);
    }

    function cancelCountDown() {
        clearInterval(player_timer[room_id]);
    }

    function resetCountDown() {
        cancelCountDown();
        setCountDown();
    }
    /* ----- 倒计时 ----- */

    socket.on('join',function(user_name){
    	// console.log('join');
        my_name = user_name;
        is_leave = 0;
        
        var flag = 0;
        var is_ok = 0;

        //有房间人数未满
        for (var i in rooms)
        {
            if (rooms[i].length < room_capacity)
            {
                rooms[i].push(user_id);
                if (rooms[i].length >= room_capacity)
                    is_ok = 1;
                room_id = i;
                flag = 1;
                break;
            }
        }

        //房间全满 或 当前没有房间
        if (!flag)
        {
            room_id = user_id;
            rooms[room_id] = [user_id];
            room_info[room_id] = {};
        }

        // 输出房间信息
        // for (var i in rooms)
        //     console.log('room[' + i + ']: ' + rooms[i].length);

        //进入房间
        socket.join(room_id);
        
        room_info[room_id].room_id = room_id;
        room_info[room_id].is_end = 0; // 对局是否已经结束
        player_info[user_id] = {};
        player_info[user_id].uname = my_name;
        player_info[user_id].room_id = room_id;
        player_info[user_id].chess = 0;
        
        if (is_ok)
        {
        	var play_enemy = player_info[rooms[room_id][0]];
        	var play_me = player_info[rooms[room_id][1]];
        	if (Math.random()>0.5)
        	{
	            play_enemy.chess = ChessBoard.config.white;
	            play_me.chess = ChessBoard.config.black;
	            room_info[room_id].white = play_enemy;
	            room_info[room_id].black = play_me;
	        }
	        else
	        {
	        	play_enemy.chess = ChessBoard.config.black;
	            play_me.chess = ChessBoard.config.white;
	            room_info[room_id].white = play_me;
	            room_info[room_id].black = play_enemy;
	        }
            enemy_name = play_enemy.uname; // 对手名字
            room_info[room_id].room_number = room_number++;

	        // 通知room里的玩家
	        io.sockets.in(room_id).emit('game_start');
            // 生成棋盘
            chess_boards[room_id] = new ChessBoard();
            chess_boards[room_id].create();

            times = TIME_LIMIT;
            setCountDown();
        }
        else
        {
            // console.log(rooms[room_id]);
            var data = {
                player_number: rooms[room_id].length,
                room_id: room_id
            };
            socket.emit('game_waiting', data);
        }
    });


    function leave_room(){
        if (is_leave == 1) return;
        is_leave = 1;
    	console.log(user_id + " leave room (" + room_id + ')');
        if (rooms[room_id] == undefined) return;
        var is_end = room_info[room_id].is_end; // 该房间游戏是否已经结束

        var index = rooms[room_id].indexOf(user_id);
        if (index != -1)
            rooms[room_id].splice(index, 1);

        // 更新房间信息
        if (rooms[room_id].length == 0)
        {
            delete rooms[room_id];
            delete room_info[room_id];
        }

        // 删除玩家
        if (player_info[user_id]) delete player_info[user_id];

        // 删除房间定时器
        cancelCountDown();
        if (player_timer[room_id]) delete player_timer[room_id];

        // 初始化棋盘
        if (chess_boards[room_id]) chess_boards[room_id].reset();

        // 游戏未结束 直接退出算认输
        console.log(is_end);
        if (is_end == 0)
        {
            ChessDB.update(winner=enemy_name, loser=my_name);
            socket.broadcast.to(room_id).emit('play_break', 0); 
        }
        else
        {
            // 正常退出
            socket.broadcast.to(room_id).emit('play_break', 1); 
        }
        socket.leave(room_id);
    }

    socket.on('leave', leave_room);
    socket.on('disconnect', leave_room);

    socket.on('play_one', function(data){
        if (room_info[room_id].is_end == 1) return;
        if (chess_boards[room_id] == undefined || room_info[room_id] == undefined) return;
        if (player_info[user_id] == undefined || player_info[user_id].chess == ChessBoard.config.visitor) return; // 观众

        var play_state = chess_boards[room_id].play(data.chess, data.x, data.y);
        
        // 更新排行榜
        if (play_state == ChessBoard.config.play_win)
        {
            ChessDB.update(winner=my_name, loser=enemy_name);
            room_info[room_id].is_end = 1;
        }

        var res = {
            chess: data.chess,
            state: play_state,
            x: data.x,
            y: data.y
        };

        io.sockets.in(room_id).emit('play_one', res);
        
        if (play_state == ChessBoard.config.play_keep)
            resetCountDown();
        else if (play_state == ChessBoard.config.play_win)
            cancelCountDown();
    });

    socket.on('play_defeat', function(){
        if (room_info[room_id].is_end == 1) return;
        room_info[room_id].is_end = 1;
        if (player_info[user_id] == undefined) return;
        // 更新排行榜
        ChessDB.update(winner=enemy_name, loser=my_name);
        io.sockets.in(room_id).emit('play_defeat', player_info[user_id].chess);

        cancelCountDown();
    });

    socket.on('room_info', function(){
    	if (room_info[room_id] == undefined) return;
    	socket.emit('room_info', room_info[room_id]);
    });

    socket.on('player_info', function(){
    	if (player_info[user_id] == undefined) return;
        socket.emit('player_info', player_info[user_id]);
    });

    socket.on('room_list', function(){
        socket.emit('room_list', room_info);
    });

    socket.on('chat_message', function(data){
        io.sockets.emit('chat_message', data);
    });

    socket.on('player_rank', function(data){
        ChessDB.getTopN(data.currentPage, data.countPerPage).then(res => {
            socket.emit('player_rank', res);
        });
    });

    socket.on('reset', function(){
        if (chess_boards[room_id] == undefined) return;
        chess_boards[room_id].reset();
    });
});


http.listen(2233, function(){
    console.log('listening on *: 2233');
});
