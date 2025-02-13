// eslint-disable-next-line no-unused-vars
/** Create a legend for styles
 * @constructor
 * @extends {ol.control.CanvasBase}
 * @fires select
 * @param {*} options
 *  @param {String} options.className class of the control
 *  @param {String} [options.title="legend"] control title
 *  @param {String} [options.emptyTitle="no legend"] control title when legend is empty
 *  @param {ol.legend.Legend} options.legend
 *  @param {boolean | undefined} options.collapsed Specify if legend should be collapsed at startup. Default is true.
 *  @param {boolean | undefined} options.collapsible Specify if legend can be collapsed, default true.
 *  @param {Element | string | undefined} options.target Specify a target if you want the control to be rendered outside of the map's viewport.
 */
ol.control.Legend = class olcontrolLegend extends ol.control.CanvasBase {
  constructor(options) {
    options = options || {};
    var element = document.createElement('div');
    super({
      element: element,
      target: options.target
    });
    if (options.target) {
      element.className = options.className || 'ol-legend';
    } else {
      element.className = (options.className || 'ol-legend')
        + ' ol-unselectable ol-control'
        + (options.collapsible === false ? ' ol-uncollapsible' : ' ol-collapsed');
      // Show on click
      var button = document.createElement('button');
      button.setAttribute('type', 'button');
      button.addEventListener('click', function () {
        this.toggle();
      }.bind(this));
      element.appendChild(button);
      // Hide on click
      button = document.createElement('button');
      button.setAttribute('type', 'button');
      button.className = 'ol-closebox';
      button.addEventListener('click', function () {
        this.toggle();
      }.bind(this));
      element.appendChild(button);
    }
    // The legend
    this._legend = options.legend;
    this._legend.getCanvas().className = 'ol-legendImg';
    // Legend element
    element.appendChild(this._legend.getCanvas());
    element.appendChild(this._legend.getListElement());
    if (options.collapsible !== false && options.collapsed === false) {
      this.show();
    }
    // Select item on legend
    this._legend.on('select', function (e) {
      this.dispatchEvent(e);
    }.bind(this));
    // Refresh legend
    this._legend.on('refresh', function () {
      if (this._onCanvas && this.getMap()) {
        try { this.getMap().renderSync(); } catch (e) { /* ok */ }
      }
    }.bind(this));
    // Legend has items
    this._legend.on('items', function (e) {
      if (e.nb) {
        this.element.classList.remove('ol-empty');
        this.element.title = options.title || 'legend';
      } else {
        this.element.classList.add('ol-empty');
        this.element.title = options.emptyTitle || 'no legend';
      }
      this.dispatchEvent(e)
    }.bind(this));
  }
  /** Get the legend associated with the control
   * @returns {ol.legend.Legend}
   */
  getLegend() {
    return this._legend;
  }
  /** Draw control on canvas
   * @param {boolean} b draw on canvas.
   */
  setCanvas(b) {
    this._onCanvas = b;
    this.element.style.visibility = b ? "hidden" : "visible";
    if (this.getMap()) {
      try { this.getMap().renderSync(); } catch (e) { /* ok */ }
    }
  }
  /** Is control on canvas
   * @returns {boolean}
   */
  onCanvas() {
    return !!this._onCanvas;
  }
  /** Draw legend on canvas
   * @private
   */
  _draw(e) {
    if (this._onCanvas && !this.element.classList.contains('ol-collapsed')) {
      var canvas = this._legend.getCanvas();
      var ctx = this.getContext(e);
      var h = ctx.canvas.height - canvas.height;
      ctx.save();
      ctx.rect(0, h, canvas.width, canvas.height);
      var col = '#fff';
      if (this._legend.getTextStyle().getBackgroundFill()) {
        col = ol.color.asString(this._legend.getTextStyle().getBackgroundFill().getColor());
      }
      ctx.fillStyle = ctx.strokeStyle = col;
      ctx.lineWidth = 10;
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.clearRect(0, h, canvas.width, canvas.height);
      ctx.fill();
      ctx.drawImage(canvas, 0, h);
      ctx.restore();
    }
  }
  /** Show control
   */
  show() {
    if (this.element.classList.contains('ol-collapsed')) {
      this.element.classList.remove('ol-collapsed');
      this.dispatchEvent({ type: 'change:collapse', collapsed: false });
      if (this.getMap()) {
        try { this.getMap().renderSync(); } catch (e) { /* ok */ }
      }
    }
  }
  /** Hide control
   */
  hide() {
    if (!this.element.classList.contains('ol-collapsed')) {
      this.element.classList.add('ol-collapsed');
      this.dispatchEvent({ type: 'change:collapse', collapsed: true });
      if (this.getMap()) {
        try { this.getMap().renderSync(); } catch (e) { /* ok */ }
      }
    }
  }
  /** Show/hide control
   * @returns {boolean}
   */
  collapse(b) {
    if (b === false)
      this.show();
    else
      this.hide();
  }
  /** Is control collapsed
   * @returns {boolean}
   */
  isCollapsed() {
    return (this.element.classList.contains('ol-collapsed'));
  }
  /** Toggle control
   */
  toggle() {
    this.element.classList.toggle('ol-collapsed');
    this.dispatchEvent({ type: 'change:collapse', collapsed: this.element.classList.contains('ol-collapsed') });
    if (this.getMap()) {
      try { this.getMap().renderSync(); } catch (e) { /* ok */ }
    }
  }
}
