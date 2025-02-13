/*	Copyright (c) 2016 Jean-Marc VIGLINO, 
  released under the CeCILL-B license (French BSD license)
  (http://www.cecill.info/licences/Licence_CeCILL-B_V1-en.txt).
*/
/** Interaction split interaction for splitting feature geometry
 * @constructor
 * @extends {ol.interaction.Interaction}
 * @fires  beforesplit, aftersplit, pointermove
 * @param {*} 
 *  @param {ol.source.Vector|Array<ol.source.Vector>} [options.sources] a list of source to split (configured with useSpatialIndex set to true), if none use map visible layers.
 *  @param {ol.Collection.<ol.Feature>} options.features collection of feature to split (instead of a list of sources)
 *  @param {integer} options.snapDistance distance (in px) to snap to an object, default 25px
 *	@param {string|undefined} options.cursor cursor name to display when hovering an objet
 *  @param {function|undefined} options.filter a filter that takes a feature and return true if it can be clipped, default always split.
 *  @param ol.style.Style | Array<ol.style.Style> | false | undefined} options.featureStyle Style for the selected features, choose false if you don't want feature selection. By default the default edit style is used.
 *  @param {ol.style.Style | Array<ol.style.Style> | undefined} options.sketchStyle Style for the sektch features. 
 *  @param {function|undefined} options.tolerance Distance between the calculated intersection and a vertex on the source geometry below which the existing vertex will be used for the split.  Default is 1e-10.
 */
