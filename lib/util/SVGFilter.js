/** SVG filter 
 * @param {*} options
 *  @param {ol.ext.SVGOperation} option.operation
 *  @param {string} option.id filter id, only to use if you want to adress the filter directly or var the lib create one, if none create a unique id
 *  @param {string} option.color color interpolation filters, linear or sRGB
 */
ol.ext.SVGFilter = class olextSVGFilter extends ol.Object {
  constructor(options) {
    options = options || {};
    super();
    if (!ol.ext.SVGFilter.prototype.svg) {
      ol.ext.SVGFilter.prototype.svg = document.createElementNS(this.NS, 'svg');
      ol.ext.SVGFilter.prototype.svg.setAttribute('version', '1.1');
      ol.ext.SVGFilter.prototype.svg.setAttribute('width', 0);
      ol.ext.SVGFilter.prototype.svg.setAttribute('height', 0);
      ol.ext.SVGFilter.prototype.svg.style.position = 'absolute';
      /* Firefox doesn't process hidden svg
      ol.ext.SVGFilter.prototype.svg.style.display = 'none';
      */
      document.body.appendChild(ol.ext.SVGFilter.prototype.svg);
    }
    this.element = document.createElementNS(this.NS, 'filter');
    this._id = options.id || '_ol_SVGFilter_' + (ol.ext.SVGFilter.prototype._id++);
    this.element.setAttribute('id', this._id);
    if (options.color)
      this.element.setAttribute('color-interpolation-filters', options.color);
    if (options.operation)
      this.addOperation(options.operation);
    ol.ext.SVGFilter.prototype.svg.appendChild(this.element);
  }
  /** Get filter ID
   * @return {string}
   */
  getId() {
    return this._id;
  }
  /** Remove from DOM
   */
  remove() {
    this.element.remove();
  }
  /** Add a new operation
   * @param {ol.ext.SVGOperation} operation
   */
  addOperation(operation) {
    if (operation instanceof Array) {
      operation.forEach(function (o) { this.addOperation(o); }.bind(this));
    } else {
      if (!(operation instanceof ol.ext.SVGOperation))
        operation = new ol.ext.SVGOperation(operation);
      this.element.appendChild(operation.geElement());
    }
  }
  /** Add a grayscale operation
   * @param {number} value
   */
  grayscale(value) {
    this.addOperation({
      feoperation: 'feColorMatrix',
      type: 'saturate',
      values: value || 0
    });
  }
  /** Add a luminanceToAlpha operation
   * @param {*} options
   *  @param {number} options.gamma enhance gamma, default 0
   */
  luminanceToAlpha(options) {
    options = options || {};
    this.addOperation({
      feoperation: 'feColorMatrix',
      type: 'luminanceToAlpha'
    });
    if (options.gamma) {
      this.addOperation({
        feoperation: 'feComponentTransfer',
        operations: [{
          feoperation: 'feFuncA',
          type: 'gamma',
          amplitude: options.gamma,
          exponent: 1,
          offset: 0
        }]
      });
    }
  }
  applyTo(img) {
    var canvas = document.createElement('CANVAS');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    canvas.getContext('2d').filter = 'url(#' + this.getId() + ')';
    canvas.getContext('2d').drawImage(img, 0, 0);
    return canvas;
  }
}
ol.ext.SVGFilter.prototype.NS = 'http://www.w3.org/2000/svg';
ol.ext.SVGFilter.prototype.svg = null;
ol.ext.SVGFilter.prototype._id = 0;
