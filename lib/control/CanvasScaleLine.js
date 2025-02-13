/*	Copyright (c) 2015 Jean-Marc VIGLINO, 
  released under the CeCILL-B license (French BSD license)
  (http://www.cecill.info/licences/Licence_CeCILL-B_V1-en.txt).
*/
/**
 * @classdesc 
 *    OpenLayers Scale Line Control integrated in the canvas (for jpeg/png 
 * @see http://www.kreidefossilien.de/webgis/dokumentation/beispiele/export-map-to-png-with-scale
 *
 * @constructor
 * @extends {ol.control.ScaleLine}
 * @param {Object=} options extend the ol.control.ScaleLine options.
 * 	@param {ol.style.Style} options.style used to draw the scale line (default is black/white, 10px Arial).
 */
ol.control.CanvasScaleLine = class olcontrolCanvasScaleLine extends ol.control.ScaleLine {
  constructor(options) {
    super(options)
    this.element.classList.add('ol-canvas-control')
    this.scaleHeight_ = 6
    // Get style options
    if (!options)
      options = {}
    if (!options.style)
      options.style = new ol.style.Style()
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
    ol.control.CanvasBase.prototype.getCanvas.call(this, map)
    var oldmap = this.getMap()
    if (this._listener)
      ol.Observable.unByKey(this._listener)
    this._listener = null
    super.setMap(map)
    if (oldmap) {
      try { oldmap.renderSync()}  catch (e) { /* ok */ }
    }
    // Add postcompose on the map
    if (map) {
      this._listener = map.on('postcompose', this.drawScale_.bind(this))
    }
    // Hide the default DOM element
    this.element.style.visibility = 'hidden'
    this.olscale = this.element.querySelector(".ol-scale-line-inner")
  }
  /**
   * Change the control style
   * @param {ol.style.Style} style
   */
  setStyle(style) {
    var stroke = style.getStroke()
    this.strokeStyle_ = stroke ? ol.color.asString(stroke.getColor()) : "#000"
    this.strokeWidth_ = stroke ? stroke.getWidth() : 2
    var fill = style.getFill()
    this.fillStyle_ = fill ? ol.color.asString(fill.getColor()) : "#fff"
    var text = style.getText()
    this.font_ = text ? text.getFont() : "10px Arial"
    stroke = text ? text.getStroke() : null
    fill = text ? text.getFill() : null
    this.fontStrokeStyle_ = stroke ? ol.color.asString(stroke.getColor()) : this.fillStyle_
    this.fontStrokeWidth_ = stroke ? stroke.getWidth() : 3
    this.fontFillStyle_ = fill ? ol.color.asString(fill.getColor()) : this.strokeStyle_
    // refresh
    if (this.getMap())
      this.getMap().render()
  }
  /**
   * Draw attribution in the final canvas
   * @param {ol.render.Event} e
   * @private
   */
  drawScale_(e) {
    if (this.element.style.visibility !== 'hidden' || ol.ext.element.getStyle(this.element, 'display') === 'none')
      return
    var ctx = this.getContext(e)
    if (!ctx)
      return
    // Get size of the scale div
    var scalewidth = parseInt(this.olscale.style.width)
    if (!scalewidth)
      return
    var text = this.olscale.textContent
    var position = { left: this.element.offsetLeft, top: this.element.offsetTop }
    // Retina device
    var ratio = e.frameState.pixelRatio
    ctx.save()
    ctx.scale(ratio, ratio)
    // On top
    position.top += this.element.clientHeight - this.scaleHeight_
    // Draw scale text
    ctx.beginPath()
    ctx.strokeStyle = this.fontStrokeStyle_
    ctx.fillStyle = this.fontFillStyle_
    ctx.lineWidth = this.fontStrokeWidth_
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'
    ctx.font = this.font_
    ctx.lineJoin = 'round';
    ctx.strokeText(text, position.left + scalewidth / 2, position.top)
    ctx.fillText(text, position.left + scalewidth / 2, position.top)
    ctx.closePath()
    // Draw scale bar
    position.top += 2
    ctx.lineWidth = this.strokeWidth_
    ctx.strokeStyle = this.strokeStyle_
    var max = 4
    var n = parseInt(text)
    while (n % 10 === 0) n /= 10
    if (n % 5 === 0) max = 5
    for (var i = 0; i < max; i++) {
      ctx.beginPath()
      ctx.fillStyle = i % 2 ? this.fillStyle_ : this.strokeStyle_
      ctx.rect(position.left + i * scalewidth / max, position.top, scalewidth / max, this.scaleHeight_)
      ctx.stroke()
      ctx.fill()
      ctx.closePath()
    }
    ctx.restore()
  }
  /** Get map Canvas
   * @private
   */
  getContext(e) {
    return ol.control.CanvasBase.prototype.getContext.call(this, e);
  }
}
