/*	Copyright (c) 2019 Jean-Marc VIGLINO,
  released under the CeCILL-B license (French BSD license)
  (http://www.cecill.info/licences/Licence_CeCILL-B_V1-en.txt).
*/
/** A source for grid binning
 * @constructor
 * @extends {ol.source.Vector}
 * @param {Object} options ol.source.VectorOptions + grid option
 *  @param {ol.source.Vector} options.source Source
 *  @param {number} [options.size] size of the grid in meter, default 200m
 *  @param {boolean} [options.circle=false] use a circle shape
 *  @param {function} [options.geometryFunction] Function that takes an ol.Feature as argument and returns an ol.geom.Point as feature's center.
 *  @param {function} [options.flatAttributes] Function takes a bin and the features it contains and aggragate the features in the bin attributes when saving
 */
ol.source.GridBin = class olsourceGridBin extends ol.source.BinBase {
  constructor(options) {
    options = options || {};
    super(options);
    this.set('gridProjection', options.gridProjection || 'EPSG:4326');
    this.setSize(options.size || 1);
    this.setCircle(options.circle || false);
    this.reset();
  }
  /** Set grid projection
   * @param {ol.ProjectionLike} proj
   */
  setGridProjection(proj) {
    this.set('gridProjection', proj);
    this.reset();
  }
  /** Set grid size
   * @param {number} size
   */
  setSize(size) {
    this.set('size', size);
    this.reset();
  }
  /** Set geometry shape as circle
   * @param {boolean} b
   */
  setCircle(b) {
    this.set('circle', b);
    this.reset();
  }
  /** Get the grid geometry at the coord
   * @param {ol.Coordinate} coord
   * @returns {ol.geom.Polygon}
   * @api
   */
  getGridGeomAt(coord) {
    coord = ol.proj.transform(coord, this.getProjection() || 'EPSG:3857', this.get('gridProjection'));
    var size = this.get('size');
    var x = size * Math.floor(coord[0] / size);
    var y = size * Math.floor(coord[1] / size);
    var geom;
    if (this.get('circle')) {
      geom = new ol.geom.Circle([x+size/2, y+size/2], size/2)
      geom = ol.geom.Polygon.fromCircle(geom);
    } else {
      geom = new ol.geom.Polygon([[[x, y], [x + size, y], [x + size, y + size], [x, y + size], [x, y]]]);
    }
    return geom.transform(this.get('gridProjection'), this.getProjection() || 'EPSG:3857');
  }
}
