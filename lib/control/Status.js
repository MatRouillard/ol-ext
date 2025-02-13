/** A control to display status information on top of the map
 * @constructor
 * @extends {ol.control.Control}
 * @param {Object=} options Control options.
 *	@param {String} options.className class of the control
 *  @param {string} options.status status, default none
 *  @param {string} options.position position of the status 'top', 'left', 'bottom' or 'right', default top
 *  @param {boolean} options.visible default true
 */
ol.control.Status = class olcontrolStatus extends ol.control.Control {
  constructor(options) {
    options = options || {};
    // New element
    var element = ol.ext.element.create('DIV', {
      className: (options.className || '') + ' ol-status'
        + (options.target ? '' : ' ol-unselectable ol-control')
    });
    // Initialize
    super({
      element: element,
      target: options.target
    });
    this.setVisible(options.visible !== false);
    if (options.position)
      this.setPosition(options.position);
    this.status(options.status || '');
  }
  /** Set visiblitity
   * @param {boolean} visible
   */
  setVisible(visible) {
    if (visible)
      this.element.classList.add('ol-visible');
    else
      this.element.classList.remove('ol-visible');
  }
  /** Show status on the map
   * @param {string|Element} html status text or DOM element
   */
  status(html) {
    var s = html || '';
    if (s) {
      ol.ext.element.show(this.element);
      if (s instanceof Element || typeof (s) === 'string') {
        ol.ext.element.setHTML(this.element, s);
      } else {
        s = '';
        for (var i in html) {
          s += '<label>' + i + ':</label> ' + html[i] + '<br/>';
        }
      }
      ol.ext.element.setHTML(this.element, s);
    } else {
      ol.ext.element.hide(this.element);
    }
  }
  /** Set status position
   * @param {string} position position of the status 'top', 'left', 'bottom' or 'right', default top
   */
  setPosition(position) {
    this.element.classList.remove('ol-left');
    this.element.classList.remove('ol-right');
    this.element.classList.remove('ol-bottom');
    this.element.classList.remove('ol-center');
    if (/^left$|^right$|^bottom$|^center$/.test(position)) {
      this.element.classList.add('ol-' + position);
    }
  }
  /** Show the status
   * @param {boolean} show show or hide the control, default true
   */
  show(show) {
    if (show === false)
      ol.ext.element.hide(this.element);
    else
      ol.ext.element.show(this.element);
  }
  /** Hide the status
   */
  hide() {
    ol.ext.element.hide(this.element);
  }
  /** Toggle the status
   */
  toggle() {
    ol.ext.element.toggle(this.element);
  }
  /** Is status visible
   */
  isShown() {
    return this.element.style.display === 'none';
  }
}
