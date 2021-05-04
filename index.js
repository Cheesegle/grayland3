var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var cryptoRandomString = require('crypto-random-string');
var btoa = require('btoa');
var SAT = require('sat');
var sizeof = require('object-sizeof');
var LZUTF8 = require('lzutf8');
var SimplexNoise = require('simplex-noise');
var d3 = require("d3-quadtree");
var Dungeon = require('random-dungeon-generator')
var Fiber = require('fibers');

var doptions = {
  width: 500,
  height: 500,
  minRoomSize: 5,
  maxRoomSize: 25
};

var dungeon = Dungeon.NewDungeon(doptions);

var V = SAT.Vector;

var players = [];
var objects = require('./worlds/world1').start(SAT, d3, dungeon);
// var objects = require('./worlds/world2').start(SAT, d3);

var prevss = [];

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

http.listen(3000, () => {
  console.log('listening on *:3000');
});

function findInCircle(quadtree, x, y, radius, filter) {
  const result = [],
    radius2 = radius * radius,
    accept = filter
      ? d => filter(d) && result.push(d)
      : d => result.push(d);

  quadtree.visit(function(node, x1, y1, x2, y2) {
    if (node.length) {
      return x1 >= x + radius || y1 >= y + radius || x2 < x - radius || y2 < y - radius;
    }

    const dx = +quadtree._x.call(null, node.data) - x,
      dy = +quadtree._y.call(null, node.data) - y;
    if (dx * dx + dy * dy < radius2) {
      do { accept(node.data); } while (node = node.next);
    }
  });

  return result;
}

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

      // for (let o = 0; o < objects.length; o++) {
      //   let response = new SAT.Response();
      //   let collided = SAT.testCirclePolygon(players[a], objects[o], response);
      //   if (collided) {
      //     let overlapV = response.overlapV.clone().scale(-1);
      //     players[a].pos.x += overlapV.x;
      //     players[a].pos.y += overlapV.y;
      //     if (objects[o].tt === 2) {
      //       players[a].pos.x = 0;
      //       players[a].pos.y = 0;
      //     }
      //   }
      // }

      let pss = [];
      let oss = [];

      players.filter((k, b) => {
        if (players[b]) {
          let ap = players[a].pos.x - k.pos.x;
          let bp = players[a].pos.y - k.pos.y;
          let c = Math.sqrt(ap * ap + bp * bp);
          if (c < 700) {
            pss[b] = { pos: k.pos, name: k.name };
          }
        }
      })


      // let oss = [];
      // if (!players[a].objloaded) {
      //   for (let o = 0; o < objects.length; o++) {
      //     let ap = players[a].pos.x - objects[o].c.pos.x;
      //     let bp = players[a].pos.y - objects[o].c.pos.y;
      //     let c = Math.sqrt(ap * ap + bp * bp);
      //     if (c < 900) {
      //       oss[o] = { pos: objects[o].pos, tt: objects[o].tt };
      //     }
      //   }
      // }

      if (!players[a].ocooldown) {
        players[a].ocooldown = 0;
      }

      players[a].ocooldown--;




      // Fiber(function() {
      let f = findInCircle(objects, players[a].pos.x / 40, players[a].pos.y / 40, 2);

      let l = findInCircle(objects, players[a].pos.x / 40, players[a].pos.y / 40, 15);


      if (l) {
        l.filter(o => {
          oss.push({ pos: o[2].c.pos, tt: o[2].tt });
        })
      }

      if (f) {
        f.forEach(e => {
          let response = new SAT.Response();
          let collided = SAT.testCirclePolygon(players[a], e[2].c, response);
          if (collided) {
            let overlapV = response.overlapV.clone().scale(-1);
            players[a].pos.x += overlapV.x;
            players[a].pos.y += overlapV.y;
            if (e[2].tt === 2) {
              players[a].pos.x = 100;
              players[a].pos.y = 100;
            }
          }
        })
      }
      // }).run();

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

      Promise.all([pp, op]).then(([rpp, rop]) => {
        if (players[a]) {
          io.to(players[a].sid).emit('t', rpp, rop);
        }
      });

    }
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