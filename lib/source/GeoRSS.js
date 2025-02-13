/*	Copyright (c) 2019 Jean-Marc VIGLINO, 
  released under the CeCILL-B license (French BSD license)
  (http://www.cecill.info/licences/Licence_CeCILL-B_V1-en.txt).
*/
/** ol.source.GeoRSS is a source that load Wikimedia Commons content in a vector layer.
 * @constructor 
 * @extends {ol.source.Vector}
 * @param {*} options source options
 *  @param {string} options.url GeoRSS feed url
 */
ol.source.GeoRSS = class olsourceGeoRSS extends ol.source.Vector {
  constructor(options) {
    options = options || {};
    options.loader = function(extent, resolution, projection) {
      return this._loaderFn(extent, resolution, projection);
    } 
    super(options);
  }
  /** Loader function used to load features.
  * @private
  */
  _loaderFn(extent, resolution, projection) {
    // Ajax request to get source
    ol.ext.Ajax.get({
      url: this.getUrl(),
      dataType: 'XML',
      error: function () { console.log('oops'); },
      success: function (xml) {
        var features = (new ol.format.GeoRSS()).readFeatures(xml, { featureProjection: projection });
        this.addFeatures(features);
      }.bind(this)
    });
  }
}
