/*	Copyright (c) 2017 Jean-Marc VIGLINO,
  released under the CeCILL-B license (French BSD license)
  (http://www.cecill.info/licences/Licence_CeCILL-B_V1-en.txt).
*/
/**
 * Scale Control.
 * A control to display the scale of the center on the map
 *
 * @constructor
 * @extends {ol.control.Control}
 * @fires select
 * @fires change:input
 * @param {Object=} options
 *  @param {string} options.className control class name
 *  @param {string} options.ppi screen ppi, default 96
 * 	@param {string} options.editable make the control editable, default true
 */
ol.control.Scale = class olcontrolScale extends ol.control.Control {
  constructor(options) {
    options = options || {};
    if (options.typing === undefined) options.typing = 300;
    var element = document.createElement("DIV");
    var classNames = (options.className || "") + " ol-scale";
    if (!options.target) {
      classNames += " ol-unselectable ol-control";
    }
    super({
      element: element,
      target: options.target
    });
    this._input = document.createElement("INPUT");
    this._input.value = '-';
    element.setAttribute('class', classNames);
    if (options.editable === false) this._input.readOnly = true;
    element.appendChild(this._input);
    this._input.addEventListener("change", this.setScale.bind(this));
    this.set('ppi', options.ppi || 96);
  }
  /**
   * Remove the control from its current map and attach it to the new map.
   * Subclasses may set up event handlers to get notified about changes to
   * the map here.
   * @param {ol.Map} map Map.
   * @api stable
   */
  setMap(map) {
    if (this._listener)
      ol.Observable.unByKey(this._listener);
    this._listener = null;
    super.setMap(map);
    // Get change (new layer added or removed)
    if (map) {
      this._listener = map.on('moveend', this.getScale.bind(this));
    }
  }
  /** Display the scale
   */
  getScale() {
    var map = this.getMap();
    if (map) {
      var d = ol.sphere.getMapScale(map, this.get('ppi'));
      this._input.value = this.formatScale(d);
      return d;
    }
  }
  /** Format the scale 1/d
   * @param {Number} d
   * @return {string} formated string
   */
  formatScale(d) {
    if (d > 100)
      d = Math.round(d / 100) * 100;
    else
      d = Math.round(d);
    return '1 / ' + d.toLocaleString();
  }
  /** Set the current scale (will change the scale of the map)
   * @param {Number} value the scale factor
   */
  setScale(value) {
    var map = this.getMap();
    if (map && value) {
      if (value.target) {
        value = value.target.value;
      }
      ol.sphere.setMapScale(map, value, this.get('ppi'));
    }
    this.getScale();
  }
}
