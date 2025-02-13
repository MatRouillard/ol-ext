/*
	Copyright (c) 2016 Jean-Marc VIGLINO, 
	released under the CeCILL license (http://www.cecill.info/).
*/
/** Drop animation: drop a feature on the map
 * @constructor
 * @extends {ol.featureAnimation}
 * @param {ol.featureAnimationDropOptions} options
 *  @param {Number} options.speed speed of the feature if 0 the duration parameter will be used instead, default 0
 *  @param {Number} options.side top or bottom, default top
 */
ol.featureAnimation.Drop = class olfeatureAnimationDrop extends ol.featureAnimation {
	constructor(options) {
		options = options || {};
		super(options);
		this.speed_ = options.speed || 0;
		this.side_ = options.side || 'top';
	}
	/** Animate
	* @param {ol.featureAnimationEvent} e
	*/
	animate(e) {
		if (!e.time) {
			var angle = e.frameState.viewState.rotation;
			var s = e.frameState.size[1] * e.frameState.viewState.resolution;
			if (this.side_ != 'top') s *= -1;
			this.dx = -Math.sin(angle) * s;
			this.dy = Math.cos(angle) * s;
			if (this.speed_) {
				this.duration_ = s / this.speed_ / e.frameState.viewState.resolution;
			}
		}
		// Animate
		var flashGeom = e.geom.clone();
		flashGeom.translate(
			this.dx * (1 - this.easing_(e.elapsed)),
			this.dy * (1 - this.easing_(e.elapsed))
		);
		this.drawGeom_(e, flashGeom, e.geom);
		return (e.time <= this.duration_);
	}
}
