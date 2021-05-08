module.exports.start = function(SAT, MyRBush, a) {
  var V = SAT.Vector;
  let o = [];
  
  let objects =  new MyRBush();

  let size = {
    x: 1000,
    y: 1000
  }

  for (var x = 0; x < size.x; x++) {
    for (var y = 0; y < size.y; y++) {
      let l = objects.length;
      if (x === 0 || y === 0 || x === (size.x - 1) || y === (size.y - 1)) {
        o.push([x, y, { tt: 2, c: new SAT.Box(new V(x * 40, y * 40), 40, 40).toPolygon() }]);
      } else {
        if (a.get(x, y) === 1) {
          o.push([x, y, { tt: 1, c: new SAT.Box(new V(x * 40, y * 40), 40, 40).toPolygon() }]);
        }
      }
    }
  }

  objects.load(o);

  return objects
}; 