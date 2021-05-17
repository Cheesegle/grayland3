var socket = io();

var id;
var plist = [];
var olist = [];
var plast = [];
var breakp = 0;
var latency;
var lastt;

//tiles
var temptile;
var border;
var cobble;

var tcount = 0;
var tps;
var u = (window.innerWidth / 1000);
var u2 = (window.innerWidth / 500);
var mode = 'break';
var placep = 0;


function roundx(x, m) {
  return Math.floor(x / m) * m;
}

var name = prompt("Username:", "");

if (name != null) {
  socket.emit('name', name);
}

document.addEventListener('contextmenu', event => event.preventDefault());

function preload() {
  temptile = loadImage('assets/temptile.png');
  border = loadImage('assets/border.jpg');
  cobble = loadImage('assets/cobble.png');
}

function setup() {
  createCanvas(window.innerWidth, window.innerHeight);
  rectMode(CENTER);
  ellipseMode(CENTER);
}

function draw() {
  clear();
  background(120);
  push();
  translate(windowWidth / 2, windowHeight / 2);
  let lasttd = (performance.now() - lastt) / (1000 / 20);
  if (plist[id] && plast[id]) {
    translate(-lerp(plast[id].pos.x, plist[id].pos.x, lasttd) * u, -lerp(plast[id].pos.y, plist[id].pos.y, lasttd) * u)
  }

  for (let i = 0; i < plist.length; i++) {
    if (plist[i] && plast[i]) {
      push();
      translate((lerp(plast[i].pos.x, plist[i].pos.x, lasttd) - 20) * u, (lerp(plast[i].pos.y, plist[i].pos.y, lasttd) - 20) * u);
      circle(0, 0, 20 * u2);
      textSize(16 * u);
      textAlign(CENTER);
      text(plist[i].name, 0, -20 * u);
      pop();
    }
  }
  // push();
  // translate((clientp.pos.x - 20) * u, (clientp.pos.y - 20) * u);
  // fill(color('purple'));
  // circle(0, 0, 20 * u2);
  // pop();

  push();
  if (mode === 'place') {
    if (mouseIsPressed) {
      if (mouseButton === LEFT) {
        if (placep === 0) {
          // socket.emit('place', olist[o].pos.x / 40, olist[o].pos.y / 40);
        }
        if (placep === 1) {
          // socket.emit('place', olist[o].pos.x / 40, olist[o].pos.y / 40);
        }
        fill('rgba(0, 255, 0, ' + ((breakp / 2) + 0.25) + ')');
      }
    } else {
      if (breakp !== 0) {
        socket.emit('placec');
      }
      fill('rgba(0, 255, 0, 0.25)');
    }
    noStroke();
    resetMatrix();
    rect(mouseX, mouseY, 20 * u2, 20 * u2);
  }
  pop();

  for (let o = 0; o < olist.length; o++) {
    if (olist[o]) {
      push();
      translate((olist[o].pos.x * 40) * u, (olist[o].pos.y * 40) * u);
      if (olist[o].tt === 1) {
        image(temptile, -10 * u2, -10 * u2, 20 * u2, 20 * u2);
      }
      if (olist[o].tt === 2) {
        image(border, -10 * u2, -10 * u2, 20 * u2, 20 * u2);
      }
      if (olist[o].tt === 3) {
        image(cobble, -10 * u2, -10 * u2, 20 * u2, 20 * u2);
      }

      let mx = (((olist[o].pos.x * 40) * u) - ((plist[id].pos.x * u)) + (windowWidth / 2));

      let my = (((olist[o].pos.y * 40) * u) - ((plist[id].pos.y * u)) + (windowHeight / 2));

      if (mode === 'break') {
        if (mouseX > mx - (10 * u2) && mouseX < mx + (10 * u2) && mouseY > my - (10 * u2) && mouseY < my + (10 * u2)) {
          let ap = plist[id].pos.x - (olist[o].pos.x * 40);
          let bp = plist[id].pos.y - (olist[o].pos.y * 40);
          let c = Math.sqrt(ap * ap + bp * bp);
          if (c < 150) {
            if (olist[o].tt !== 0 && olist[o].tt !== 2) {
              if (mouseIsPressed) {
                if (mouseButton === LEFT) {
                  if (breakp === 0) {
                    socket.emit('break', olist[o].pos.x, olist[o].pos.y);
                  }
                  if (breakp === 1) {
                    socket.emit('break', olist[o].pos.x, olist[o].pos.y);
                  }
                  fill('rgba(255, 0, 0, ' + ((breakp / 2) + 0.25) + ')');
                } else {
                  if (breakp !== 0) {
                    socket.emit('breakc');
                  }
                  fill('rgba(255, 0, 0, 0.25)');
                }
              } else {
                if (breakp !== 0) {
                  socket.emit('breakc');
                }
                fill('rgba(255, 0, 0, 0.25)');
              }
              noStroke();
              rect(0, 0, 20 * u2, 20 * u2);
            }
          }
        }
      }
      pop();
    }
  }
  pop();
  textSize(32);
  text('x: ' + Math.round(plist[id].pos.x / 40), 10, 30);
  text('y: ' + Math.round(plist[id].pos.y / 40), 10, 60);
  text('Latency: ' + latency + 'ms', 10, 90);
  text('TPS: ' + tps, 10, 120);
  text('Hand: ' + mode, 10, 150);
}

var pspeed = 2.5;


function keyPressed() {
  if (keyCode === 87) {
    socket.emit('w', true)
  }

  if (keyCode === 65) {
    socket.emit('a', true)

  }

  if (keyCode === 83) {
    socket.emit('s', true)
  }

  if (keyCode === 68) {
    socket.emit('d', true)

  }

  if (keyCode === 32) {
    socket.emit('space', true)
  }

  if (keyCode === 49) {
    mode = 'break';
  } else if (keyCode === 50) {
    mode = 'place';
  }
}

function keyReleased() {
  if (keyCode === 87) {
    socket.emit('w', false)
  }

  if (keyCode === 65) {
    socket.emit('a', false)
  }

  if (keyCode === 83) {
    socket.emit('s', false)
  }

  if (keyCode === 68) {
    socket.emit('d', false)
  }

  if (keyCode === 32) {
    socket.emit('space', false)
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  u = (window.innerWidth / 1000);
  u2 = (window.innerWidth / 500);
}

socket.on('t', (pnow, onow) => {
  tcount++;
  lastt = performance.now();
  plast = plist;
  plist = JSON.parse(LZUTF8.decompress(new Uint8Array(pnow)));
  let ou = JSON.parse(LZUTF8.decompress(new Uint8Array(onow)));
  if (ou.length !== 0) {
    olist = ou;
  }
});

socket.on('id', (sid) => {
  id = sid;
});

socket.on('b', (b) => {
  breakp = b;
});

socket.on('p', (p) => {
  placep = p;
});

var startTime;

setInterval(function() {
  startTime = Date.now();
  socket.emit('ping');
  tps = tcount;
  tcount = 0;
}, 1000);

socket.on('pong', function() {
  latency = Date.now() - startTime;
});