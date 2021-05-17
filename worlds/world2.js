module.exports.start = function(SAT, MyRBush, a) {
  var V = SAT.Vector;
  let o = [];

  let objects = new MyRBush(16);

  let size = {
    x: 6000,
    y: 6000
  }

  for (var x = 0; x < size.x; x++) {
    for (var y = 0; y < size.y; y++) {
      let l = objects.length;
      if (x === 0 || y === 0 || x === (size.x - 1) || y === (size.y - 1)) {
        o.push([x, y, 2]);
      } else if (a.get(x, y) === 1) {
        o.push([x, y, 1]);
      }
    }
  }

  objects.load(o);

  o = null;

  return objects
}; 