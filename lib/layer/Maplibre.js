/*	Copyright (c) 2019 Jean-Marc VIGLINO,
  released under the CeCILL-B license (French BSD license)
  (http://www.cecill.info/licences/Licence_CeCILL-B_V1-en.txt).
*/
/** Layer that use Maplibre GL as render
 * @constructor 
 * @extends {ol.layer.Layer}
 * @param {any} options layer options
 *  @param {string} options.layer Geoportail layer name
 *  @param {string} options.gppKey Geoportail API key
 *  @param {olx.source.WMTSOptions=} tileoptions WMTS options if not defined default are used
 */
ol.layer.Maplibre = function(options) {
  if (!ol.layer.Layer) {
    console.error('[ol/layer/MapLibre] bad ol version (need ol@6+)');
  }
  options = options || {};
  options.render = function (frameState) {
    // Create map if not exists
    if (!this._container) {
      this._create(options.style);
    } 
    /**/
    var fac = 1
    var dzoom = 1
    //fac = Math.pow(2,.5);
    //dzoom = .5;
    /*/
    var fac = 2
    var dzoom = 0
    /**/
    this._container.style.width = fac*frameState.size[0]+'px';
    this._container.style.height = fac*frameState.size[1]+'px';
    var glMap = this.glMap;
    if (!glMap) return null;
    var canvas = glMap.getCanvas();
    canvas.style.transform = 'scale('+(1/fac)+')';
    // Force map to resize
    if (frameState.size[0] !== canvas.width || frameState.size[1] !== canvas.height) {
      glMap.resize();
    }
    canvas.style.opacity = this.getOpacity();
    // adjust view parameters in mapbox
    var viewState = frameState.viewState;
    glMap.jumpTo({
      center: ol.proj.toLonLat(viewState.center),
      zoom: viewState.zoom - dzoom,
      bearing: (-viewState.rotation * 180) / Math.PI,
      animate: false,
    });
    // cancel the scheduled update & trigger synchronous redraw
    // see https://github.com/mapbox/mapbox-gl-js/issues/7893#issue-408992184
    // NOTE: THIS MIGHT BREAK IF UPDATING THE MAPBOX VERSION
    if (glMap._frame) {
      glMap._frame.cancel();
      glMap._frame = null;
    }
    glMap._render();
    return this._container;
  }
  ol.layer.Layer.call(this, options);
};
if (!ol.layer.Layer) ol.layer.Layer = function() {};
ol.ext.inherits (ol.layer.Maplibre, ol.layer.Layer);
/** Get the Maplibre map
 * @return {Object}
 */
ol.layer.Maplibre.prototype.getMapGL = function() {
  return this.glMap;
}
/** Set style
 * @param {Object|string} style Mapbox style Object or a URL to JSON
 */
ol.layer.Maplibre.prototype.setStyle = function(style) {
  this.set('style', style);
  if (this.getMapGL()) {
    this.getMapGL().setStyle(style);
  }
  this.changed();
}
/** Returns the map's Mapbox style object.
 * @returns {Object} 
 */
ol.layer.Maplibre.prototype.getStyle = function() {
  return this.getMapGL().get('style');
}
/** Create the map libre map
 * @param {Object|string} style Mapbox style Object or a URL to JSON
 * @private
 */
ol.layer.Maplibre.prototype._create = function(style) {
  this._container = ol.ext.element.create('DIV', {
    className: 'ol-maplibre-gl',
    style: {
      position: 'absolute',
      top: 0,
      left: 0
    },
    parent: document.body
  })
  this.glMap = new mapboxgl.Map({
    container: this._container,
    style: style,
    center: [3, 47],
    zoom: 5,
    pitch: 0,
    antialias: true,
    attributionControl: false,
    boxZoom: false,
    doubleClickZoom: false,
    dragPan: false,
    dragRotate: false,
    interactive: false,
    keyboard: false,
    pitchWithRotate: false,
    scrollZoom: false,
    touchZoomRotate: false,
  });
};
