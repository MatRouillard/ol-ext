/*	Copyright (c) 2016 Jean-Marc VIGLINO, 
  released under the CeCILL-B license (French BSD license)
  (http://www.cecill.info/licences/Licence_CeCILL-B_V1-en.txt).
*/
/**
 * OpenLayers 3 lobe Overview Control.
 * The globe can rotate with map (follow.) 
 *
 * @constructor
 * @extends {ol.control.Control}
 * @param {Object=} options Control options.
 * 	@param {boolean} follow follow the map when center change, default false
 * 	@param {top|bottom-left|right} align position as top-left, etc.
 * 	@param {Array<ol.layer>} layers list of layers to display on the globe
 * 	@param {ol.style.Style | Array.<ol.style.Style> | undefined} style style to draw the position on the map , default a marker
 */
ol.control.Globe = class olcontrolGlobe extends ol.control.Control {
  constructor(opt_options) {
    var options = opt_options || {}
    var element = document.createElement('div');
    super({
      element: element,
      target: options.target
    })
    var self = this
    // API
    if (options.target) {
      this.panel_ = options.target
    } else {
      element.classList.add('ol-globe', 'ol-unselectable', 'ol-control')
      if (/top/.test(options.align))
        element.classList.add('ol-control-top')
      if (/right/.test(options.align))
        element.classList.add('ol-control-right')
      this.panel_ = document.createElement("div")
      this.panel_.classList.add("panel")
      element.appendChild(this.panel_)
      this.pointer_ = document.createElement("div")
      this.pointer_.classList.add("ol-pointer")
      element.appendChild(this.pointer_)
    }
    // http://openlayers.org/en/latest/examples/sphere-mollweide.html ???
    // Create a globe map
    this.ovmap_ = new ol.Map({
      controls: new ol.Collection(),
      interactions: new ol.Collection(),
      target: this.panel_,
      view: new ol.View({
        zoom: 0,
        center: [0, 0]
      }),
      layers: options.layers
    })
    setTimeout(function () {
      self.ovmap_.updateSize()
    }, 0)
    this.set('follow', options.follow || false)
    // Cache extent
    this.extentLayer = new ol.layer.Vector({
      name: 'Cache extent',
      source: new ol.source.Vector(),
      style: options.style || [ new ol.style.Style({
        image: new ol.style.Circle({
          fill: new ol.style.Fill({
            color: 'rgba(255,0,0, 1)'
          }),
          stroke: new ol.style.Stroke(
            {
              width: 7,
              color: 'rgba(255,0,0, 0.8)'
            }),
          radius: 5
        })
      })]
    })
    this.ovmap_.addLayer(this.extentLayer)
  }
  /**
   * Set the map instance the control associated with.
   * @param {ol.Map} map The map instance.
   */
  setMap(map) {
    if (this._listener)
      ol.Observable.unByKey(this._listener)
    this._listener = null
    ol.control.Control.prototype.setMap.call(this, map)
    // Get change (new layer added or removed)
    if (map) {
      this._listener = map.getView().on('propertychange', this.setView.bind(this))
      this.setView()
    }
  }
  /** Set the globe center with the map center
  */
  setView() {
    if (this.getMap() && this.get('follow')) {
      this.setCenter(this.getMap().getView().getCenter())
    }
  }
  /** Get globe map
  *	@return {ol.Map}
  */
  getGlobe() {
    return this.ovmap_
  }
  /** Show/hide the globe
  */
  show(b) {
    if (b !== false)
      this.element.classList.remove("ol-collapsed")
    else
      this.element.classList.add("ol-collapsed")
    this.ovmap_.updateSize()
  }
  /** Set position on the map
  *	@param {top|bottom-left|right}  align
  */
  setPosition(align) {
    if (/top/.test(align))
      this.element.classList.add("ol-control-top")
    else
      this.element.classList.remove("ol-control-top")
    if (/right/.test(align))
      this.element.classList.add("ol-control-right")
    else
      this.element.classList.remove("ol-control-right")
  }
  /** Set the globe center
  * @param {_ol_coordinate_} center the point to center to
  * @param {boolean} show show a pointer on the map, defaylt true
  */
  setCenter(center, show) {
    var self = this
    this.pointer_.classList.add("hidden")
    if (center) {
      var map = this.ovmap_
      var p = map.getPixelFromCoordinate(center)
      if (p) {
        if (show !== false) {
          var h = this.element.clientHeight
          setTimeout(function () {
            self.pointer_.style.top = String(Math.min(Math.max(p[1], 0), h)) + 'px'
            self.pointer_.style.left = "50%"
            self.pointer_.classList.remove("hidden")
          }, 800)
        }
        map.getView().animate({ center: [center[0], 0] })
      }
    }
  }
}
