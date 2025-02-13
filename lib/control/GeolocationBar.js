/*	Copyright (c) 2016 Jean-Marc VIGLINO,
	released under the CeCILL-B license (French BSD license)
	(http://www.cecill.info/licences/Licence_CeCILL-B_V1-en.txt).
*/
/** Geolocation bar
 * The control bar is a container for other controls. It can be used to create toolbars.
 * Control bars can be nested and combined with ol.control.Toggle to handle activate/deactivate.
 *
 * @constructor
 * @extends {ol.control.Bar}
 * @param {Object=} options Control bar options.
 *  @param {String} options.className class of the control
 *  @param {String} options.centerLabel label for center button, default center
 *  @param {String} options.position position of the control, default bottom-right
 */
ol.control.GeolocationBar = class olcontrolGeolocationBar extends ol.control.Bar {
  constructor(options) {
    options = options || {}
    options.className = options.className || 'ol-geobar'
    super(options)
    this.setPosition(options.position || 'bottom-right')
    var element = this.element
    // Geolocation draw interaction
    var interaction = new ol.interaction.GeolocationDraw({
      source: options.source,
      zoom: options.zoom,
      minZoom: options.minZoom,
      tolerance: options.tolerance,
      followTrack: options.followTrack,
      minAccuracy: options.minAccuracy || 10000
    })
    this._geolocBt = new ol.control.Toggle({
      className: 'geolocBt',
      interaction: interaction,
      onToggle: function () {
        interaction.pause(true)
        interaction.setFollowTrack(options.followTrack)
        element.classList.remove('pauseTrack')
      }
    })
    this.addControl(this._geolocBt)
    this._geolocBt.setActive(false)
    // Buttons
    var bar = new ol.control.Bar()
    this.addControl(bar)
    var centerBt = new ol.control.TextButton({
      className: 'centerBt',
      html: options.centerLabel || 'center',
      handleClick: function () {
        interaction.setFollowTrack('auto')
      }
    })
    bar.addControl(centerBt)
    var startBt = new ol.control.Button({
      className: 'startBt',
      handleClick: function () {
        interaction.pause(false)
        interaction.setFollowTrack('auto')
        element.classList.add('pauseTrack')
      }
    })
    bar.addControl(startBt)
    var pauseBt = new ol.control.Button({
      className: 'pauseBt',
      handleClick: function () {
        interaction.pause(true)
        interaction.setFollowTrack('auto')
        element.classList.remove('pauseTrack')
      }
    })
    bar.addControl(pauseBt)
    interaction.on('follow', function (e) {
      if (e.following) {
        element.classList.remove('centerTrack')
      } else {
        element.classList.add('centerTrack')
      }
    })
    // Activate
    this._geolocBt.on('change:active', function (e) {
      if (e.active) {
        element.classList.add('ol-active')
      } else {
        element.classList.remove('ol-active')
      }
    })
  }
  /**
   * Remove the control from its current map and attach it to the new map.
   * Subclasses may set up event handlers to get notified about changes to
   * the map here.
   * @param {ol.Map} map Map.
   * @api stable
   */
  setMap(map) {
    if (this._listener) ol.Observable.unByKey(this._listener)
    this._listener = null
    super.setMap(map)
    // Get change (new layer added or removed)
    if (map) {
      this._listener = map.on('moveend', function () {
        var geo = this.getInteraction()
        if (geo.getActive() && geo.get('followTrack') === 'auto' && geo.path_.length) {
          if (geo.path_[geo.path_.length - 1][0] !== map.getView().getCenter()[0]) {
            this.element.classList.add('centerTrack')
          }
        }
      }.bind(this))
    }
  }
  /** Get the ol.interaction.GeolocationDraw associatedwith the bar
   * @return {ol.interaction.GeolocationDraw}
   */
  getInteraction() {
    return this._geolocBt.getInteraction()
  }
}
