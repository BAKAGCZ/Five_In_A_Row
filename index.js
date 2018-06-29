var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var BattleField = require('./controller/battle_field');

var rooms = [];
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
	console.log('socket.on connect');
	var room_id;
	var user_name;

	socket.on('join',function(_user_name){
		user_name = _user_name;
		var flag = 0;
		var is_ok = 0;

		//有房间人数未满
		for (var i=0; i<rooms.length; i++)
		{
			if (rooms[i].length < room_capacity)
			{
				rooms[i].push(user_name);
				if (rooms[i].length >= room_capacity)
					is_ok = 1;
				room_id = i;
				flag = 1;
				break;
			}
		}

		//房间全满 或 当前没有房间
		if (!flag || !rooms.length)
		{
			var users = [];
			users.push(user_name);
			room_id = rooms.length;
			rooms.push(users);
		}

		//进入房间
		socket.join(room_id);

		//人满
		if (is_ok)
		{
			var data1 = {
				room_id: room_id,
				chess: 1 // 白棋
			}
			var data2 = {
				room_id: room_id,
				chess: 2 // 黑棋
			};
			socket.to(room_id).emit('game_start', data1);
			socket.emit('game_start', data2);
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
			socket.to(room_id).emit('game_waiting', data);
			socket.emit('game_waiting', data);
		}
	});

	socket.on('leave', function(){
		socket.emit('disconnect');
	});

	socket.on('disconnect', function(){
		// console.log(rooms[room_id]);
		var index = rooms[room_id].indexOf(user_name);
		if (index != -1)
			rooms[room_id].splice(index, 1);

		socket.leave(room_id);
	});

	socket.on('play_one', function(data){
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

	socket.on('reset', function(){
		battle_fields[room_id].reset();
	});
});


http.listen(3000, function(){
	console.log('listening on *: 3000');
});
