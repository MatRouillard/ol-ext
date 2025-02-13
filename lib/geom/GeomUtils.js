/*	Copyright (c) 2016 Jean-Marc VIGLINO, 
  released under the CeCILL-B license (French BSD license)
  (http://www.cecill.info/licences/Licence_CeCILL-B_V1-en.txt).
  Usefull function to handle geometric operations
*/
/** Distance beetween 2 points
 *	Usefull geometric functions
 * @param {ol.Coordinate} p1 first point
 * @param {ol.Coordinate} p2 second point
 * @return {number} distance
 */
ol.coordinate.dist2d = function(p1, p2) {
  var dx = p1[0]-p2[0];
  var dy = p1[1]-p2[1];
  return Math.sqrt(dx*dx+dy*dy);
}
/** 2 points are equal
 *	Usefull geometric functions
 * @param {ol.Coordinate} p1 first point
 * @param {ol.Coordinate} p2 second point
 * @return {boolean}
 */
ol.coordinate.equal = function(p1, p2) {
  return (p1[0]==p2[0] && p1[1]==p2[1]);
}
/** Get center coordinate of a feature
 * @param {ol.Feature} f
 * @return {ol.coordinate} the center
 */
ol.coordinate.getFeatureCenter = function(f) {
  return ol.coordinate.getGeomCenter (f.getGeometry());
};
/** Get center coordinate of a geometry
* @param {ol.geom.Geometry} geom
* @return {ol.Coordinate} the center
*/
ol.coordinate.getGeomCenter = function(geom) {
  switch (geom.getType()) {
    case 'Point': 
      return geom.getCoordinates();
    case "MultiPolygon":
      geom = geom.getPolygon(0);
      // fallthrough
    case "Polygon":
      return geom.getInteriorPoint().getCoordinates();
    default:
      return geom.getClosestPoint(ol.extent.getCenter(geom.getExtent()));
  }
};
/** Offset a polyline
 * @param {Array<ol.Coordinate>} coords
 * @param {number} offset
 * @return {Array<ol.Coordinate>} resulting coord
 * @see http://stackoverflow.com/a/11970006/796832
 * @see https://drive.google.com/viewerng/viewer?a=v&pid=sites&srcid=ZGVmYXVsdGRvbWFpbnxqa2dhZGdldHN0b3JlfGd4OjQ4MzI5M2Y0MjNmNzI2MjY
 */
ol.coordinate.offsetCoords = function (coords, offset) {
  var path = [];
  var N = coords.length-1;
  var max = N;
  var mi, mi1, li, li1, ri, ri1, si, si1, Xi1, Yi1;
  var p0, p1, p2;
  var isClosed = ol.coordinate.equal(coords[0],coords[N]);
  if (!isClosed) {
    p0 = coords[0];
    p1 = coords[1];
    p2 = [
      p0[0] + (p1[1] - p0[1]) / ol.coordinate.dist2d(p0,p1) *offset,
      p0[1] - (p1[0] - p0[0]) / ol.coordinate.dist2d(p0,p1) *offset
    ];
    path.push(p2);
    coords.push(coords[N])
    N++;
    max--;
  }
  for (var i = 0; i < max; i++) {
    p0 = coords[i];
    p1 = coords[(i+1) % N];
    p2 = coords[(i+2) % N];
    mi = (p1[1] - p0[1])/(p1[0] - p0[0]);
    mi1 = (p2[1] - p1[1])/(p2[0] - p1[0]);
    // Prevent alignements
    if (Math.abs(mi-mi1) > 1e-10) {
      li = Math.sqrt((p1[0] - p0[0])*(p1[0] - p0[0])+(p1[1] - p0[1])*(p1[1] - p0[1]));
      li1 = Math.sqrt((p2[0] - p1[0])*(p2[0] - p1[0])+(p2[1] - p1[1])*(p2[1] - p1[1]));
      ri = p0[0] + offset*(p1[1] - p0[1])/li;
      ri1 = p1[0] + offset*(p2[1] - p1[1])/li1;
      si = p0[1] - offset*(p1[0] - p0[0])/li;
      si1 = p1[1] - offset*(p2[0] - p1[0])/li1;
      Xi1 = (mi1*ri1-mi*ri+si-si1) / (mi1-mi);
      Yi1 = (mi*mi1*(ri1-ri)+mi1*si-mi*si1) / (mi1-mi);
      // Correction for vertical lines
      if(p1[0] - p0[0] == 0) {
        Xi1 = p1[0] + offset*(p1[1] - p0[1])/Math.abs(p1[1] - p0[1]);
        Yi1 = mi1*Xi1 - mi1*ri1 + si1;
      }
      if (p2[0] - p1[0] == 0 ) {
        Xi1 = p2[0] + offset*(p2[1] - p1[1])/Math.abs(p2[1] - p1[1]);
        Yi1 = mi*Xi1 - mi*ri + si;
      }
      path.push([Xi1, Yi1]);
    }
  }
  if (isClosed) {
    path.push(path[0]);
  } else {
    coords.pop();
    p0 = coords[coords.length-1];
    p1 = coords[coords.length-2];
    p2 = [
      p0[0] - (p1[1] - p0[1]) / ol.coordinate.dist2d(p0,p1) *offset,
      p0[1] + (p1[0] - p0[0]) / ol.coordinate.dist2d(p0,p1) *offset
    ];
    path.push(p2);
  }
  return path;
}
/** Find the segment a point belongs to
 * @param {ol.Coordinate} pt
 * @param {Array<ol.Coordinate>} coords
 * @return {} the index (-1 if not found) and the segment
 */
