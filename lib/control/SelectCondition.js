/*	Copyright (c) 2019 Jean-Marc VIGLINO,
  released under the CeCILL-B license (French BSD license)
  (http://www.cecill.info/licences/Licence_CeCILL-B_V1-en.txt).
*/
/**
 * Select features by property using a condition 
 *
 * @constructor
 * @extends {ol.control.SelectBase}
 * @fires select
 * @param {Object=} options
 *  @param {string} options.className control class name
 *  @param {Element | undefined} options.target Specify a target if you want the control to be rendered outside of the map's viewport.
 *  @param {ol/source/Vector | Array<ol/source/Vector>} options.source the source to search in
 *  @param {string} options.label control label, default 'condition'
 *  @param {number} options.selectAll select all features if no option selected
 *  @param {condition|Array<condition>} options.condition conditions 
 *  @param {function|undefined} options.onchoice function triggered when an option is clicked, default doSelect
 */
ol.control.SelectCondition = class olcontrolSelectCondition extends ol.control.SelectBase {
  constructor(options) {
    options = options || {};
    // Container
    var div = options.content = ol.ext.element.create('DIV');
    options.className = options.className || 'ol-select-condition';
    super(options);
    var bt = div.querySelector('button');
    this._check = ol.ext.element.createSwitch({
      after: options.label || 'condition',
      change: function () {
        if (this._onchoice)
          this._onchoice();
        else
          this.doSelect();
      }.bind(this),
      parent: div
    });
    // Input div
    this._input = ol.ext.element.create('DIV', {
      parent: div
    });
    // Add ok button at the end
    div.appendChild(bt);
    this.setCondition(options.condition);
    this._selectAll = options.selectAll;
    this._onchoice = options.onchoice;
  }
  /** Set condition to select on
   * @param {condition | Array<condition>} condition
   *  @param {string} attr property to select on
   *  @param {string} op operator (=, !=, <; <=, >, >=, contain, !contain, regecp)
   *  @param {*} val value to select on
   */
  setCondition(condition) {
    if (!condition)
      this._conditions = [];
    else
      this._conditions = (condition instanceof Array ? condition : [condition]);
  }
  /** Add a condition to select on
   * @param {condition} condition
   *  @param {string} attr property to select on
   *  @param {string} op operator (=, !=, <; <=, >, >=, contain, !contain, regecp)
   *  @param {*} val value to select on
   */
  addCondition(condition) {
    this._conditions.push(condition);
  }
  /** Select features by condition
   */
  doSelect(options) {
    options = options || {};
    var conditions = this._conditions;
    if (!this._check.checked) {
      return super.doSelect({ features: options.features, matchAll: this._selectAll });
    } else {
      return super.doSelect({
        features: options.features,
        conditions: conditions
      });
    }
  }
}
