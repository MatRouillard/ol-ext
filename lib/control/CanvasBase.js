/**
 * @classdesc 
 *   Attribution Control integrated in the canvas (for jpeg/png 
 * @see http://www.kreidefossilien.de/webgis/dokumentation/beispiele/export-map-to-png-with-scale
 *
 * @constructor
 * @extends {ol.control.Control}
 * @param {Object=} options extend the ol.control options. 
 *  @param {ol.style.Style} options.style style used to draw the title.
 */
ol.control.CanvasBase = class olcontrolCanvasBase extends ol.control.Control {
  constructor(options) {
    options = options || {}
    super(options)
    // Define a style to draw on the canvas
    this.setStyle(options.style)
  }
  /**
   * Remove the control from its current map and attach it to the new map.
   * Subclasses may set up event handlers to get notified about changes to
   * the map here.
   * @param {ol.Map} map Map.
   * @api stable
   */
  setMap(map) {
    this.getCanvas(map)
    var oldmap = this.getMap()
    if (this._listener) {
      ol.Observable.unByKey(this._listener)
      this._listener = null
    }
    super.setMap(map)
    if (oldmap) {
      try { oldmap.renderSync()}  catch (e) { /* ok */ }
    }
    if (map) {
      this._listener = map.on('postcompose', this._draw.bind(this))
      // Get a canvas layer on top of the map
    }
  }
  /** Get canvas overlay
   */
  getCanvas(map) {
    return ol.ext.getMapCanvas(map)
  }
  /** Get map Canvas
   * @private
   */
  getContext(e) {
    var ctx = e.context
    if (!ctx && this.getMap()) {
      var c = this.getMap().getViewport().getElementsByClassName('ol-fixedoverlay')[0]
      ctx = c ? c.getContext('2d') : null
    }
    return ctx
  }
  /** Set Style
   * @api
   */
  setStyle(style) {
    this._style = style || new ol.style.Style({})
  }
  /** Get style
   * @api
   */
  getStyle() {
    return this._style
  }
  /** Get stroke
   * @api
   */
  getStroke() {
    var t = this._style.getStroke()
    if (!t)
      this._style.setStroke(new ol.style.Stroke({ color: '#000', width: 1.25 }))
    return this._style.getStroke()
  }
  /** Get fill
   * @api
   */
  getFill() {
    var t = this._style.getFill()
    if (!t)
      this._style.setFill(new ol.style.Fill({ color: '#fff' }))
    return this._style.getFill()
  }
  /** Get stroke
   * @api
   */
  getTextStroke() {
    var t = this._style.getText()
    if (!t)
      t = new ol.style.Text({})
    if (!t.getStroke())
      t.setStroke(new ol.style.Stroke({ color: '#fff', width: 3 }))
    return t.getStroke()
  }
  /** Get text fill
   * @api
   */
  getTextFill() {
    var t = this._style.getText()
    if (!t)
      t = new ol.style.Text({})
    if (!t.getFill())
      t.setFill(new ol.style.Fill({ color: '#fff' }))
    return t.getFill()
  }
  /** Get text font
   * @api
   */
  getTextFont() {
    var t = this._style.getText()
    if (!t)
      t = new ol.style.Text({})
    if (!t.getFont())
      t.setFont('12px sans-serif')
    return t.getFont()
  }
  /** Draw the control on canvas
   * @protected
   */
  _draw( /* e */) {
    console.warn('[CanvasBase] draw function not implemented.')
  }
}
