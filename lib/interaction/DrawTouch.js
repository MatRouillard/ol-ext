/*	Copyright (c) 2016 Jean-Marc VIGLINO, 
  released under the CeCILL-B license (French BSD license)
  (http://www.cecill.info/licences/Licence_CeCILL-B_V1-en.txt).
*/
/** Interaction DrawTouch : pointer is deferred to the center of the viewport and a target is drawn to materialize this point
 * The interaction modifies map browser event coordinate and pixel properties to force pointer on the viewport center to any interaction that them.
 * @constructor
 * @fires drawstart
 * @fires drawend
 * @fires drawabort
 * @extends {ol.interaction.CenterTouch}
 * @param {olx.interaction.DrawOptions} options
 *  @param {ol.source.Vector | undefined} options.source Destination source for the drawn features.
 *  @param {ol.geom.GeometryType} options.type Drawing type ('Point', 'LineString', 'Polygon') not ('MultiPoint', 'MultiLineString', 'MultiPolygon' or 'Circle'). Required.
 *	@param {boolean} [options.tap=true] enable point insertion on tap, default true
 *  @param {ol.style.Style|Array<ol.style.Style>} [options.style] Drawing style
 *  @param {ol.style.Style|Array<ol.style.Style>} [options.sketchStyle] Sketch style
 *  @param {ol.style.Style|Array<ol.style.Style>} [options.targetStyle] a style to draw the target point, default cross style
 *  @param {string} [options.composite] composite operation : difference|multiply|xor|screen|overlay|darken|lighter|lighten|...
 */
ol.interaction.DrawTouch = class olinteractionDrawTouch extends ol.interaction.CenterTouch {
  constructor(options) {
    options = options || {};
    options.handleEvent = function (e) {
      if (this.get('tap')) {
        this.sketch.setPosition(this.getPosition());
        switch (e.type) {
          case 'singleclick': {
            this.addPoint();
            break;
          }
          case 'dblclick': {
            this.addPoint();
            this.finishDrawing();
            return false;
            //break;
          }
          default: break;
        }
      }
      return true;
    };
    super(options);
    if (!options.sketchStyle) {
      options.sketchStyle = ol.style.Style.defaultStyle();
    }
    var sketch = this.sketch = new ol.layer.SketchOverlay(options);
    sketch.on(['drawstart', 'drawabort'], function (e) { this.dispatchEvent(e); }.bind(this));
    sketch.on(['drawend'], function (e) {
      if (e.feature && e.valid && options.source)
        options.source.addFeature(e.feature);
      this.dispatchEvent(e);
    }.bind(this));
    this._source = options.source;
    this.set('tap', options.tap !== false);
    this.setActive(options.active !== false);
  }
  /**
   * Remove the interaction from its current map, if any,  and attach it to a new
   * map, if any. Pass `null` to just remove the interaction from the current map.
   * @param {ol.Map} map Map.
   * @api stable
   */
  setMap(map) {
    if (this._listener) {
      for (var l in this._listener) ol.Observable.unByKey(l);
    }
    this._listener = {};
    super.setMap(map);
    this.sketch.setMap(map);
    if (map) {
      this._listener.center = map.on('postcompose', function () {
        if (!ol.coordinate.equal(this.getPosition(), this.sketch.getPosition() || [])) {
          this.sketch.setPosition(this.getPosition());
        }
      }.bind(this));
    }
  }
  /** Set geometry type
   * @param {ol.geom.GeometryType} type
   */
  setGeometryType(type) {
    return this.sketch.setGeometryType(type);
  }
  /** Get geometry type
   * @return {ol.geom.GeometryType}
   */
  getGeometryType() {
    return this.sketch.getGeometryType();
  }
  /** Start drawing and add the sketch feature to the target layer.
   * The ol.interaction.Draw.EventType.DRAWEND event is dispatched before inserting the feature.
   */
  finishDrawing() {
    this.sketch.finishDrawing(true);
  }
  /** Add a new Point to the drawing
   */
  addPoint() {
    this.sketch.addPoint(this.getPosition());
  }
  /** Remove last point of the feature currently being drawn.
   */
  removeLastPoint() {
    this.sketch.removeLastPoint();
  }
  /**
   * Activate or deactivate the interaction.
   * @param {boolean} active Active.
   * @observable
   * @api
   */
  setActive(b) {
    super.setActive(b);
    if (this.sketch) {
      this.sketch.abortDrawing();
      this.sketch.setVisible(b);
    }
  }
}
