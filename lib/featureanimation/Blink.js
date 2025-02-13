/*
  Copyright (c) 2016 Jean-Marc VIGLINO, 
  released under the CeCILL license (http://www.cecill.info/).
*/
/** Blink a feature
 * @constructor
 * @extends {ol.featureAnimation}
 * @param {ol.featureAnimationOptions} options
 *  @param {Number} options.nb number of blink, default 10
 */
ol.featureAnimation.Blink = class olfeatureAnimationBlink extends ol.featureAnimation {
  constructor(options) {
    super(options);
    this.set('nb', options.nb || 10);
  }
  /** Animate: Show or hide feature depending on the laptimes
  * @param {ol.featureAnimationEvent} e
  */
  animate(e) {
    if (!(Math.round(this.easing_(e.elapsed) * this.get('nb')) % 2)) {
      this.drawGeom_(e, e.geom);
    }
    return (e.time <= this.duration_);
  }
}
