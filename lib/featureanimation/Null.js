/*
  Copyright (c) 2016 Jean-Marc VIGLINO, 
  released under the CeCILL license (http://www.cecill.info/).
*/
/** Do nothing 
 * @constructor
 * @extends {ol.featureAnimation}
 */
ol.featureAnimation.Null = class olfeatureAnimationNull extends ol.featureAnimation {
	constructor() {
    super({ duration:0 });
  }
};