ol.coordinate.findSegment = function (pt, coords) {
  for (var i=0; i<coords.length-1; i++) {
    var p0 = coords[i];
    var p1 = coords[i+1];
    if (ol.coordinate.equal(pt, p0) || ol.coordinate.equal(pt, p1)) {
      return { index:1, segment: [p0,p1] };
    } else {
      var d0 = ol.coordinate.dist2d(p0,p1);
      var v0 = [ (p1[0] - p0[0]) / d0, (p1[1] - p0[1]) / d0 ];
      var d1 = ol.coordinate.dist2d(p0,pt);
      var v1 = [ (pt[0] - p0[0]) / d1, (pt[1] - p0[1]) / d1 ];
      if (Math.abs(v0[0]*v1[1] - v0[1]*v1[0]) < 1e-10) {
        return { index:1, segment: [p0,p1] };
      }
    }
  }
  return { index: -1 };
};
/**
 * Split a Polygon geom with horizontal lines
 * @param {Array<ol.Coordinate>} geom
 * @param {number} y the y to split
 * @param {number} n contour index
 * @return {Array<Array<ol.Coordinate>>}
 */
ol.coordinate.splitH = function (geom, y, n) {
  var x, abs;
  var list = [];
  for (var i=0; i<geom.length-1; i++) {
    // Hole separator?
    if (!geom[i].length || !geom[i+1].length) continue;
    // Intersect
    if (geom[i][1]<=y && geom[i+1][1]>y || geom[i][1]>=y && geom[i+1][1]<y) {
      abs = (y-geom[i][1]) / (geom[i+1][1]-geom[i][1]);
      x = abs * (geom[i+1][0]-geom[i][0]) + geom[i][0];
      list.push ({ contour: n, index: i, pt: [x,y], abs: abs });
    }
  }
  // Sort x
  list.sort(function(a,b) { return a.pt[0] - b.pt[0] });
  // Horizontal segment
  var result = [];
  for (var j=0; j<list.length-1; j += 2) {
    result.push([list[j], list[j+1]])
  }
  return result;
};
/** Create a geometry given a type and coordinates */
ol.geom.createFromType = function (type, coordinates) {
  switch (type) {
    case 'LineString': return new ol.geom.LineString(coordinates);
    case 'LinearRing': return new ol.geom.LinearRing(coordinates);
    case 'MultiLineString': return new ol.geom.MultiLineString(coordinates);
    case 'MultiPoint': return new ol.geom.MultiPoint(coordinates);
    case 'MultiPolygon': return new ol.geom.MultiPolygon(coordinates);
    case 'Point': return new ol.geom.Point(coordinates);
    case 'Polygon': return new ol.geom.Polygon(coordinates);
    default:
      console.error('[createFromType] Unsupported type: '+type);
      return null;
  }
};
/** Intersect 2 lines
 * @param {Arrar<ol.coordinate>} d1
 * @param {Arrar<ol.coordinate>} d2
 */
