var socket = io();

var id;

var plist = [];
var olist = [];

var plast = [];

var lastt;

function setup() {
  createCanvas(window.innerWidth, window.innerHeight);
  rectMode(CENTER);
  ellipseMode(CENTER);
}

function draw() {
  clear();
  background(120);
  translate(windowWidth / 2, windowHeight / 2);
  let lasttd = (performance.now() - lastt) / (1000 / 64);
  if (plist[id] && plast[id]) {
    drawingContext.translate(-lerp(plast[id].pos.x, plist[id].pos.x, lasttd) * (window.innerWidth / 1000), -lerp(plast[id].pos.y, plist[id].pos.y, lasttd) * (window.innerWidth / 1000))
  }
  for (let i = 0; i < plist.length; i++) {
    if (plist[i] && plast[i]) {
      push();
      translate((lerp(plast[i].pos.x, plist[i].pos.x, lasttd) - 20) * (window.innerWidth / 1000), (lerp(plast[i].pos.y, plist[i].pos.y, lasttd) - 20) * (window.innerWidth / 1000));
      // let angleb = atan2((mouseY - 20) - windowHeight / 2, (mouseX - 20) - windowWidth / 2);
      // if (i === id) {
      //   rotate(angleb)
      // }
      // line(0, 0, 20 * (window.innerWidth / 500), 0 * (window.innerWidth / 500));
      circle(0, 0, 20 * (window.innerWidth / 500));
      pop();
    }
  }
  for (let o = 0; o < olist.length; o++) {
    if (olist[o]) {
      push();
      fill(color('black'));
      translate(olist[o].pos.x * (window.innerWidth / 1000), olist[o].pos.y * (window.innerWidth / 1000))
      rect(0, 0, 20 * (window.innerWidth / 500), 20 * (window.innerWidth / 500));
      pop();
    }
  }
}

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
  plist = pnow;
  olist = onow;
});

socket.on('id', (sid) => {
  id = sid;
});