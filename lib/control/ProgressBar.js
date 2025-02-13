/*	Copyright (c) 2016 Jean-Marc VIGLINO,
  released under the CeCILL-B license (French BSD license)
  (http://www.cecill.info/licences/Licence_CeCILL-B_V1-en.txt).
*/
/** Add a progress bar to a map.
 * Use the layers option listen to tileload event and show the layer loading progress.
 * @constructor
 * @extends {ol.control.Control}
 * @param {Object=} options Control options.
 *  @param {String} [options.className] class of the control
 *  @param {String} [options.label] waiting label
 *  @param {ol.layer.Layer|Array<ol.layer.Layer>} [options.layers] tile layers with tileload events
 */
ol.control.ProgressBar = class olcontrolProgressBar extends ol.control.Control {
  constructor(options) {
    options = options || {}
    var element = ol.ext.element.create('DIV', {
      className: ((options.className || '') + ' ol-progress-bar ol-unselectable ol-control').trim()
    })
    super({
      element: element,
      target: options.target
    })
    this._waiting = ol.ext.element.create('DIV', {
      html: options.label || '',
      className: 'ol-waiting',
      parent: element
    })
    this._bar = ol.ext.element.create('DIV', {
      className: 'ol-bar',
      parent: element
    })
    this._layerlistener = []
    this.setLayers(options.layers)
  }
  /** Set the control visibility
   * @param {Number} [n] progress percentage, a number beetween 0,1, default hide progress bar
   */
  setPercent(n) {
    this._bar.style.width = ((Number(n) || 0) * 100) + '%'
    if (n === undefined) {
      ol.ext.element.hide(this.element)
    } else {
      ol.ext.element.show(this.element)
    }
  }
  /** Set waiting text
   * @param {string} label
   */
  setLabel(label) {
    this._waiting.innerHTML = label
  }
  /** Use a list of tile layer to shown tile load
   * @param {ol.layer.Layer|Array<ol.layer.Layer>} layers a layer or a list of layer
   */
  setLayers(layers) {
    // reset
    this._layerlistener.forEach(function (l) {
      ol.Observable.unByKey(l)
    })
    this._layerlistener = []
    this.setPercent()
    var loading = 0, loaded = 0
    if (layers instanceof ol.layer.Layer)
      layers = [layers]
    if (!layers || !layers.forEach)
      return
    var tout
    // Listeners
    layers.forEach(function (layer) {
      if (layer instanceof ol.layer.Layer) {
        this._layerlistener.push(layer.getSource().on('tileloadstart', function () {
          loading++
          this.setPercent(loaded / loading)
          clearTimeout(tout)
        }.bind(this)))
        this._layerlistener.push(layer.getSource().on(['tileloadend', 'tileloaderror'], function () {
          loaded++
          if (loaded === loading) {
            loading = loaded = 0
            this.setPercent(1)
            tout = setTimeout(this.setPercent.bind(this), 300)
          } else {
            this.setPercent(loaded / loading)
          }
        }.bind(this)))
      }
    }.bind(this))
  }
}
