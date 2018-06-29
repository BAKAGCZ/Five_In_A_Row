var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var BattleField = require('./controller/battle_field');

var rooms = [];
/* { room_id : { room, white, black } } */
var room_info = {}; 
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
    player_socket[user_id] = socket;
    var room_id;
    var is_leave = 0;

    socket.on('join',function(user_name){
        var flag = 0;
        var is_ok = 0;

        //有房间人数未满
        for (var i=0; i<rooms.length; i++)
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
            room_id = rooms.length;
            rooms.push([user_id]);
        }

        //进入房间
        socket.join(room_id);
        player_info[user_id].uname = user_name;
        player_info[user_id].room = room_id;
        player_info[user_id].chess = 0;
        room_info[room_id].room = room_id;

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

            var data_a = {
                room_id: room_id,
                user_name: play_a.uname
            };

            var data_b = {
                room_id: room_id,
                user_name: play_b.uname
            };

            player_socket[user_id].emit('game_start', play_a);
            player_socket[user_id].emit('game_start', play_b);
            // 生成棋盘
            battle_fields[room_id] = new BattleField();
            battle_fields[room_id].create();
        }
        else
        {
            // console.log(rooms[room_id]);
            var data = {
                player_number: rooms[room_id].length
            };
            socket.emit('game_waiting', data);
        }
    });


    function leave_room(){
    	if (!is_leave) 
    	{
    		is_leave = 1;
    		return;
    	}
        if (rooms[room_id] == undefined) return;

        var index = rooms[room_id].indexOf(user_id);
        if (index != -1)
            rooms[room_id].splice(index, 1);

        // 更新房间信息
        if (rooms[room_id].length == 0)
        {
        	room_info[room_id].white = 0;
        	room_info[room_id].black = 0;
        }

        // 删除玩家
        if (player_socket[user_id]) delete player_socket[user_id];
        if (player_info[user_id]) delete player_info[user_id];

        // 初始化棋盘
        if (battle_fields[room_id]) battle_fields[room_id].reset();

        socket.leave(room_id);
    }

    socket.on('leave', leave_room);
    socket.on('disconnect', leave_room);

    socket.on('play_one', function(data){
        if (battle_fields[room_id] == undefined) return;
        if (player_info[user_id].chess == 0) return; // 观众

        var play_state = battle_fields[room_id].play(data.chess, data.x, data.y);

        var res = {
            chess: data.chess,
            state: play_state,
            x: data.x,
            y: data.y
        };

        socket.to(room_id).emit('play_state', res);
        socket.emit('play_state', res);
    });

    socket.on('room_info', function(){
    	if (room_info[room_id] == undefined) return;
    	socket.emit('room_info', room_info[room_id]);
    });

    socket.on('player_info', function(){
    	if (player_info[user_id] == undefined) return;
        socket.emit('player_info', player_info[user_id]);
    });

    socket.on('reset', function(){
        if (battle_fields[room_id] == undefined) return;
        battle_fields[room_id].reset();
    });
});


http.listen(2233, function(){
    console.log('listening on *: 2233');
});
