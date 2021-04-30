module.exports.start = function(SAT, noise) {
  var V = SAT.Vector;
  let objects = [];

  let map = {
    x: 10,
    y: 10
  }

  for (var x = 0; x < map.x; x++) {
    for (var y = 0; y < map.y; y++) {
      if (noise.GetNoise(x, y) < 0.5) {
        let l = objects.length;
        objects.push(new SAT.Box(new V(x * 40, y * 40), 40, 40).toPolygon());
        objects[l].tt = 1;
      }
      // if (map[a][b] === 2) {
      //   let l = objects.length;
      //   objects.push(new SAT.Box(new V(b * 40, a * 40), 40, 40).toPolygon());
      //   objects[l].tt = 2;
      // }
    }
  }
  return objects
};