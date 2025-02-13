/*	Copyright (c) 2016 Jean-Marc VIGLINO, 
  released under the CeCILL-B license (French BSD license)
  (http://www.cecill.info/licences/Licence_CeCILL-B_V1-en.txt).
*/
/* Namespace */
ol.filter = {};
/**
 * @classdesc 
 * Abstract base class; normally only used for creating subclasses and not instantiated in apps.    
 * Used to create filters    
 * Use {@link ol.layer.Base#addFilter}, {@link ol.layer.Base#removeFilter} or {@link ol.layer.Base#getFilters}
 * to handle filters on layers.
 *
 * @constructor
 * @extends {ol.Object}
 * @param {Object} options 
 *  @param {boolean} [options.active]
 */
ol.filter.Base = class olfilterBase extends ol.Object {
  constructor(options) {
    super(options)
    // Array of postcompose listener
    this._listener = []
    if (options && options.active === false) {
      this.set('active', false)
    } else {
      this.set('active', true)
    }
  }
  /** Activate / deactivate filter
  *	@param {boolean} b
  */
  setActive(b) {
    this.set('active', b === true)
  }
  /** Get filter active
  *	@return {boolean}
  */
  getActive() {
    return this.get('active')
  }
}
;(function(){
/** Internal function
 * @this {ol.filter} this the filter
 * @private
 */
function precompose_(e) {
  if (this.get('active') && e.context) this.precompose(e);
}
/** Internal function
 * @this {ol.filter} this the filter
 * @private
 */
function postcompose_(e) {
  if (this.get('active') && e.context) this.postcompose(e);
}
/** Force filter redraw / Internal function
 * @this {ol.Map|ol.layer.Layer} this: the map or layer the filter is added to
 * @private
 */
function filterRedraw_(/* e */) {
  if (this.renderSync) {
    try { this.renderSync(); } catch(e) { /* ok */ }
  } else {
    this.changed(); 
  }
}
/** Add a filter to an ol object
 * @this {ol.Map|ol.layer.Layer} this: the map or layer the filter is added to
 * @private
 */
function addFilter_(filter) {
  if (!this.filters_) this.filters_ = [];
  this.filters_.push(filter);
  if (filter.addToLayer) filter.addToLayer(this);
  if (filter.precompose) filter._listener.push ( { listener: this.on(['precompose','prerender'], precompose_.bind(filter)), target: this });
  if (filter.postcompose) filter._listener.push ( { listener: this.on(['postcompose','postrender'], postcompose_.bind(filter)), target: this });
  filter._listener.push ( { listener: filter.on('propertychange', filterRedraw_.bind(this)), target: this });
  filterRedraw_.call (this);
}
/** Remove a filter to an ol object
 * @this {ol.Map|ol.layer.Layer} this: the map or layer the filter is added to
 * @private
 */
function removeFilter_(filter) {
  var i
  if (!this.filters_) this.filters_ = [];
  if (!filter) {
    this.filters_.forEach(function(f) {
      this.removeFilter(f)
    }.bind(this))
    return;
  }
  for (i=this.filters_.length-1; i>=0; i--) {
    if (this.filters_[i]===filter) this.filters_.splice(i,1);
  }
  for (i=filter._listener.length-1; i>=0; i--) {
    // Remove listener on this object
    if (filter._listener[i].target === this) {
      if (filter.removeFromLayer) filter.removeFromLayer(this);
      ol.Observable.unByKey(filter._listener[i].listener);
      filter._listener.splice(i,1);
    }
  }
  filterRedraw_.call (this);
}
/** Add a filter to an ol.Map
*	@param {ol.filter}
*/
ol.Map.prototype.addFilter = function (filter) {
  console.warn('[OL-EXT] addFilter deprecated on map.')
  addFilter_.call (this, filter);
};
/** Remove a filter to an ol.Map
*	@param {ol.filter}
*/
ol.Map.prototype.removeFilter = function (filter) {
  removeFilter_.call (this, filter);
};
/** Get filters associated with an ol.Map
*	@return {Array<ol.filter>}
*/
ol.Map.prototype.getFilters = function () {
  return this.filters_ || [];
};
/** Add a filter to an ol.Layer
*	@param {ol.filter}
*/
ol.layer.Base.prototype.addFilter = function (filter) {
  addFilter_.call (this, filter);
};
/** Remove a filter to an ol.Layer
*	@param {ol.filter}
*/
ol.layer.Base.prototype.removeFilter = function (filter) {
  removeFilter_.call (this, filter);
};
/** Get filters associated with an ol.Map
*	@return {Array<ol.filter>}
*/
ol.layer.Base.prototype.getFilters = function () {
  return this.filters_ || [];
};
})();
