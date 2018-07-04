const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');


const ChessDB = require('./model/chess_db');
const ChessBoard = require('./controller/chess_board');
// const ChatDB = require('./model/chat_db');

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
    var is_waiting = 0;
    var is_playing = 0; // 是否离开房间
    var times = TIME_LIMIT; // 每步时长

    function init_roominfo()
    {
        room_info[room_id] = {};
        room_info[room_id].white = {};
        room_info[room_id].black = {};
        room_info[room_id].room_id = room_id;
        room_info[room_id].is_end = 0; // 对局是否已经结束 0=>未结束
        room_info[room_id].is_save = 0; // 对局结果未保存
        room_info[room_id].room_number = 0;
    }

    function init_playerinfo()
    {
        player_info[user_id] = {};
        player_info[user_id].uname = my_name;
        player_info[user_id].room_id = room_id;
        player_info[user_id].chess = 0;
    }

    // 保留对局结果
    function save_result(winner, loser)
    {
        if (room_info[room_id].is_save == 0)
        {
            console.log('save_result: winner=>' + winner + ' enemy_name=>'+enemy_name);
            ChessDB.update(winner, loser);
            room_info[room_id].is_save = 1;
        }
    }

    function game_start_state() 
    {
        is_playing = 1;
        is_waiting = 0;
    }

    function game_waiting_state()
    {
        is_playing = 0;
        is_waiting = 1;
    }

    function game_over_state()
    {
        // 该房间游戏已经结束
        room_info[room_id].is_end = 1; 
        game_waiting_state();
    }


    function leave_room(){
        console.log('leave_room: my_name:'+my_name+' enemy_name:'+enemy_name);
        console.log(user_id + " leave room (" + room_id + ')');
        if (rooms[room_id] == undefined || room_info[room_id] == undefined) return;

        // 删除用户id
        var index = rooms[room_id].indexOf(user_id);
        if (index != -1)
            rooms[room_id].splice(index, 1);

        // 删除玩家信息
        if (player_info[user_id]) delete player_info[user_id];

        // 删除定时器
        cancelCountDown();
        if (player_timer[room_id]) delete player_timer[room_id];

        // 初始化棋盘
        if (chess_boards[room_id]) chess_boards[room_id].reset();
        
        // 游戏未结束 直接退出算认输
        if (is_playing == 1 && room_info[room_id].is_end == 0)
        {
            socket.broadcast.to(room_id).emit('play_break', 0);
            game_over_state();
            save_result(enemy_name,my_name); 
        }
        else
        {
            // 正常退出
            socket.broadcast.to(room_id).emit('play_break', 1);
            game_over_state();
        }
        cancelCountDown();

        // 更新房间信息
        if (rooms[room_id].length == 0)
        {
            delete rooms[room_id];
            delete room_info[room_id];
        }

        socket.leave(room_id);
    }

    /* ----- 倒计时 ----- */
    function setCountDown() {
        times = TIME_LIMIT;
        player_timer[room_id] = setInterval(function(){
            io.sockets.in(room_id).emit('play_countdown', times--);
            if (times < 0) {
                io.sockets.in(room_id).emit('play_timeout', my_name);
                clearInterval(player_timer[room_id]);
                save_result(enemy_name,my_name);
                game_over_state();
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
        
        let flag = 0;
        let is_ok = 0;

        //有房间人数未满
        for (let i in rooms)
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
        }

        // 输出房间信息
        // for (var i in rooms)
        //     console.log('room[' + i + ']: ' + rooms[i].length);

        //进入房间
        socket.join(room_id);
        if (room_info[room_id] == undefined) init_roominfo();
        init_playerinfo();
        
        if (is_ok)
        {
        	let play_enemy = player_info[rooms[room_id][0]];
        	let play_me = player_info[rooms[room_id][1]];
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
            room_info[room_id].room_number = room_number++;
            console.log('room('+room_id+')  white=>'+room_info[room_id].white.uname + ' black=>'+room_info[room_id].black.uname);

	        // 通知room里的玩家
	        io.sockets.in(room_id).emit('game_start');
            // 生成棋盘
            if (chess_boards[room_id] == undefined)
            {
                chess_boards[room_id] = new ChessBoard();
                chess_boards[room_id].create();
            }
            else
                chess_boards[room_id].reset();

            setCountDown();
        }
        else
        {
            game_waiting_state();
            // console.log(rooms[room_id]);
            socket.emit('game_waiting', {
                player_number: rooms[room_id].length,
                room_id: room_id
            });
        }
    });


    socket.on('leave', leave_room);
    socket.on('disconnect', leave_room);

    socket.on('game_start', function(){
        if (my_name == room_info[room_id].white.uname)
            enemy_name = room_info[room_id].black.uname;
        else
            enemy_name = room_info[room_id].white.uname;

        game_start_state();
    });

    socket.on('play_one', function(data){
        if (room_info[room_id]==undefined 
            || room_info[room_id].is_end == 1 
            || chess_boards[room_id] == undefined 
            || room_info[room_id] == undefined
            || player_info[user_id] == undefined 
            || player_info[user_id].chess == ChessBoard.config.visitor) return; // 观众

        var play_state = chess_boards[room_id].play(data.chess, data.x, data.y);

        io.sockets.in(room_id).emit('play_one', {
            chess: data.chess,
            state: play_state,
            x: data.x,
            y: data.y
        });
        
        if (play_state == ChessBoard.config.play_keep)
            resetCountDown();
        else if (play_state == ChessBoard.config.play_win)
        {
            save_result(my_name,enemy_name);
            game_over_state();
            cancelCountDown();
        }
    });

    socket.on('play_defeat', function(){
        if (room_info[room_id]==undefined 
            || room_info[room_id].is_end == 1
            || player_info[user_id] == undefined) return;

        save_result(enemy_name,my_name);
        game_over_state();
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
