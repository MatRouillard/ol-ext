/*	Copyright (c) 2019 Jean-Marc VIGLINO,
  released under the CeCILL-B license (French BSD license)
  (http://www.cecill.info/licences/Licence_CeCILL-B_V1-en.txt).
*/
/** A sketch layer used as overlay to handle drawing sketch (helper for drawing tools)
 * @constructor 
 * @extends {ol/layer/Vector}
 * @fires drawstart
 * @fires drawend
 * @fires drawabort
 * @param {*} options 
 *  @param {string} options.type Geometry type, default LineString
 *  @param {ol.style.Style|Array<ol.style.Style>} options.style Drawing style
 *  @param {ol.style.Style|Array<ol.style.Style>} options.sketchStyle Sketch style
 */
ol.layer.SketchOverlay = class ollayerSketchOverlay extends ol.layer.Vector {
  constructor(options) {
    options = options || {}
    var style = options.style || ol.style.Style.defaultStyle(true)
    var sketchStyle = options.sketchStyle
    if (!sketchStyle) {
      sketchStyle = ol.style.Style.defaultStyle()
      sketchStyle = [
        new ol.style.Style({
          image: new ol.style.RegularShape({
            points: 4,
            radius: 10,
            radius2: 0,
            stroke: new ol.style.Stroke({
              color: [255, 255, 255, .5],
              width: 3
            })
          })
        }),
        sketchStyle[0].clone()
      ]
      sketchStyle[1].setImage(new ol.style.RegularShape({
        points: 4,
        radius: 10,
        radius2: 0,
        stroke: new ol.style.Stroke({
          color: [0, 153, 255, 1],
          width: 1.25
        })
      }))
    }
    super({
      name: 'sketch',
      source: new ol.source.Vector({ useSpatialIndex: false }),
      style: function (f) {
        return (f.get('sketch') ? sketchStyle : style)
      },
      updateWhileAnimating: true,
      updateWhileInteracting: true
    })
    this._geom = []
    // Sketch features
    this.getSource().addFeatures([
      new ol.Feature({
        sketch: true,
        geometry: new ol.geom.Point([])
      }),
      new ol.Feature({
        sketch: true,
        geometry: new ol.geom.LineString([])
      }),
      new ol.Feature(),
      new ol.Feature(new ol.geom.Point([]))
    ])
    this.setGeometryType(options.type)
  }
  /** Set geometry type
   * @param {string} type Geometry type
   * @return {string} the current type
   */
  setGeometryType(type) {
    var t = /^Point$|^LineString$|^Polygon$|^Circle$/.test(type) ? type : 'LineString'
    if (t !== this._type) {
      this.abortDrawing()
      this._type = t
    }
    return this._type
  }
  /** Get geometry type
   * @return {string} Geometry type
   */
  getGeometryType() {
    return this._type
  }
  /** Add a new Point to the sketch
   * @param {ol.coordinate} coord
   * @return {boolean} true if point has been added, false if same coord
   */
  addPoint(coord) {
    if (this._lastCoord !== this._position) {
      if (!this._geom.length) {
        this.startDrawing()
      }
      this._geom.push(coord)
      this._lastCoord = coord
      this._position = coord
      this.drawSketch()
      if (this.getGeometryType() === 'Point') {
        this.finishDrawing()
      }
      if (this.getGeometryType() === 'Circle' && this._geom.length >= 2) {
        this.finishDrawing()
      }
      return true
    }
    return false
  }
  /** Remove the last Point from the sketch
   */
  removeLastPoint() {
    this._geom.pop()
    this._lastCoord = this._geom[this._geom.length - 1]
    this.drawSketch()
  }
  /** Strat a new drawing
   * @param {*} options
   *  @param {string} type Geometry type, default the current type
   *  @param {Array<ol.coordinate>} coordinates a list of coordinates to extend
   *  @param {ol.Feature} feature a feature to extend (LineString or Polygon only)
   *  @param {boolean} atstart extent coordinates or feature at start, default false (extend at end)
   */
  startDrawing(options) {
    options = options || {}
    this._geom = []
    if (options.type)
      this.setGeometryType(options.type)
    this.drawSketch()
    if (!this._drawing) {
      this.dispatchEvent({
        type: 'drawstart',
        feature: this.getFeature()
      })
    }
    this._drawing = true
  }
  /** Finish drawing
   * @return {ol.Feature} the drawed feature
   */
  finishDrawing(valid) {
    var f = this.getSource().getFeatures()[2].clone()
    var isvalid = !!f
    switch (this.getGeometryType()) {
      case 'Circle':
      case 'LineString': {
        isvalid = this._geom.length > 1
        break
      }
      case 'Polygon': {
        isvalid = this._geom.length > 2
        break
      }
    }
    if (valid && !isvalid)
      return false
    this._geom = []
    this._lastCoord = null
    this.drawSketch()
    if (this._drawing) {
      this.dispatchEvent({
        type: 'drawend',
        valid: isvalid,
        feature: f
      })
    }
    this._drawing = false
    return f
  }
  /** Abort drawing
   */
  abortDrawing() {
    if (this._drawing) {
      this.dispatchEvent({
        type: 'drawabort',
        feature: this.getFeature()
      })
    }
    this._drawing = false
    this._geom = []
    this._lastCoord = null
    this.drawSketch()
  }
  /** Set current position
   * @param {ol.coordinate} coord
   */
  setPosition(coord) {
    this._position = coord
    this.drawLink()
  }
  /** Get current position
   * @return {ol.coordinate}
   */
  getPosition() {
    return this._position
  }
  /** Draw/refresh link
   */
  drawLink() {
    var features = this.getSource().getFeatures()
    if (this._position) {
      if (this._lastCoord && this._lastCoord === this._position) {
        features[0].getGeometry().setCoordinates([])
      } else {
        features[0].getGeometry().setCoordinates(this._position)
      }
      if (this._geom.length) {
        if (this.getGeometryType() === 'Circle') {
          features[1].setGeometry(new ol.geom.Circle(this._geom[0], ol.coordinate.dist2d(this._geom[0], this._position)))
        } else if (this.getGeometryType() === 'Polygon') {
          features[1].setGeometry(new ol.geom.LineString([this._lastCoord, this._position, this._geom[0]]))
        } else {
          features[1].setGeometry(new ol.geom.LineString([this._lastCoord, this._position]))
        }
      } else {
        features[1].setGeometry(new ol.geom.LineString([]))
      }
    } else {
      features[0].getGeometry().setCoordinates([])
      features[1].setGeometry(new ol.geom.LineString([]))
    }
  }
  /** Get current feature
   */
  getFeature() {
    return this.getSource().getFeatures()[2]
  }
  /** Draw/refresh sketch
   */
  drawSketch() {
    this.drawLink()
    var features = this.getSource().getFeatures()
    if (!this._geom.length) {
      features[2].setGeometry(null)
      features[3].setGeometry(new ol.geom.Point([]))
    } else {
      if (!this._lastCoord)
        this._lastCoord = this._geom[this._geom.length - 1]
      features[3].getGeometry().setCoordinates(this._lastCoord)
      switch (this._type) {
        case 'Point': {
          features[2].setGeometry(new ol.geom.Point(this._lastCoord))
          break
        }
        case 'Circle': {
          if (!features[2].getGeometry()) {
            features[2].setGeometry(new ol.geom.Circle(this._geom[0], ol.coordinate.dist2d(this._geom[0], this._geom[this._geom.length - 1])))
          } else {
            features[2].getGeometry().setRadius(ol.coordinate.dist2d(this._geom[0], this._geom[this._geom.length - 1]))
          }
          break
        }
        case 'LineString': {
          if (!features[2].getGeometry()) {
            features[2].setGeometry(new ol.geom.LineString(this._geom))
          } else {
            features[2].getGeometry().setCoordinates(this._geom)
          }
          break
        }
        case 'Polygon': {
          this._geom.push(this._geom[0])
          if (!features[2].getGeometry()) {
            features[2].setGeometry(new ol.geom.Polygon([this._geom]))
          } else {
            features[2].getGeometry().setCoordinates([this._geom])
          }
          this._geom.pop()
          break
        }
        default: {
          console.error('[ol/layer/SketchOverlay~drawSketch] geometry type not supported (' + this._type + ')')
          break
        }
      }
    }
  }
}
