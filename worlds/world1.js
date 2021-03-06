module.exports.start = function(SAT, d3, dungeon) {
  var V = SAT.Vector;
  let objects = d3.quadtree();

  let size = {
    x: dungeon[0].length,
    y: dungeon.length
  }

  for (var x = 0; x < size.x; x++) {
    for (var y = 0; y < size.y; y++) {
      let l = objects.length;
      if (dungeon[x][y] === 1) {
        objects.add([x, y, {tt: 1, c: new SAT.Box(new V(x * 40, y * 40), 40, 40).toPolygon() }]);
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