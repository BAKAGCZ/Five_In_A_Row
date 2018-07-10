const express = require('express');
const app = express();
const path = require('path');

const http = require('http').Server(app);
const io = require('socket.io')(http);

const redisclient = require('./model').redis;
const ChatDB = require('./controller').chat,
      Room = require('./controller').room,
      Player = require('./controller').player,
      ChessBoard = require('./controller').chessboard;


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


const TIME_LIMIT = 60; // 每步时长60s 
var timer = {};

var autoMatch = setInterval(function(){
    //
}, 1000);


io.on('connection', function(socket){
    console.log('socket.id: ' + socket.id + ' connected. ' + Date());
    var user_id = socket.id;
    var room_id = ''; // 创建者的user_id
    var times = TIME_LIMIT; // 每步时长

    // 需要双方同步的信息
    var my_name = '', enemy_name = '';
    var my_chess = 0, enemy_chess = 0;

    /* ----- 倒计时 ----- */
    function setCountDown(playing, waiting) {
        if (playing == undefined) playing = my_chess;
        if (waiting == undefined) waiting = enemy_chess;
        times = TIME_LIMIT;
        timer[room_id] = setInterval(function(){
            io.sockets.in(room_id).emit('play_countdown', times--);
            if (times < 0) {
                io.sockets.in(room_id).emit('play_timeout', playing);
                clearInterval(timer[room_id]);
                if (playing == my_chess)
                    Room.end(room_id, enemy_name, my_name);
                else
                    Room.end(room_id, my_name, enemy_name);

                io.sockets.in(room_id).emit('game_over');
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
    /* ----- 倒计时 ----- */

    /* ----- 自动匹配 ----- */
    socket.on('join_automatch',function(){
        if (!Player.has(my_name)) return;

        //
    });

    socket.on('leave_automatch',function(){
        if (!Player.has(my_name)) return;
    });
    /* ----- 自动匹配 ----- */

    /* ----- 房间 ----- */
    socket.on('join_room', function(roomid){
        if (!Player.has(my_name)) return;

        room_id = roomid;
        Room.join(room_id, my_name);
        
        socket.join(room_id);
        io.sockets.in(room_id).emit('join_room',my_name);
    });

    socket.on('player_ready', function(){
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
            
            io.sockets.in(room_id).emit('game_start');
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
            
            io.sockets.in(room_id).emit('game_over');
        }

        console.log(my_name + ' leave_room.')
        console.log('leave_room('+room_id+')  have '+Room.getPlayerNumber(room_id)+' players and ' 
            + Room.getVisitorNumber(room_id) + ' visitors.');

        Room.leave(room_id, my_name);

        socket.broadcast.to(room_id).emit('leave_room', my_name);        
        socket.leave(room_id);
    }

    socket.on('leave_room', leave_room);
    socket.on('disconnect', function(){
        if (!Player.has(my_name)) return;

        if (Player.isInRoom(username))
            leave_room();
        Player.destory(my_name);
    });
    /* ----- 房间 ----- */

    // 该房间游戏开始 同步状态
    socket.on('game_start', function(){
        if (!Player.has(my_name)) return;

        if (Player.isPlaying(my_name))
        {
            enemy_name = Player.getEnemyName(my_name);
            my_chess = Player.getChess(my_name);
            enemy_chess = Player.getChess(enemy_name);
        }
    });
    
    // 该房间游戏结束 同步状态
    socket.on('game_over', function(){
        if (!Player.has(my_name)) return;

        console.log(my_name + ' game over.')
        Player.end(my_name);
    });

    // 下一步棋
    socket.on('play_one', function(data){
        // console.log(my_name + ' -> play_one');
        if (!Player.has(my_name)
            || !Player.isPlaying(my_name)) return;

        let play_state = ChessBoard.play(room_id, data.chess, data.x, data.y);

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
            Room.end(room_id, my_name, enemy_name);
            cancelCountDown();
            io.sockets.in(room_id).emit('game_over');
        }
    });

    // 一方认输
    socket.on('play_defeat', function(){
        if (!Player.has(my_name) || !Player.isPlaying(my_name)) return;

        Room.end(room_id ,enemy_name,my_name);
        cancelCountDown();
        io.sockets.in(room_id).emit('play_defeat', my_chess);
        io.sockets.in(room_id).emit('game_over');
    });

    socket.on('room_info', function(room_id){
        if (!Room.has(room_id)) return;
    	socket.emit('room_info', Room.get(room_id));
    });

    socket.on('player_info', function(){
        if (!Player.has(my_name)) return;
        socket.emit('player_info', Player.get(user_id));
    });

    socket.on('room_list', function(data){
        if (!Player.has(my_name)) return;
        socket.emit('room_list', Room.getRoomList(data.currentPage, data.countPerPage));
    });

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

    socket.on('player_rank', function(data){
        Player.getTopN(data.currentPage, data.countPerPage)
        .then(res => { socket.emit('player_rank', res); })
        .catch(err => { throw err; });
    });

    // 玩家总数
    socket.on('player_number', function(){
        if (!Player.has(my_name)) return;
        Player.getPlayerCount()
        .then(res => { socket.emit('player_number', res); })
        .catch(err => { throw err; });
    });

    socket.on('login', function(token){
        Player.login(token)
        .then(res => {
            // res => {username, sessionid}
            if (res != Player.Status.LOGIN_FAILED)
            {
                my_name = res.username;
                Player.create(my_name, socket);
            }
            socket.emit('login', res); 
        })
        .catch(err => { throw err; });
    });

    socket.on('register', function(username){
        Player.register(username)
        .then(res => { 
            if (res != Player.Status.REGISTRE_FAILED)
                Player.create(res.username, socket);
            socket.emit('register', res); 
        })
        .catch(err => { throw err; });
    });

    socket.on('logout', function(sessionid){
        Player.logout(sessionid)
        .then(res => { socket.emit('logout'); })
        .catch(err => { throw err; });
    });

    socket.on('valid', function(sessionid){
        Player.valid(sessionid)
        .then(res => {
            // res => {username, sessionid}
            if (res != Player.Status.LOGIN_FAILED)
            {
                my_name = res;
                Player.create(my_name, socket);
            }
            socket.emit('login', res); 
        })
        .catch(err => { throw err; });
    });
});


http.listen(2233, function(){
    console.log('listening on *: 2233');
});