ol.coordinate.getIntersectionPoint = function (d1, d2) {
  var d1x = d1[1][0] - d1[0][0];
  var d1y = d1[1][1] - d1[0][1];
  var d2x = d2[1][0] - d2[0][0];
  var d2y = d2[1][1] - d2[0][1];
  var det = d1x * d2y - d1y * d2x;
  if (det != 0) {
    var k = (d1x * d1[0][1] - d1x * d2[0][1] - d1y * d1[0][0] + d1y * d2[0][0]) / det;
    return [d2[0][0] + k*d2x, d2[0][1] + k*d2y];
  } else {
    return false;
  }
};
ol.extent.intersection;
(function() {
// Split at x
function splitX(pts, x) {
  var pt;
  for (var i=pts.length-1; i>0; i--) {
    if ((pts[i][0]>x && pts[i-1][0]<x) || (pts[i][0]<x && pts[i-1][0]>x)) {
      pt = [ x, (x - pts[i][0]) / (pts[i-1][0]-pts[i][0]) * (pts[i-1][1]-pts[i][1]) + pts[i][1]];
      pts.splice(i, 0, pt);
    }
  }
}
// Split at y
function splitY(pts, y) {
  var pt;
  for (var i=pts.length-1; i>0; i--) {
    if ((pts[i][1]>y && pts[i-1][1]<y) || (pts[i][1]<y && pts[i-1][1]>y)) {
      pt = [ (y - pts[i][1]) / (pts[i-1][1]-pts[i][1]) * (pts[i-1][0]-pts[i][0]) + pts[i][0], y];
      pts.splice(i, 0, pt);
    }
  }
}
/** Fast polygon intersection with an extent (used for area calculation)
 * @param {ol.extent.Extent} extent
 * @param {ol.geom.Polygon|ol.geom.MultiPolygon} polygon
 * @returns {ol.geom.Polygon|ol.geom.MultiPolygon|null} return null if not a polygon geometry
 */
ol.extent.intersection = function(extent, polygon) {
  var poly = (polygon.getType() === 'Polygon');
  if (!poly && polygon.getType() !== 'MultiPolygon') return null;
  var geom = polygon.getCoordinates();
  if (poly) geom = [geom];
  geom.forEach(function(g) {
    g.forEach(function(c) {
      splitX(c, extent[0]);
      splitX(c, extent[2]);
      splitY(c, extent[1]);
      splitY(c, extent[3]);
    });
  })
  // Snap geom to the extent 
  geom.forEach(function(g) {
    g.forEach(function(c) {
      c.forEach(function(p) {
        if (p[0]<extent[0]) p[0] = extent[0];
        else if (p[0]>extent[2]) p[0] = extent[2];
        if (p[1]<extent[1]) p[1] = extent[1];
        else if (p[1]>extent[3]) p[1] = extent[3];
      })
    })
  })
  if (poly) {
    return new ol.geom.Polygon(geom[0]);
  } else {
    return new ol.geom.MultiPolygon(geom);
  }
};
})();
/** Add points along a segment
 * @param {ol.Coordinate} p1 
 * @param {ol.Coordinate} p2 
 * @param {number} d 
 * @param {boolean} start include starting point, default true
 * @returns {Array<ol.Coordinate>}
 */
ol.coordinate.sampleAt = function(p1, p2, d, start) {
  var pts = [];
  if (start!==false) pts.push(p1);
  var dl = ol.coordinate.dist2d(p1,p2);
  if (dl) {
    var nb = Math.round(dl/d);
    if (nb>1) {
      var dx = (p2[0]-p1[0]) / nb;
      var dy = (p2[1]-p1[1]) / nb;
      for (var i=1; i<nb; i++) {
        pts.push([p1[0] + dx*i, p1[1] + dy*i])
      }
    }
  }
  pts.push(p2);
  return pts;
};
/** Sample a LineString at a distance
 * @param {number} d
 * @returns {ol.geom.LineString}
 */
