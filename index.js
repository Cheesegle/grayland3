var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var cryptoRandomString = require('crypto-random-string');
var btoa = require('btoa');
var SAT = require('sat');
var sizeof = require('object-sizeof');
var LZUTF8 = require('lzutf8');
var RBush = require('rbush');
var knn = require('rbush-knn');
var Dungeon = require('random-dungeon-generator');
var zeros = require("zeros");
var cave = require('cave-automata-2d')
  , ndarray = require('ndarray')
  , width = 6000
  , height = 6000;

class MyRBush extends RBush {
  toBBox([x, y]) { return { minX: x, minY: y, maxX: x, maxY: y }; }
  compareMinX(a, b) { return a.x - b.x; }
  compareMinY(a, b) { return a.y - b.y; }
}

function roundx(x, m) {
  return Math.floor(x / m) * m;
}

var grid = zeros([width, height])

var iterate = cave(grid, {
  density: 0.5
  , threshold: 5
  , hood: 1
  , fill: true
})

iterate(5);

var doptions = {
  width: 500,
  height: 500,
  minRoomSize: 5,
  maxRoomSize: 25
};

var dungeon = Dungeon.NewDungeon(doptions);

var V = SAT.Vector;

console.log('Starting...')

var players = [];
var objects = require('./worlds/world2').start(SAT, MyRBush, grid);
// var objects = require('./worlds/world2').start(SAT, d3);

const used = process.memoryUsage().heapUsed / 1024 / 1024;
console.log(`Memory usage: ${Math.round(used * 100) / 100} MB`);

var prevss = [];

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

http.listen(3000, () => {
  console.log('listening on *:3000');
});

// function findInCircle(quadtree, x, y, radius, filter) {
//   const result = [],
//     radius2 = radius * radius,
//     accept = filter
//       ? d => filter(d) && result.push(d)
//       : d => result.push(d);

//   quadtree.visit(function(node, x1, y1, x2, y2) {
//     if (node.length) {
//       return x1 >= x + radius || y1 >= y + radius || x2 < x - radius || y2 < y - radius;
//     }

//     const dx = +quadtree._x.call(null, node.data) - x,
//       dy = +quadtree._y.call(null, node.data) - y;
//     if (dx * dx + dy * dy < radius2) {
//       do { accept(node.data); } while (node = node.next);
//     }
//   });

//   return result;
// }

setInterval(function() {
  for (let a = 0; a < players.length; a++) {
    if (players[a]) {
      // prevss[a] = {};
      // prevss[a].x = players[a].pos.x;
      // prevss[a].y = players[a].pos.y;

      if (!players[a].pspeed) {
        players[a].pspeed = 3;
      }

      if (!players[a].dash) {
        players[a].dash = {
          cooldown: 0,
          duration: 0
        };
      }

      if (players[a].keyq.space === true) {
        if (players[a].dash.cooldown <= 0) {
          players[a].dash.cooldown = 60;
          players[a].dash.duration = 10;
        }
      };

      if (players[a].dash.duration >= 0) {
        players[a].dash.duration--;
        players[a].pspeed = 9;
      }

      if (players[a].dash.duration <= 0) {
        players[a].pspeed = 3;
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

      var l = knn(objects, players[a].pos.x / 40, players[a].pos.y / 40, 616);

      if (l) {
        l.filter(e => {
          let ap = (players[a].pos.x / 40) - e[0];
          let bp = (players[a].pos.y / 40) - e[1];
          let c = Math.sqrt(ap * ap + bp * bp);
          if (c < 2 && e[2] !== 0) {
            let oc = new SAT.Box(new V(e[0] * 40, e[1] * 40), 40, 40).toPolygon();
            let response = new SAT.Response();
            let collided = SAT.testCirclePolygon(players[a], oc, response);
            if (collided) {
              let overlapV = response.overlapV.clone().scale(-1);
              players[a].pos.x += overlapV.x;
              players[a].pos.y += overlapV.y;
            }
          }
          if (c < 14) {
            oss.push({ pos: { x: e[0], y: e[1] }, tt: e[2] });
          }
        })
      }

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
}, 1000 / 32);

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('ping', function() {
    socket.emit('pong');
  });

  //spawn 
  var id = players.length;
  players.push(new SAT.Circle(new V((2900 * 40) + (Math.random() * (200 * 40)), (2900 * 40) + (Math.random() * (200 * 40))), 20));
  // players.push(new SAT.Circle(new V(480 * 40, 480 * 40), 20));

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

  let breakd;

  setInterval(function() {
    if (breakd < 60) {
      breakd++;
      socket.emit('b', breakd / 60);
    }
  }, 1000 / 60);

  socket.on('break', (x, y) => {
    if (breakd === 60) {
      let l = knn(objects, x, y, 1);
      if (l[2] !== 0 && l[2] !== 2) {
        let ap = players[id].pos.x - (l[0][0] * 40);
        let bp = players[id].pos.y - (l[0][1] * 40);
        let c = Math.sqrt(ap * ap + bp * bp);
        if (c < 150) {
          objects.remove(l[0]);
        }
      }
    }
    breakd = 0;
  });

  socket.on('breakc', () => {
    socket.emit('b', 0);
    breakd = 61;
  });


  let placed;

  setInterval(function() {
    if (placed < 60) {
      placed++;
      socket.emit('p', placed / 60);
    }
  }, 1000 / 60);

  socket.on('place', (x, y) => {
    let xx = Math.floor(x);
    let yy = Math.floor(y);
    if (placed === 60) {
      let ap = players[id].pos.x - (xx * 40);
      let bp = players[id].pos.y - (yy * 40);
      let c = Math.sqrt(ap * ap + bp * bp);
      console.log(c)
      if (c < 150) {
        let l = objects.search({
          minX: xx,
          minY: yy,
          maxX: xx,
          maxY: yy
        });

        if (!l[0]) {
          console.log('owo')
          objects.insert([xx, yy, 3]);
        }
      }
    }
    placed = 0;
  });

  socket.on('placec', () => {
    socket.emit('p', 0);
    placed = 61;
  });

});