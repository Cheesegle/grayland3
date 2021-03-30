var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var cryptoRandomString = require('crypto-random-string');
var fflate = require('fflate');
var SAT = require('sat');
var fastnoise = require('fastnoisejs');
var V = SAT.Vector;

const noise = fastnoise.Create(Math.floor(Math.random() * 10))
noise.SetNoiseType(fastnoise.Simplex)

const lerp = (x, y, a) => x * (1 - a) + y * a;

var players = [];
var objects = require('./worlds/world1').start(SAT);

var prevss = [];

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

http.listen(3000, () => {
  console.log('listening on *:3000');
});

setInterval(function() {
  for (let a = 0; a < players.length; a++) {
    // prevss[a] = {};
    // prevss[a].x = players[a].pos.x;
    // prevss[a].y = players[a].pos.y;

    if (!players[a].pspeed) {
      players[a].pspeed = 2.5;
    }

    if (!players[a].dash) {
      players[a].dash = {
        cooldown: 0,
        duration: 0
      };
    }

    if (players[a].keyq.space === true) {
      if (players[a].dash.cooldown <= 0) {
        players[a].dash.cooldown = 96;
        players[a].dash.duration = 16;
      }
    };

    if (players[a].dash.duration >= 0) {
      players[a].dash.duration--;
      players[a].pspeed += 1;
      if (players[a].dash.duration === 0) {
        players[a].pspeed = 2.5;
      }
    }

    players[a].dash.cooldown--;

    if (players[a].keyq.w === true) {
      players[a].pos.y -= players[a].pspeed;
    };

    if (players[a].keyq.a === true) {
      players[a].pos.x -= players[a].pspeed;
    };

    if (players[a].keyq.s === true) {
      players[a].pos.y += players[a].pspeed;
    };

    if (players[a].keyq.d === true) {
      players[a].pos.x += players[a].pspeed;
    };

    for (let o = 0; o < objects.length; o++) {
      let response = new SAT.Response();
      let collided = SAT.testCirclePolygon(players[a], objects[o], response);
      if (collided) {
        let overlapV = response.overlapV.clone().scale(-1);
        players[a].pos.x += overlapV.x;
        players[a].pos.y += overlapV.y;
      }
    }

    let pss = [];
    for (let b = 0; b < players.length; b++) {
      let ap = players[a].pos.x - players[b].pos.x;
      let bp = players[a].pos.y - players[b].pos.y;
      let c = Math.sqrt(ap * ap + bp * bp);
      if (c < 700) {
        pss[b] = { pos: players[b].pos };
      }
    }

    let oss = [];
    for (let o = 0; o < objects.length; o++) {
      let ap = players[a].pos.x - objects[o].pos.x;
      let bp = players[a].pos.y - objects[o].pos.y;
      let c = Math.sqrt(ap * ap + bp * bp);
      if (c < 700) {
        oss[o] = { pos: objects[o].pos };
      }
    }

    io.to(players[a].sid).emit('t', pss, oss);
  }
}, 1000 / 64);

io.on('connection', (socket) => {
  console.log('a user connected');

  //spawn
  var id = players.length;
  players.push(new SAT.Circle(new V(100, 100), 20));
  socket.emit('id', id);

  players[id].sid = socket.id;

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });

  //keys
  players[id].keyq = {};
  socket.on('w', (state) => {
    players[id].keyq.w = state;
  });

  socket.on('a', (state) => {
    players[id].keyq.a = state;
  });

  socket.on('s', (state) => {
    players[id].keyq.s = state;
  });

  socket.on('d', (state) => {
    players[id].keyq.d = state;
  });

  socket.on('space', (state) => {
    players[id].keyq.space = state;
  });
});