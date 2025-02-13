/*
	Copyright (c) 2016 Jean-Marc VIGLINO, 
	released under the CeCILL license (http://www.cecill.info/).
*/
/** Do nothing for a given duration
 * @constructor
 * @extends {ol.featureAnimation}
 * @param {ol.featureAnimationShowOptions} options
 * 
 */
ol.featureAnimation.None = class olfeatureAnimationNone extends ol.featureAnimation {
	constructor(options) {
		super(options);
	}
	/** Animate: do nothing during the laps time
	* @param {ol.featureAnimationEvent} e
	*/
	animate(e) {
		return (e.time <= this.duration_);
	}
}
