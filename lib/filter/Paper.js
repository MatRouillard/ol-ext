/*	Copyright (c) 2016 Jean-Marc VIGLINO, 
  released under the CeCILL-B license (French BSD license)
  (http://www.cecill.info/licences/Licence_CeCILL-B_V1-en.txt).
*/
/** @typedef {Object} FilterPointillismOptions
 * @property {number} saturate saturation, default 2
 */
/** @deprecated use canvas filter instead
 * @constructor
 * @extends {ol.filter.Base}
 * @param {object} options
 *  @param {boolean} [options.active]
 *  @param {number} [options.scale=1]
 */
ol.filter.Paper = class olfilterPaper extends ol.filter.Base {
  constructor(options) {
    options = options || {};
    super(options);
    this._svgfilter = new ol.ext.SVGFilter.Paper(options);
  }
  /** @private
   */
  precompose( /* e */) {
  }
  /** @private
   */
  postcompose(e) {
    // var ratio = e.frameState.pixelRatio;
    var ctx = e.context;
    var canvas = ctx.canvas;
    ctx.save();
    ctx.filter = 'url(#' + this._svgfilter.getId() + ')';
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }
  /** Set filter light
   * @param {number} light light option. 0: darker, 100: lighter
   */
  setLight(light) {
    this._svgfilter.setLight(light);
  }
}
