/*	Copyright (c) 2015 Jean-Marc VIGLINO, 
  released under the CeCILL-B license (French BSD license)
  (http://www.cecill.info/licences/Licence_CeCILL-B_V1-en.txt).
  @classdesc
  ol.source.DBPedia is a DBPedia layer source that load DBPedia located content in a vector layer.
  olx.source.DBPedia: olx.source.Vector {
    url: {string} Url for DBPedia SPARQL 
  }
  Inherits from:
  <ol.source.Vector>
*/
/**
* @constructor ol.source.DBPedia
* @extends {ol.source.Vector}
* @param {olx.source.DBPedia=} opt_options
*/
ol.source.DBPedia = class olsourceDBPedia extends ol.source.Vector {
  constructor(opt_options) {
    var options = opt_options || {}
    /** Default attribution */
    if (!options.attributions) options.attributions = [ '&copy; <a href="https://dbpedia.org/"">DBpedia</a> CC-by-SA']
    // Bbox strategy : reload at each move
    if (!options.strategy) options.strategy = ol.loadingstrategy.bbox
    super(options)
    this.setLoader(this._loaderFn)
    /** Url for DBPedia SPARQL */
    this._url = options.url || 'https://fr.dbpedia.org/sparql'
    /** Max resolution to load features  */
    this._maxResolution = options.maxResolution || 100
    /** Result language */
    this._lang = options.lang || "fr"
    /** Query limit */
    this._limit = options.limit || 1000
  }
  /** Decode RDF attributes and choose to add feature to the layer
  * @param {feature} the feature
  * @param {attributes} RDF attributes
  * @param {lastfeature} last feature added (null if none)
  * @return {boolean} true: add the feature to the layer
  * @API stable
  */
  readFeature(feature, attributes, lastfeature) {
    // Copy RDF attributes values
    for (var i in attributes) {
      if (attributes[i].type === 'uri')
        attributes[i].value = encodeURI(attributes[i].value)
      feature.set(i, attributes[i].value)
    }
    // Prevent same feature with different type duplication
    if (lastfeature && lastfeature.get("subject") == attributes.subject.value) {
      // Kepp dbpedia.org type ?
      // if (bindings[i].type.match ("dbpedia.org") lastfeature.get("type") = bindings[i].type.value;
      // Concat types
      lastfeature.set("type", lastfeature.get("type") + "\n" + attributes.type.value)
      return false
    } else {
      return true
    }
  }
  /** Set RDF query subject, default: select label, thumbnail, abstract and type
  * @API stable
  */
  querySubject() {
    return "?subject rdfs:label ?label. "
      + "OPTIONAL {?subject dbo:thumbnail ?thumbnail}."
      + "OPTIONAL {?subject dbo:abstract ?abstract} . "
      + "OPTIONAL {?subject rdf:type ?type}"
  }
  /** Set RDF query filter, default: select language
  * @API stable
  */
  queryFilter() {
    return "lang(?label) = '" + this._lang + "' "
      + "&& lang(?abstract) = '" + this._lang + "'"
    // Filter on type 
    //+ "&& regex (?type, 'Monument|Sculpture|Museum', 'i')"
  }
  /** Loader function used to load features.
  * @private
  */
  _loaderFn(extent, resolution, projection) {
    if (resolution > this._maxResolution) return
    var self = this
    var bbox = ol.proj.transformExtent(extent, projection, "EPSG:4326")
    // SPARQL request: for more info @see http://fr.dbpedia.org/
    var query = "PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#> "
      + "SELECT DISTINCT * WHERE { "
      + "?subject geo:lat ?lat . "
      + "?subject geo:long ?long . "
      + this.querySubject() + " . "
      + "FILTER(" + this.queryFilter() + ") . "
      // Filter bbox
      + "FILTER(xsd:float(?lat) <= " + bbox[3] + " && " + bbox[1] + " <= xsd:float(?lat) "
      + "&& xsd:float(?long) <= " + bbox[2] + " && " + bbox[0] + " <= xsd:float(?long) "
      + ") . "
      + "} LIMIT " + this._limit
    // Ajax request to get the tile
    ol.ext.Ajax.get({
      url: this._url,
      data: { query: query, format: "json" },
      success: function (data) {
        var bindings = data.results.bindings
        var features = []
        var att, pt, feature, lastfeature = null
        for (var i in bindings) {
          att = bindings[i]
          pt = [Number(bindings[i].long.value), Number(bindings[i].lat.value)]
          feature = new ol.Feature(new ol.geom.Point(ol.proj.transform(pt, "EPSG:4326", projection)))
          if (self.readFeature(feature, att, lastfeature)) {
            features.push(feature)
            lastfeature = feature
          }
        }
        self.addFeatures(features)
      }
    })
  }
}
ol.style.clearDBPediaStyleCache;
ol.style.dbPediaStyleFunction; 
(function(){
// Style cache
var styleCache = {};
/** Reset the cache (when fonts are loaded)
*/
ol.style.clearDBPediaStyleCache = function() {
  styleCache = {};
}
/** Get a default style function for dbpedia
* @param {} options
* @param {string|function|undefined} options.glyph a glyph name or a function that takes a feature and return a glyph
* @param {number} options.radius radius of the symbol, default 8
* @param {ol.style.Fill} options.fill style for fill, default navy
* @param {ol.style.stroke} options.stroke style for stroke, default 2px white
* @param {string} options.prefix a prefix if many style used for the same type
*
* @require ol.style.FontSymbol and FontAwesome defs are required for dbPediaStyleFunction()
*/
ol.style.dbPediaStyleFunction = function(options) {
  if (!options) options={};
  // Get font function using dbPedia type
  var getFont;
  switch (typeof(options.glyph)) {
    case "function": getFont = options.glyph; break;
    case "string": getFont = function(){ return options.glyph; }; break;
    default: {
      getFont = function (f) {
        var type = f.get("type");
        if (type) {
          if (type.match("/Museum")) return "fa-camera";
          else if (type.match("/Monument")) return "fa-building";
          else if (type.match("/Sculpture")) return "fa-android";
          else if (type.match("/Religious")) return "fa-institution";
          else if (type.match("/Castle")) return "fa-key";
          else if (type.match("Water")) return "fa-tint";
          else if (type.match("Island")) return "fa-leaf";
          else if (type.match("/Event")) return "fa-heart";
          else if (type.match("/Artwork")) return "fa-asterisk";
          else if (type.match("/Stadium")) return "fa-futbol-o";
          else if (type.match("/Place")) return "fa-street-view";
        }
        return "fa-star";
      }
      break;
    }
  }
  // Default values
  var radius = options.radius || 8;
  var fill = options.fill || new ol.style.Fill({ color:"navy"});
  var stroke = options.stroke || new ol.style.Stroke({ color: "#fff", width: 2 });
  var prefix = options.prefix ? options.prefix+"_" : "";
  // Vector style function
  return function (feature) {
    var glyph = getFont(feature);
    var k = prefix + glyph;
    var style = styleCache[k];
    if (!style) {
      styleCache[k] = style = new ol.style.Style ({
        image: new ol.style.FontSymbol({
          glyph: glyph, 
          radius: radius, 
          fill: fill,
          stroke: stroke
        })
      });
    }
    return [style];
  }
};
})();