ol.interaction.Split = class olinteractionSplit extends ol.interaction.Interaction {
  constructor(options) {
    if (!options)
      options = {}
    super({
      handleEvent: function (e) {
        switch (e.type) {
          case "singleclick":
            return this.handleDownEvent(e)
          case "pointermove":
            return this.handleMoveEvent(e)
          default:
            return true
        }
        //return true;
      }
    })
    // Snap distance (in px)
    this.snapDistance_ = options.snapDistance || 25
    // Split tolerance between the calculated intersection and the geometry
    this.tolerance_ = options.tolerance || 1e-10
    // Cursor
    this.cursor_ = options.cursor
    // List of source to split
    this.setSources(options.sources)
    if (options.features) {
      if (!this.sources_) this.sources_ = [];
      this.sources_.push(new ol.source.Vector({ features: options.features }))
    }
    // Get all features candidate
    this.filterSplit_ = options.filter || function () { return true }
    // Default style
    var white = [255, 255, 255, 1]
    var blue = [0, 153, 255, 1]
    var width = 3
    var fill = new ol.style.Fill({ color: 'rgba(255,255,255,0.4)' })
    var stroke = new ol.style.Stroke({
      color: '#3399CC',
      width: 1.25
    })
    var sketchStyle = [
      new ol.style.Style({
        image: new ol.style.Circle({
          fill: fill,
          stroke: stroke,
          radius: 5
        }),
        fill: fill,
        stroke: stroke
      })
    ]
    var featureStyle = [
      new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: white,
          width: width + 2
        })
      }),
      new ol.style.Style({
        image: new ol.style.Circle({
          radius: 2 * width,
          fill: new ol.style.Fill({
            color: blue
          }),
          stroke: new ol.style.Stroke({
            color: white,
            width: width / 2
          })
        }),
        stroke: new ol.style.Stroke({
          color: blue,
          width: width
        })
      }),
    ]
    // Custom style
    if (options.sketchStyle)
      sketchStyle = options.sketchStyle instanceof Array ? options.sketchStyle : [options.sketchStyle]
    if (options.featureStyle)
      featureStyle = options.featureStyle instanceof Array ? options.featureStyle : [options.featureStyle]
    // Create a new overlay for the sketch
    this.overlayLayer_ = new ol.layer.Vector({
      source: new ol.source.Vector({
        useSpatialIndex: false
      }),
      name: 'Split overlay',
      displayInLayerSwitcher: false,
      style: function (f) {
        if (f._sketch_)
          return sketchStyle
        else
          return featureStyle
      }
    })
  }
  /**
   * Remove the interaction from its current map, if any,  and attach it to a new
   * map, if any. Pass `null` to just remove the interaction from the current map.
   * @param {ol.Map} map Map.
   * @api stable
   */
  setMap(map) {
    if (this.getMap()) {
      this.getMap().removeLayer(this.overlayLayer_)
    }
    super.setMap(map)
    this.overlayLayer_.setMap(map)
  }
  /** Get sources to split features in
   * @return {Array<ol.source.Vector>}
   */
  getSources() {
    if (!this.sources_ && this.getMap()) {
      var sources = []
      var getSources = function (layers) {
        layers.forEach(function (layer) {
          if (layer.getVisible()) {
            if (layer.getSource && layer.getSource() instanceof ol.source.Vector) {
              sources.unshift(layer.getSource())
            } else if (layer.getLayers) {
              getSources(layer.getLayers())
            }
          }
        })
      }
      getSources(this.getMap().getLayers())
      return sources
    }
    return this.sources_ || []
  }
  /** Set sources to split features in
   * @param {ol.source.Vector|Array<ol.source.Vector>|boolean} [sources] if not defined get all map vector sources
   */
  setSources(sources) {
    this.sources_ = sources ? (sources instanceof Array ? sources || false : [sources]) : false
  }
  /** Get closest feature at pixel
   * @param {ol.Pixel}
   * @return {ol.feature}
   * @private
   */
  getClosestFeature(e) {
    var source, f, c, g, d = this.snapDistance_ + 1
    // Look for closest point in the sources
    this.getSources().forEach(function (si) {
      var fi = si.getClosestFeatureToCoordinate(e.coordinate)
      if (fi && fi.getGeometry().splitAt) {
        var ci = fi.getGeometry().getClosestPoint(e.coordinate)
        var gi = new ol.geom.LineString([e.coordinate, ci])
        var di = gi.getLength() / e.frameState.viewState.resolution
        if (di < d) {
          source = si
          d = di
          f = fi
          g = gi
          c = ci
        }
      }
    })
    // Snap ?
    if (d > this.snapDistance_) {
      return false
    } else {
      // Snap to node
      var coord = this.getNearestCoord(c, f.getGeometry().getCoordinates())
      var p = this.getMap().getPixelFromCoordinate(coord)
      if (ol.coordinate.dist2d(e.pixel, p) < this.snapDistance_) {
        c = coord
      }
      //
      return { source: source, feature: f, coord: c, link: g }
    }
  }
  /** Get nearest coordinate in a list
  * @param {ol.coordinate} pt the point to find nearest
  * @param {Array<ol.coordinate>} coords list of coordinates
  * @return {ol.coordinate} the nearest coordinate in the list
  */
  getNearestCoord(pt, coords) {
    var d, dm = Number.MAX_VALUE, p0
    for (var i = 0; i < coords.length; i++) {
      d = ol.coordinate.dist2d(pt, coords[i])
      if (d < dm) {
        dm = d
        p0 = coords[i]
      }
    }
    return p0
  }
  /**
   * @param {ol.MapBrowserEvent} evt Map browser event.
   * @return {boolean} `true` to start the drag sequence.
   */
  handleDownEvent(evt) {
    // Something to split ?
    var current = this.getClosestFeature(evt)
    if (current) {
      var self = this
      self.overlayLayer_.getSource().clear()
      var split = current.feature.getGeometry().splitAt(current.coord, this.tolerance_)
      var i
      if (split.length > 1) {
        var tosplit = []
        for (i = 0; i < split.length; i++) {
          var f = current.feature.clone()
          f.setGeometry(split[i])
          tosplit.push(f)
        }
        self.dispatchEvent({ type: 'beforesplit', original: current.feature, features: tosplit })
        current.source.dispatchEvent({ type: 'beforesplit', original: current.feature, features: tosplit })
        current.source.removeFeature(current.feature)
        for (i = 0; i < tosplit.length; i++) {
          current.source.addFeature(tosplit[i])
        }
        self.dispatchEvent({ type: 'aftersplit', original: current.feature, features: tosplit })
        current.source.dispatchEvent({ type: 'aftersplit', original: current.feature, features: tosplit })
      }
    }
    return false
  }
  /**
   * @param {ol.MapBrowserEvent} evt Event.
   */
  handleMoveEvent(e) {
    var map = e.map
    this.overlayLayer_.getSource().clear()
    var current = this.getClosestFeature(e)
    if (current && this.filterSplit_(current.feature)) {
      var p, l
      // Draw sketch
      this.overlayLayer_.getSource().addFeature(current.feature)
      p = new ol.Feature(new ol.geom.Point(current.coord))
      p._sketch_ = true
      this.overlayLayer_.getSource().addFeature(p)
      //
      l = new ol.Feature(current.link)
      l._sketch_ = true
      this.overlayLayer_.getSource().addFeature(l)
      // move event
      this.dispatchEvent({
        type: 'pointermove',
        coordinate: e.coordinate,
        frameState: e.frameState,
        originalEvent: e.originalEvent,
        map: e.map,
        pixel: e.pixel,
        feature: current.feature,
        linkGeometry: current.link
      })
    } else {
      this.dispatchEvent(e)
    }
    var element = map.getTargetElement()
    if (this.cursor_) {
      if (current) {
        if (element.style.cursor != this.cursor_) {
          this.previousCursor_ = element.style.cursor
          ol.ext.element.setCursor(element, this.cursor_)
        }
      } else if (this.previousCursor_ !== undefined) {
        ol.ext.element.setCursor(element, this.previousCursor_)
        this.previousCursor_ = undefined
      }
    }
  }
}
