/*
  Copyright (c) 2016 Jean-Marc VIGLINO, 
  released under the CeCILL license (http://www.cecill.info/).
*/
/** Show an object for a given duration
 * @constructor
 * @extends {ol.featureAnimation}
 * @param {ol.featureAnimationOptions} options
 */
ol.featureAnimation.Show = class olfeatureAnimationShow extends ol.featureAnimation {
  constructor(options) {
    super(options);
  }
  /** Animate: just show the object during the laps time
  * @param {ol.featureAnimationEvent} e
  */
  animate(e) {
    this.drawGeom_(e, e.geom);
    return (e.time <= this.duration_);
  }
}
