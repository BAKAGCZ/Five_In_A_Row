var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var BattleField = require('./controller/battle_field');

var rooms = [];
/* { room_id : { room, white, black } } */
var room_info = []; 
/* { user_id : { uname, room, chess } } */
var player_info = {};
/* { user_id : socket } */
var player_socket = {};

var room_capacity = 2;
var battle_fields = {};


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
    console.log('socket ' + socket.id + ' connected. ' + Date());
    var user_id = socket.id;
    var room_idx = 0;
    var room_id = '0';
    var is_leave = 0;

    socket.on('join',function(user_name){
    	console.log('join');
        var flag = 0;
        var is_ok = 0;

        player_info[user_id] = {};
    	is_leave = 0;

        //有房间人数未满
        for (var i=0; i<rooms.length; i++)
        {
            if (rooms[i].length < room_capacity)
            {
                rooms[i].push(user_id);
                if (rooms[i].length >= room_capacity)
                    is_ok = 1;
                room_idx = i;
                flag = 1;
                break;
            }
        }

        //房间全满 或 当前没有房间
        if (!flag)
        {
            room_idx = rooms.length;
            rooms.push([user_id]);
            room_info.push({});
        }

        room_id = String(room_idx);

        //进入房间
        socket.join(String(room_id));
        player_info[user_id].uname = user_name;
        player_info[user_id].room = room_idx;
        player_info[user_id].chess = 0;
        room_info[room_idx].room = room_idx;

        if (is_ok)
        {
        	var play_a = player_info[rooms[room_idx][0]];
        	var play_b = player_info[rooms[room_idx][1]];
        	if (Math.random()>0.5)
        	{
	            play_a.chess = 1;
	            play_b.chess = 2;
	            room_info[room_idx].white = play_a;
	            room_info[room_idx].black = play_b;
	        }
	        else
	        {
	        	play_a.chess = 2;
	            play_b.chess = 1;
	            room_info[room_idx].white = play_b;
	            room_info[room_idx].black = play_a;
	        }

	        // 通知room里的玩家
	        io.sockets.in(room_id).emit('game_start');
            // 生成棋盘
            battle_fields[room_idx] = new BattleField();
            battle_fields[room_idx].create();
        }
        else
        {
            // console.log(rooms[room_idx]);
            var data = {
                player_number: rooms[room_idx].length,
                room: room_idx
            };
            socket.emit('game_waiting', data);
        }
    });


    function leave_room(){
    	if (is_leave == 1) return;
    	is_leave = 1;
    	console.log("leave_room");
        if (rooms[room_idx] == undefined) return;

        var index = rooms[room_idx].indexOf(user_id);
        if (index != -1)
            rooms[room_idx].splice(index, 1);

        // 更新房间信息
        if (rooms[room_idx].length == 0)
        {
        	room_info[room_idx].white = 0;
        	room_info[room_idx].black = 0;
        }

        // 删除玩家
        if (player_info[user_id]) delete player_info[user_id];

        // 初始化棋盘
        if (battle_fields[room_idx]) battle_fields[room_idx].reset();

        socket.broadcast.to(room_id).emit('play_break');
        socket.leave(room_id);
    }

    socket.on('leave', function(){leave_room();console.log('leave');});
    socket.on('disconnect', function(){leave_room();console.log('disconnect');});

    socket.on('play_one', function(data){
        if (battle_fields[room_idx] == undefined) return;
        if (player_info[user_id].chess == 0) return; // 观众

        var play_state = battle_fields[room_idx].play(data.chess, data.x, data.y);

        var res = {
            chess: data.chess,
            state: play_state,
            x: data.x,
            y: data.y
        };

        io.sockets.in(room_id).emit('play_one', res);
    });

    socket.on('room_info', function(){
    	if (room_info[room_idx] == undefined) return;
    	socket.emit('room_info', room_info[room_idx]);
    });

    socket.on('player_info', function(){
    	if (player_info[user_id] == undefined) return;
        socket.emit('player_info', player_info[user_id]);
    });

    socket.on('reset', function(){
        if (battle_fields[room_idx] == undefined) return;
        battle_fields[room_idx].reset();
    });
});


http.listen(2233, function(){
    console.log('listening on *: 2233');
});
