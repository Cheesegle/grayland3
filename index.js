var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var cryptoRandomString = require('crypto-random-string');
var btoa = require('btoa');
var SAT = require('sat');
var fastnoise = require('fastnoisejs');
var sizeof = require('object-sizeof')
var LZUTF8 = require('lzutf8');

var V = SAT.Vector;

const noise = fastnoise.Create(Math.floor(Math.random() * 10))
noise.SetNoiseType(fastnoise.Cellular)

const lerp = (x, y, a) => x * (1 - a) + y * a;

var players = [];
var objects = require('./worlds/world1').start(SAT, noise);

console.log(objects.length)

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
    if (players[a]) {
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
          if (objects[o].tt === 2) {
            players[a].pos.x = 100;
            players[a].pos.y = 100;
          }
        }
      }

      let pss = [];
      for (let b = 0; b < players.length; b++) {
        if (players[b]) {
          let ap = players[a].pos.x - players[b].pos.x;
          let bp = players[a].pos.y - players[b].pos.y;
          let c = Math.sqrt(ap * ap + bp * bp);
          if (c < 700) {
            pss[b] = { pos: players[b].pos, name: players[b].name };
          }
        }
      }

      let oss = [];
      if (!players[a].objloaded) {
        for (let o = 0; o < objects.length; o++) {
          let ap = players[a].pos.x - objects[o].pos.x;
          let bp = players[a].pos.y - objects[o].pos.y;
          let c = Math.sqrt(ap * ap + bp * bp);
          if (c < 700) {
            oss[o] = { pos: objects[o].pos, tt: objects[o].tt };
          }
        }
      }

      if (!players[a].ocooldown) {
        players[a].ocooldown = 0;
      }

      players[a].ocooldown--;

      let pp = new Promise((resolve, reject) => {
        LZUTF8.compressAsync(JSON.stringify(pss), { outputEncoding: "ByteArray" }, r => {
          resolve(r);
          return;
        });
      });

      let op = new Promise((resolve, reject) => {
        LZUTF8.compressAsync(JSON.stringify(oss), { outputEncoding: "ByteArray" }, r => {
          resolve(r);
          return;
        });
      });

      if (players[a].ocooldown <= 0) {
        Promise.all([pp, op]).then(([rpp, rop]) => {
          io.to(players[a].sid).emit('t', rpp, rop);
          players[a].ocooldown = 32;
        });
      } else {
        pp.then(rpp => {
          io.to(players[a].sid).emit('t', rpp);
        });
      }

    }
  }
}, 1000 / 64);

io.on('connection', (socket) => {
  console.log('a user connected');

  //spawn
  var id = players.length;
  players.push(new SAT.Circle(new V(5 * 40, 5 * 40), 20));
  socket.emit('id', id);

  players[id].sid = socket.id;

  socket.on('disconnect', () => {
    console.log('user disconnected');
    players[id] = null;
  });

  socket.on('name', (name) => {
    if (!players[id].name) {
      players[id].name = name;
    }
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