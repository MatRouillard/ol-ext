/*
  Copyright (c) 2015 Jean-Marc VIGLINO,
  released under the CeCILL-B license (http://www.cecill.info/).
  ol.layer.AnimatedCluster is a vector layer that animate cluster
*/
/**
 *  A vector layer for animated cluster
 * @constructor 
 * @extends {ol.layer.Vector}
 * @param {olx.layer.AnimatedClusterOptions=} options extend olx.layer.Options
 *  @param {Number} options.animationDuration animation duration in ms, default is 700ms 
 *  @param {ol.easingFunction} animationMethod easing method to use, default ol.easing.easeOut
 */
ol.layer.AnimatedCluster = class ollayerAnimatedCluster extends ol.layer.Vector {
  constructor(opt_options) {
    var options = opt_options || {}
    super(options)
    this.oldcluster = new ol.source.Vector()
    this.clusters = []
    this.animation = { start: false }
    this.set('animationDuration', typeof (options.animationDuration) == 'number' ? options.animationDuration : 700)
    this.set('animationMethod', options.animationMethod || ol.easing.easeOut)
    // Animate the cluster
    this.on(['precompose', 'prerender'], this.animate.bind(this))
    this.on(['postcompose', 'postrender'], this.postanimate.bind(this))
  }
  /** Set the cluster source
   * @param {ol.source.Vector} source
   */
  setSource(source) {
    if (!this._saveClusterFn) this._saveClusterFn = this.saveCluster.bind(this)
    // Save cluster before change
    if (this.getSource()) this.getSource().un('change', this._saveClusterFn)
    ol.layer.Vector.prototype.setSource.call(this, source)
    if (this.getSource()) this.getSource().on('change', this._saveClusterFn)
  }
  /** save cluster features before change
   * @private
   */
  saveCluster() {
    if (this.oldcluster) {
      this.oldcluster.clear()
      if (!this.get('animationDuration'))
        return
      var features = this.getSource().getFeatures()
      if (features.length && features[0].get('features')) {
        this.oldcluster.addFeatures(this.clusters)
        this.clusters = features.slice(0)
        this.sourceChanged = true
      }
    }
  }
  /**
   * Get the cluster that contains a feature
   * @private
  */
  getClusterForFeature(f, cluster) {
    for (var j = 0, c; c = cluster[j]; j++) {
      var features = c.get('features')
      if (features && features.length) {
        for (var k = 0, f2; f2 = features[k]; k++) {
          if (f === f2) {
            return c
          }
        }
      }
    }
    return false
  }
  /**
   * Stop animation
   * @private
   */
  stopAnimation() {
    this.animation.start = false
    this.animation.cA = []
    this.animation.cB = []
  }
  /**
   * animate the cluster
   * @private
   */
  animate(e) {
    var duration = this.get('animationDuration')
    if (!duration)
      return
    var resolution = e.frameState.viewState.resolution
    // var ratio = e.frameState.pixelRatio;
    var i, c0, a = this.animation
    var time = e.frameState.time
    // Start a new animation, if change resolution and source has changed
    if (a.resolution != resolution && this.sourceChanged) {
      var extent = e.frameState.extent
      if (a.resolution < resolution) {
        extent = ol.extent.buffer(extent, 100 * resolution)
        a.cA = this.oldcluster.getFeaturesInExtent(extent)
        a.cB = this.getSource().getFeaturesInExtent(extent)
        a.revers = false
      } else {
        extent = ol.extent.buffer(extent, 100 * resolution)
        a.cA = this.getSource().getFeaturesInExtent(extent)
        a.cB = this.oldcluster.getFeaturesInExtent(extent)
        a.revers = true
      }
      a.clusters = []
      for (i = 0, c0; c0 = a.cA[i]; i++) {
        var f = c0.get('features')
        if (f && f.length) {
          var c = this.getClusterForFeature(f[0], a.cB)
          if (c)
            a.clusters.push({ f: c0, pt: c.getGeometry().getCoordinates() })
        }
      }
      // Save state
      a.resolution = resolution
      this.sourceChanged = false
      // No cluster or too much to animate
      if (!a.clusters.length || a.clusters.length > 1000) {
        this.stopAnimation()
        return
      }
      // Start animation from now
      time = a.start = (new Date()).getTime()
    }
    // Run animation
    if (a.start) {
      var vectorContext = e.vectorContext || ol.render.getVectorContext(e)
      var d = (time - a.start) / duration
      // Animation ends
      if (d > 1.0) {
        this.stopAnimation()
        d = 1
      }
      d = this.get('animationMethod')(d)
      // Animate
      var style = this.getStyle()
      var stylefn = (typeof (style) == 'function') ? style : style.length ? function () { return style } : function () { return [style] }
      // Layer opacity
      e.context.save()
      e.context.globalAlpha = this.getOpacity()
      for (i = 0, c; c = a.clusters[i]; i++) {
        var pt = c.f.getGeometry().getCoordinates()
        var dx = pt[0] - c.pt[0]
        var dy = pt[1] - c.pt[1]
        if (a.revers) {
          pt[0] = c.pt[0] + d * dx
          pt[1] = c.pt[1] + d * dy
        } else {
          pt[0] = pt[0] - d * dx
          pt[1] = pt[1] - d * dy
        }
        // Draw feature
        var st = stylefn(c.f, resolution, true)
        if (!st.length)
          st = [st]
        // If one feature: draw the feature
        if (c.f.get("features").length === 1 && !dx && !dy) {
          f = c.f.get("features")[0]
        }
        // else draw a point
        else {
          var geo = new ol.geom.Point(pt)
          f = new ol.Feature(geo)
        }
        for (var k = 0, s; s = st[k]; k++) {
          // Multi-line text
          if (s.getText() && /\n/.test(s.getText().getText())) {
            var offsetX = s.getText().getOffsetX()
            var offsetY = s.getText().getOffsetY()
            var rot = s.getText().getRotation() || 0
            var fontSize = Number((s.getText().getFont() || '10px').match(/\d+/)) * 1.2
            var str = s.getText().getText().split('\n')
            var dl, nb = str.length - 1
            var s2 = s.clone()
            // Draw each lines
            str.forEach(function (t, i) {
              if (i == 1) {
                // Allready drawn
                s2.setImage()
                s2.setFill()
                s2.setStroke()
              }
              switch (s.getText().getTextBaseline()) {
                case 'alphabetic':
                case 'ideographic':
                case 'bottom': {
                  dl = nb
                  break
                }
                case 'hanging':
                case 'top': {
                  dl = 0
                  break
                }
                default: {
                  dl = nb / 2
                  break
                }
              }
              s2.getText().setOffsetX(offsetX - Math.sin(rot) * fontSize * (i - dl))
              s2.getText().setOffsetY(offsetY + Math.cos(rot) * fontSize * (i - dl))
              s2.getText().setText(t)
              vectorContext.drawFeature(f, ol.ext.getVectorContextStyle(e, s2))
            })
          } else {
            vectorContext.drawFeature(f, ol.ext.getVectorContextStyle(e, s))
          }
          /* OLD VERSION OL < 4.3
          // Retina device
          var ratio = e.frameState.pixelRatio;
          var sc;
          // OL < v4.3 : setImageStyle doesn't check retina
          var imgs = ol.Map.prototype.getFeaturesAtPixel ? false : s.getImage();
          if (imgs)
          {	sc = imgs.getScale();
            imgs.setScale(sc*ratio);
          }
          // OL3 > v3.14
          if (vectorContext.setStyle)
          {	// If one feature: draw the feature
            if (c.f.get("features").length===1 && !dx && !dy) {
              vectorContext.drawFeature(c.f.get("features")[0], s);
            }
            // else draw a point
            else {
              vectorContext.setStyle(s);
              vectorContext.drawGeometry(geo);
            }
          }
          // older version
          else
          {	vectorContext.setImageStyle(imgs);
            vectorContext.setTextStyle(s.getText());
            vectorContext.drawPointGeometry(geo);
          }
          if (imgs) imgs.setScale(sc);
          */
        }
      }
      e.context.restore()
      // tell ol to continue postcompose animation
      e.frameState.animate = true
      // Prevent layer drawing (clip with null rect)
      e.context.save()
      e.context.beginPath()
      e.context.rect(0, 0, 0, 0)
      e.context.clip()
      this.clip_ = true
    }
    return
  }
  /**
   * remove clipping after the layer is drawn
   * @private
   */
  postanimate(e) {
    if (this.clip_) {
      e.context.restore()
      this.clip_ = false
    }
  }
}
