/*	Copyright (c) 2018 Jean-Marc VIGLINO, 
	released under the CeCILL-B license (French BSD license)
	(http://www.cecill.info/licences/Licence_CeCILL-B_V1-en.txt).
*/
/** DFCI source: a source to display the French DFCI grid on a map
 * @see http://ccffpeynier.free.fr/Files/dfci.pdf
 * @constructor ol.source.DFCI
 * @extends {ol/source/Vector}
 * @param {any} options Vector source options
 *  @param {Array<Number>} resolutions a list of resolution to change the drawing level, default [1000,100,20]
 */
ol.source.DFCI = class olsourceDFCI extends ol.source.Vector {
  constructor(options) {
    options = options || {}
    options.loader = function(extent, resolution, projection) {
      return this._calcGrid(extent, resolution, projection)
    }
    options.strategy = function (extent, resolution) {
      if (this.resolution && this.resolution != resolution) {
        this.clear()
        this.refresh()
      }
      return [extent]
    }
    super(options)
    this._bbox = [[0, 1600000], [11 * 100000, 1600000 + 10 * 100000]]
    this.set('resolutions', options.resolutions || [1000, 100, 20])
    // Add Lambert IIe proj 
    if (!proj4.defs["EPSG:27572"])
      proj4.defs("EPSG:27572", "+proj=lcc +lat_1=46.8 +lat_0=46.8 +lon_0=0 +k_0=0.99987742 +x_0=600000 +y_0=2200000 +a=6378249.2 +b=6356515 +towgs84=-168,-60,320,0,0,0,0 +pm=paris +units=m +no_defs")
    ol.proj.proj4.register(proj4)
  }
  /** Cacluate grid according extent/resolution
   */
  _calcGrid(extent, resolution, projection) {
    // Show step 0
    var f, ext, res = this.get('resolutions')
    if (resolution > (res[0] || 1000)) {
      if (this.resolution != resolution) {
        if (!this._features0) {
          ext = [this._bbox[0][0], this._bbox[0][1], this._bbox[1][0], this._bbox[1][1]]
          this._features0 = this._getFeatures(0, ext, projection)
        }
        this.addFeatures(this._features0)
      }
    }
    else if (resolution > (res[1] || 100)) {
      this.clear()
      ext = ol.proj.transformExtent(extent, projection, 'EPSG:27572')
      f = this._getFeatures(1, ext, projection)
      this.addFeatures(f)
    }
    else if (resolution > (res[2] || 0)) {
      this.clear()
      ext = ol.proj.transformExtent(extent, projection, 'EPSG:27572')
      f = this._getFeatures(2, ext, projection)
      this.addFeatures(f)
    }
    else {
      this.clear()
      ext = ol.proj.transformExtent(extent, projection, 'EPSG:27572')
      f = this._getFeatures(3, ext, projection)
      this.addFeatures(f)
    }
    // reset load
    this.resolution = resolution
  }
  /**
   * Get middle point
   * @private
   */
  _midPt(p1, p2) {
    return [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2]
  }
  /**
   * Get feature with geom
   * @private
   */
  _trFeature(geom, id, level, projection) {
    var g = new ol.geom.Polygon([geom])
    var f = new ol.Feature(g.transform('EPSG:27572', projection))
    f.set('id', id)
    f.set('level', level)
    return f
  }
  /** Get features
   *
   */
  _getFeatures(level, extent, projection) {
    var features = []
    var i
    var step = 100000
    if (level > 0)
      step /= 5
    if (level > 1)
      step /= 10
    var p0 = [
      Math.max(this._bbox[0][0], Math.floor(extent[0] / step) * step),
      Math.max(this._bbox[0][1], Math.floor(extent[1] / step) * step)
    ]
    var p1 = [
      Math.min(this._bbox[1][0] + 99999, Math.floor(extent[2] / step) * step),
      Math.min(this._bbox[1][1] + 99999, Math.floor(extent[3] / step) * step)
    ]
    for (var x = p0[0]; x <= p1[0]; x += step) {
      for (var y = p0[1]; y <= p1[1]; y += step) {
        var p, geom = [[x, y], [x + step, y], [x + step, y + step], [x, y + step], [x, y]]
        if (level > 2) {
          var m = this._midPt(geom[0], geom[2])
          // .5
          var g = []
          for (i = 0; i < geom.length; i++) {
            g.push(this._midPt(geom[i], m))
          }
          features.push(this._trFeature(g, ol.coordinate.toDFCI([x, y], 2) + '.5', level, projection))
          // .1 > .4
          for (i = 0; i < 4; i++) {
            g = []
            g.push(geom[i])
            g.push(this._midPt(geom[i], geom[(i + 1) % 4]))
            g.push(this._midPt(m, g[1]))
            g.push(this._midPt(m, geom[i]))
            p = this._midPt(geom[i], geom[(i + 3) % 4])
            g.push(this._midPt(m, p))
            g.push(p)
            g.push(geom[i])
            features.push(this._trFeature(g, ol.coordinate.toDFCI([x, y], 2) + '.' + (4 - i), level, projection))
          }
        } else {
          features.push(this._trFeature(geom, ol.coordinate.toDFCI([x, y], level), level, projection))
        }
      }
    }
    return features
  }
}