ol.geom.LineString.prototype.sampleAt = function(d) {
  var line = this.getCoordinates();
  var result = [];
  for (var i=1; i<line.length; i++) {
    result = result.concat(ol.coordinate.sampleAt(line[i-1], line[i], d, i===1));
  }
  return new ol.geom.LineString(result);
};
/** Sample a MultiLineString at a distance
 * @param {number} d
 * @returns {ol.geom.MultiLineString}
 */
ol.geom.MultiLineString.prototype.sampleAt = function(d) {
  var lines = this.getCoordinates();
  var result = [];
  lines.forEach(function(p) {
    var l = [];
    for (var i=1; i<p.length; i++) {
      l = l.concat(ol.coordinate.sampleAt(p[i-1], p[i], d, i===1));
    }
    result.push(l);
  })
  return new ol.geom.MultiLineString(result);
};
/** Sample a Polygon at a distance
 * @param {number} d
 * @returns {ol.geom.Polygon}
 */
ol.geom.Polygon.prototype.sampleAt = function(res) {
  var poly = this.getCoordinates();
  var result = [];
  poly.forEach(function(p) {
    var l = [];
    for (var i=1; i<p.length; i++) {
      l = l.concat(ol.coordinate.sampleAt(p[i-1], p[i], res, i===1));
    }
    result.push(l);
  })
  return new ol.geom.Polygon(result);
};
/** Sample a MultiPolygon at a distance
 * @param {number} res
 * @returns {ol.geom.MultiPolygon}
 */
ol.geom.MultiPolygon.prototype.sampleAt = function(res) {
  var mpoly = this.getCoordinates();
  var result = [];
  mpoly.forEach(function(poly) {
    var a = [];
    result.push(a);
    poly.forEach(function(p) {
      var l = [];
      for (var i=1; i<p.length; i++) {
        l = l.concat(ol.coordinate.sampleAt(p[i-1], p[i], res, i===1));
      }
      a.push(l);
    })
  });
  return new ol.geom.MultiPolygon(result);
};
/** Intersect a geometry using a circle
 * @param {ol.geom.Geometry} geom
 * @param {number} resolution circle resolution to sample the polygon on the circle, default 1
 * @returns {ol.geom.Geometry}
 */
ol.geom.Circle.prototype.intersection = function(geom, resolution) {
  if (geom.sampleAt) {
    var ext = ol.extent.buffer(this.getCenter().concat(this.getCenter()), this.getRadius());
    geom = ol.extent.intersection(ext, geom);
    geom = geom.simplify(resolution);
    var c = this.getCenter();
    var r = this.getRadius();
    //var res = (resolution||1) * r / 100;
    var g = geom.sampleAt(resolution).getCoordinates();
    switch (geom.getType()) {
      case 'Polygon': g = [g];
        // fallthrough
      case 'MultiPolygon': {
        var hasout = false;
        // var hasin = false;
        var result = [];
        g.forEach(function(poly) {
          var a = [];
          result.push(a);
          poly.forEach(function(ring) {
            var l = [];
            a.push(l);
            ring.forEach(function(p) {
              var d = ol.coordinate.dist2d(c, p);
              if (d > r) {
                hasout = true;
                l.push([
                  c[0] + r / d * (p[0]-c[0]),
                  c[1] + r / d * (p[1]-c[1])
                ]);
              } else {
                // hasin = true;
                l.push(p);
              }
            });
          })
        });
        if (!hasout) return geom;
        if (geom.getType() === 'Polygon') {
          return new ol.geom.Polygon(result[0]);
        } else {
          return new ol.geom.MultiPolygon(result);
        }
      }
    }
  } else {
    console.warn('[ol/geom/Circle~intersection] Unsupported geometry type: '+geom.getType());
  }
  return geom;
};
