/*	Copyright (c) 2016 Jean-Marc VIGLINO, 
  released under the CeCILL-B license (French BSD license)
  (http://www.cecill.info/licences/Licence_CeCILL-B_V1-en.txt).
*/
/**
 * @classdesc
 * An overlay fixed on the map. 
 * Use setPosition(coord, true) to force the overlay position otherwise the position will be ignored.
 *
 * @example
var popup = new ol.Overlay.Fixed();
map.addOverlay(popup);
popup.setposition(position, true);
*
* @constructor
* @extends {ol.Overlay}
* @param {} options Extend Overlay options 
* @api stable
*/
ol.Overlay.Fixed = class olOverlayFixed extends ol.Overlay {
  constructor(options) {
    super(options);
  }
  /** Prevent modifying position and use a force argument to force positionning.
   * @param {ol.coordinate} position
   * @param {boolean} force true to change the position, default false
   */
  setPosition(position, force) {
    if (this.getMap() && position) {
      this._pixel = this.getMap().getPixelFromCoordinate(position);
    }
    super.setPosition(position);
    if (force) {
      super.updatePixelPosition();
    }
  }
  /** Update position according the pixel position
   */
  updatePixelPosition() {
    if (this.getMap() && this._pixel && this.getPosition()) {
      var pixel = this.getMap().getPixelFromCoordinate(this.getPosition());
      if (Math.round(pixel[0] * 1000) !== Math.round(this._pixel[0] * 1000)
        || Math.round(pixel[0] * 1000) !== Math.round(this._pixel[0] * 1000)) {
        this.setPosition(this.getMap().getCoordinateFromPixel(this._pixel));
      }
    }
  }
}
