// Use ol.getUid for Openlayers < v6
/** Extent the ol/interaction/Modify with a getModifyFeatures
 * Get the features modified by the interaction
 * @return {Array<ol.Feature>} the modified features
 * @deprecated
 */
ol.interaction.Modify.prototype.getModifiedFeatures = function() {
  var featuresById = {};
  this.dragSegments_.forEach( function(s) {
    var feature = s[0].feature;
    // Openlayers > v.6
    if (window && window.ol && window.ol.util) featuresById[ol.util.getUid(feature)] = feature;
    // old version of Openlayers (< v.6) or ol all versions
    else featuresById[ol.getUid(feature)] = feature;
  });
  var features = [];
  for (var i in featuresById) features.push(featuresById[i]);
  return features;
};
