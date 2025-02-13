/*	Copyright (c) 2016 Jean-Marc VIGLINO, 
  released under the CeCILL-B license (French BSD license)
  (http://www.cecill.info/licences/Licence_CeCILL-B_V1-en.txt).
*/
/** Add a composite filter on a layer.    
 * With ol6+ you'd better use {@link ol.filter.CSS} instead.    
 * Use {@link ol.layer.Base#addFilter}, {@link ol.layer.Base#removeFilter} or {@link ol.layer.Base#getFilters}
 * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation
 * @constructor
 * @requires ol.filter
 * @extends {ol.filter.Base}
 * @param {Object} options
 *  @param {string} options.operation composite operation
 */
ol.filter.Composite = class olfilterComposite extends ol.filter.Base {
  constructor(options) {
    super(options);
    this.set("operation", options.operation || "source-over");
  }
  /** Change the current operation
  *	@param {string} operation composite function
  */
  setOperation(operation) {
    this.set('operation', operation || "source-over");
  }
  precompose(e) {
    var ctx = e.context;
    ctx.save();
    ctx.globalCompositeOperation = this.get('operation');
  }
  postcompose(e) {
    e.context.restore();
  }
}
