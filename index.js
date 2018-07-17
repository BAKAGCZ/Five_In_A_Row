const express = require('express');
const app = express();
const http = require('http').Server(app);
const path = require('path');
const io = require('socket.io')(http);

var mainFunc = require('./routers'); 

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res){
    res.sendFile(__dirname + '/view/index.html');
});

app.get('/generals', function(req, res){
	if (req.headers['x-pjax'] != 'true') res.sendFile(__dirname + '/view/index.html')
    else res.sendFile(__dirname + '/view/generals.html');
});

app.get('/room_list', function(req, res){
    if (req.headers['x-pjax'] != 'true') res.sendFile(__dirname + '/view/index.html')
    else res.sendFile(__dirname + '/view/room_list.html');
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

http.listen(2233, function(){
    console.log('listening on *: 2233');
});


mainFunc(io);