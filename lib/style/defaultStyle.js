ol.style.Style.defaultStyle;
(function() {
// Style
var white = [255, 255, 255, 1];
var blue = [0, 153, 255, 1];
var width = 3;
var defaultEditStyle = [
  new ol.style.Style({
    stroke: new ol.style.Stroke({ color: white, width: width + 2 })
  }),
  new ol.style.Style({
    image: new ol.style.Circle({
      radius: width * 2,
      fill: new ol.style.Fill({ color: blue }),
      stroke: new ol.style.Stroke({ color: white, width: width / 2 })
    }),
    stroke: new ol.style.Stroke({ color: blue, width: width }),
    fill: new ol.style.Fill({
      color: [255, 255, 255, 0.5]
    })
  })
];
/**
 * Get the default style
 * @param {boolean|*} [edit] true to get editing style or a { color, fillColor } object, default get default blue style
 * @return {Array<ol.style.Style>}
 */
ol.style.Style.defaultStyle = function(edit) {
  if (edit===true) {
    return defaultEditStyle;
  } else {
    edit = edit || {};
    var fill = new ol.style.Fill({
      color: edit.fillColor || 'rgba(255,255,255,0.4)'
    });
    var stroke = new ol.style.Stroke({
      color: edit.color || '#3399CC',
      width: 1.25
    });
    var style = new ol.style.Style({
      image: new ol.style.Circle({
        fill: fill,
        stroke: stroke,
        radius: 5
      }),
      fill: fill,
      stroke: stroke
    });
    return [ style ];
  }
};
})();
