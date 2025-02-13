ol.ext.olVersion = ol.util.VERSION.split('.');
ol.ext.olVersion = parseInt(ol.ext.olVersion[0])*100 + parseInt(ol.ext.olVersion[1]);
/** Get style to use in a VectorContext
 * @param {} e
 * @param {ol.style.Style} s
 * @return {ol.style.Style}
 */
ol.ext.getVectorContextStyle = function(e, s) {
  var ratio = e.frameState.pixelRatio;
  // Bug with Icon images
  if (ol.ext.olVersion > 605 
    && ol.ext.olVersion < 700 
    && ratio !== 1 
    && (s.getImage() instanceof ol.style.Icon)) {
    s = s.clone();
    var img = s.getImage();
    img.setScale(img.getScale()*ratio);
    /* BUG anchor don't use ratio */
    var anchor = img.getAnchor();
    if (anchor && img.setDisplacement) {
      var disp = img.getDisplacement();
      if (disp) {
        disp[0] -= anchor[0]/ratio;
        disp[1] += anchor[1]/ratio;
        img.setAnchor([0,0]);
      }
    } else {
      if (anchor) {
        anchor[0] /= ratio;
        anchor[1] /= ratio;
      }
    }
    /**/
  }
  return s;
}
