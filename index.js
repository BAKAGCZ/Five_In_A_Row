const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');

var BattleField = require('./controller/battle_field');

/* { room_id : [user_id, ...] } */
var rooms = {};
/* { room_id : { room, room_number, white, black } } */
var room_info = {}; 
/* { user_id : { uname, room, chess } } */
var player_info = {};

var room_number = 1;
var room_capacity = 2;
var battle_fields = {};


app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res){
    res.sendFile(__dirname + '/view/index.html');
});

app.get('/generals', function(req, res){
    res.sendFile(__dirname + '/view/generals.html');
});

app.get('/waiting', function(req, res){
    res.sendFile(__dirname + '/view/waiting.html');
});

app.get('/battle', function(req, res){
    res.sendFile(__dirname + '/view/battle.html');
});



io.on('connection', function(socket){
    console.log('socket.id: ' + socket.id + ' connected. ' + Date());
    var user_id = socket.id;
    var room_id = ''; // 创建者的user_id
    var is_leave = 0;

    socket.on('join',function(user_name){
    	// console.log('join');
        var flag = 0;
        var is_ok = 0;

    	is_leave = 0;


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
        for (var i in rooms)
            console.log('room[' + i + ']: ' + rooms[i].length);

        //进入房间
        socket.join(room_id);
        
        room_info[room_id].room_id = room_id;
        player_info[user_id] = {};
        player_info[user_id].uname = user_name;
        player_info[user_id].room_id = room_id;
        player_info[user_id].chess = 0;
        
        if (is_ok)
        {
        	var play_a = player_info[rooms[room_id][0]];
        	var play_b = player_info[rooms[room_id][1]];
        	if (Math.random()>0.5)
        	{
	            play_a.chess = 1;
	            play_b.chess = 2;
	            room_info[room_id].white = play_a;
	            room_info[room_id].black = play_b;
	        }
	        else
	        {
	        	play_a.chess = 2;
	            play_b.chess = 1;
	            room_info[room_id].white = play_b;
	            room_info[room_id].black = play_a;
	        }
            room_info[room_id].room_number = room_number++;
            console.log(room_number + ' plays');

	        // 通知room里的玩家
	        io.sockets.in(room_id).emit('game_start');
            // 生成棋盘
            battle_fields[room_id] = new BattleField();
            battle_fields[room_id].create();
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

        // 初始化棋盘
        if (battle_fields[room_id]) battle_fields[room_id].reset();

        socket.broadcast.to(room_id).emit('play_break');
        socket.leave(room_id);
    }

    socket.on('leave', leave_room);
    socket.on('disconnect', leave_room);

    socket.on('play_one', function(data){
        if (battle_fields[room_id] == undefined) return;
        if (player_info[user_id] == undefined || player_info[user_id].chess == 0) return; // 观众

        var play_state = battle_fields[room_id].play(data.chess, data.x, data.y);

        var res = {
            chess: data.chess,
            state: play_state,
            x: data.x,
            y: data.y
        };

        io.sockets.in(room_id).emit('play_one', res);
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

    socket.on('chat_message', function(msg){
        io.sockets.in(room_id).emit('chat_message', { sender: user_name, msg: msg });
    });

    socket.on('reset', function(){
        if (battle_fields[room_id] == undefined) return;
        battle_fields[room_id].reset();
    });
});


http.listen(2233, function(){
    console.log('listening on *: 2233');
});
