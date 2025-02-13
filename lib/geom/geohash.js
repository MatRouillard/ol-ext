/** Geohash encoding/decoding and associated functions
 * (c) Chris Veness 2014-2019 / MIT Licence
 * https://github.com/chrisveness/latlon-geohash
 */
ol.geohash = {
  // (geohash-specific) Base32 map
  base32: '0123456789bcdefghjkmnpqrstuvwxyz'
};
/** Encodes latitude/longitude to geohash, either to specified precision or to automatically
 * evaluated precision.
 * @param   {ol.coordinate} lonlat Longitude, Latitude in degrees.
 * @param   {number} [precision] Number of characters in resulting geohash.
 * @returns {string} Geohash of supplied latitude/longitude.
 */
ol.geohash.fromLonLat = function(lonlat, precision) {
  var lon = lonlat[0];
  var lat = lonlat[1];
  // infer precision?
  if (!precision) {
    // refine geohash until it matches precision of supplied lat/lon
    for (var p=1; p<=12; p++) {
        var hash = ol.geohash.fromLonLat([lon, lat], p);
        var posn = ol.geohash.toLonLat(hash);
        if (posn.lat==lat && posn.lon==lon) return hash;
    }
    precision = 12; // set to maximum
  }
  if (precision < 1 || precision > 12) precision = 12;
  var idx = 0; // index into base32 map
  var bit = 0; // each char holds 5 bits
  var evenBit = true;
  var geohash = '';
  var latMin =  -90, latMax =  90;
  var lonMin = -180, lonMax = 180;
  while (geohash.length < precision) {
    if (evenBit) {
      // bisect E-W longitude
      var lonMid = (lonMin + lonMax) / 2;
      if (lon >= lonMid) {
        idx = idx*2 + 1;
        lonMin = lonMid;
      } else {
        idx = idx*2;
        lonMax = lonMid;
      }
    } else {
      // bisect N-S latitude
      var latMid = (latMin + latMax) / 2;
      if (lat >= latMid) {
        idx = idx*2 + 1;
        latMin = latMid;
      } else {
        idx = idx*2;
        latMax = latMid;
      }
    }
    evenBit = !evenBit;
    if (++bit == 5) {
      // 5 bits gives us a character: append it and start over
      geohash += ol.geohash.base32.charAt(idx);
      bit = 0;
      idx = 0;
    }
  }
  return geohash;
};
/** Decode geohash to latitude/longitude 
 * (location is approximate centre of geohash cell, to reasonable precision).
 * @param   {string} geohash - Geohash string to be converted to latitude/longitude.
 * @returns {ol.coordinate}
 */
ol.geohash.toLonLat = function(geohash) {
  var extent = ol.geohash.getExtent(geohash); // <-- the hard work
  // now just determine the centre of the cell...
  var latMin = extent[1], lonMin = extent[0];
  var latMax = extent[3], lonMax = extent[2];
  // cell centre
  var lat = (latMin + latMax)/2;
  var lon = (lonMin + lonMax)/2;
  // round to close to centre without excessive precision: ⌊2-log10(Δ°)⌋ decimal places
  lat = lat.toFixed(Math.floor(2-Math.log(latMax-latMin)/Math.LN10));
  lon = lon.toFixed(Math.floor(2-Math.log(lonMax-lonMin)/Math.LN10));
  return [Number(lon), Number(lat)];
};
/** Returns SW/NE latitude/longitude bounds of specified geohash.
 * @param   {string} geohash Cell that bounds are required of.
 * @returns {ol.extent | false} 
 */
ol.geohash.getExtent = function(geohash) {
  if (!geohash) return false;
  geohash = geohash.toLowerCase();
  var evenBit = true;
  var latMin =  -90, latMax =  90;
  var lonMin = -180, lonMax = 180;
  for (var i=0; i<geohash.length; i++) {
    var chr = geohash.charAt(i);
    var idx = ol.geohash.base32.indexOf(chr);
    if (idx == -1) return false;
    for (var n=4; n>=0; n--) {
      var bitN = idx >> n & 1;
      if (evenBit) {
        // longitude
        var lonMid = (lonMin+lonMax) / 2;
        if (bitN == 1) {
          lonMin = lonMid;
        } else {
          lonMax = lonMid;
        }
      } else {
        // latitude
        var latMid = (latMin+latMax) / 2;
        if (bitN == 1) {
          latMin = latMid;
        } else {
          latMax = latMid;
        }
      }
      evenBit = !evenBit;
    }
  }
  return [lonMin, latMin, lonMax, latMax];
};
/** Determines adjacent cell in given direction.
 * @param   {string} geohash Geohash cel
 * @param   {string} direction direction as char : N/S/E/W.
 * @returns {string|false} 
 */
ol.geohash.getAdjacent = function (geohash, direction) {
  // based on github.com/davetroy/geohash-js
  geohash = geohash.toLowerCase();
  direction = direction.toLowerCase();
  if (!geohash) return false;
  if ('nsew'.indexOf(direction) == -1) return false;
  var neighbour = {
      n: [ 'p0r21436x8zb9dcf5h7kjnmqesgutwvy', 'bc01fg45238967deuvhjyznpkmstqrwx' ],
      s: [ '14365h7k9dcfesgujnmqp0r2twvyx8zb', '238967debc01fg45kmstqrwxuvhjyznp' ],
      e: [ 'bc01fg45238967deuvhjyznpkmstqrwx', 'p0r21436x8zb9dcf5h7kjnmqesgutwvy' ],
      w: [ '238967debc01fg45kmstqrwxuvhjyznp', '14365h7k9dcfesgujnmqp0r2twvyx8zb' ],
  };
  var border = {
      n: [ 'prxz',     'bcfguvyz' ],
      s: [ '028b',     '0145hjnp' ],
      e: [ 'bcfguvyz', 'prxz'     ],
      w: [ '0145hjnp', '028b'     ],
  };
  var lastCh = geohash.slice(-1);    // last character of hash
  var parent = geohash.slice(0, -1); // hash without last character
  var type = geohash.length % 2;
  // check for edge-cases which don't share common prefix
  if (border[direction][type].indexOf(lastCh) != -1 && parent != '') {
    parent = ol.geohash.getAdjacent(parent, direction);
  }
  // append letter for direction to parent
  return parent + ol.geohash.base32.charAt(neighbour[direction][type].indexOf(lastCh));
}
/** Returns all 8 adjacent cells to specified geohash.
 * @param   {string} geohash Geohash neighbours are required of.
 * @returns {{n,ne,e,se,s,sw,w,nw: string}}
 */
ol.geohash.getNeighbours = function(geohash) {
  return {
    'n':  ol.geohash.getAdjacent(geohash, 'n'),
    'ne': ol.geohash.getAdjacent(ol.geohash.getAdjacent(geohash, 'n'), 'e'),
    'e':  ol.geohash.getAdjacent(geohash, 'e'),
    'se': ol.geohash.getAdjacent(ol.geohash.getAdjacent(geohash, 's'), 'e'),
    's':  ol.geohash.getAdjacent(geohash, 's'),
    'sw': ol.geohash.getAdjacent(ol.geohash.getAdjacent(geohash, 's'), 'w'),
    'w':  ol.geohash.getAdjacent(geohash, 'w'),
    'nw': ol.geohash.getAdjacent(ol.geohash.getAdjacent(geohash, 'n'), 'w'),
  };
}
