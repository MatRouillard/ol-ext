/*
	Copyright (c) 2016 Jean-Marc VIGLINO, 
	released under the CeCILL license (http://www.cecill.info/).
*/
/** Fade animation: feature fade in
 * @constructor
 * @extends {ol.featureAnimation}
 * @param {ol.featureAnimationOptions} options
 */
ol.featureAnimation.Fade = class olfeatureAnimationFade extends ol.featureAnimation {
	constructor(options) {
		options = options || {};
		super(options);
		this.speed_ = options.speed || 0;
	}
	/** Animate
	* @param {ol.featureAnimationEvent} e
	*/
	animate(e) {
		e.context.globalAlpha = this.easing_(e.elapsed);
		this.drawGeom_(e, e.geom);
		return (e.time <= this.duration_);
	}
}
