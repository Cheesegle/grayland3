var socket = io();

var id;

var plist = [];
var olist = [];

var plast = [];

var lastt;

var temptile;

var V = SAT.Vector;
var clientp = new SAT.Circle(new V(100, 100), 20);

var name = prompt("Username:", "");

if (name != null) {
  socket.emit('name', name)
}

function preload() {
  temptile = loadImage('assets/temptile.png');
}

function setup() {
  createCanvas(window.innerWidth, window.innerHeight);
  rectMode(CENTER);
  ellipseMode(CENTER);
}

function draw() {
  clear();
  background(120);
  translate(windowWidth / 2, windowHeight / 2);
  let lasttd = (performance.now() - lastt) / (1000 / 20);
  if (plist[id] && plast[id]) {
    drawingContext.translate(-lerp(plast[id].pos.x, plist[id].pos.x, lasttd) * (window.innerWidth / 1000), -lerp(plast[id].pos.y, plist[id].pos.y, lasttd) * (window.innerWidth / 1000))
  }
  for (let i = 0; i < plist.length; i++) {
    if (plist[i] && plast[i]) {
      push();
      translate((lerp(plast[i].pos.x, plist[i].pos.x, lasttd) - 20) * (window.innerWidth / 1000), (lerp(plast[i].pos.y, plist[i].pos.y, lasttd) - 20) * (window.innerWidth / 1000));
      circle(0, 0, 20 * (window.innerWidth / 500));
      textSize(16 * (window.innerWidth / 1000));
      textAlign(CENTER);
      text(plist[i].name, 0, -20 * (window.innerWidth / 1000));
      pop();
    }
  }
  // push();
  // translate((clientp.pos.x - 20) * (window.innerWidth / 1000), (clientp.pos.y - 20) * (window.innerWidth / 1000));
  // fill(color('purple'));
  // circle(0, 0, 20 * (window.innerWidth / 500));
  // pop();
  for (let o = 0; o < olist.length; o++) {
    if (olist[o]) {
      push();
      translate(olist[o].pos.x * (window.innerWidth / 1000), olist[o].pos.y * (window.innerWidth / 1000));
      if (olist[o].tt === 1) {
        image(temptile, -10 * (window.innerWidth / 500), -10 * (window.innerWidth / 500), 20 * (window.innerWidth / 500), 20 * (window.innerWidth / 500));
      }
      if (olist[o].tt === 2) {
        fill(color('red'));
        rect(0, 0, 20 * (window.innerWidth / 500), 20 * (window.innerWidth / 500));
      }
      pop();
    }
  }
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
}

socket.on('t', (pnow, onow) => {
  lastt = performance.now();
  plast = plist;
  plist = JSON.parse(LZUTF8.decompress(new Uint8Array(pnow)));
  if (onow) {
    olist = JSON.parse(LZUTF8.decompress(new Uint8Array(onow)));
  }
});

socket.on('id', (sid) => {
  id = sid;
});