/** Control bar for editing in a layer
 * @constructor
 * @extends {ol.control.Bar}
 * @fires info
 * @param {Object=} options Control options.
 *	@param {String} options.className class of the control
 *	@param {String} options.target Specify a target if you want the control to be rendered outside of the map's viewport.
 *	@param {boolean} options.edition false to remove the edition tools, default true
 *	@param {Object} options.interactions List of interactions to add to the bar 
 *    ie. Select, Delete, Info, DrawPoint, DrawLine, DrawPolygon
 *    Each interaction can be an interaction or true (to get the default one) or false to remove it from bar
 *	@param {ol.source.Vector} options.source Source for the drawn features. 
 */
ol.control.EditBar = class olcontrolEditBar extends ol.control.Bar {
  constructor(options) {
    options = options || {}
    options.interactions = options.interactions || {}
    // New bar
    super({
      className: (options.className ? options.className + ' ' : '') + 'ol-editbar',
      toggleOne: true,
      target: options.target
    })
    this._source = options.source
    // Add buttons / interaction
    this._interactions = {}
    this._setSelectInteraction(options)
    if (options.edition !== false)
      this._setEditInteraction(options)
    this._setModifyInteraction(options)
  }
  /**
   * Set the map instance the control is associated with
   * and add its controls associated to this map.
   * @param {_ol_Map_} map The map instance.
   */
  setMap(map) {
    if (this.getMap()) {
      if (this._interactions.Delete)
        this.getMap().removeInteraction(this._interactions.Delete)
      if (this._interactions.ModifySelect)
        this.getMap().removeInteraction(this._interactions.ModifySelect)
    }
    super.setMap(map)
    if (this.getMap()) {
      if (this._interactions.Delete)
        this.getMap().addInteraction(this._interactions.Delete)
      if (this._interactions.ModifySelect)
        this.getMap().addInteraction(this._interactions.ModifySelect)
    }
  }
  /** Get an interaction associated with the bar
   * @param {string} name
   */
  getInteraction(name) {
    return this._interactions[name]
  }
  /** Get the option title */
  _getTitle(option) {
    if (option) {
      if (option.get)
        return option.get('title')
      else if (typeof (option) === 'string')
        return option
      else
        return option.title
    }
  }
  /** Add selection tool:
   * 1. a toggle control with a select interaction
   * 2. an option bar to delete / get information on the selected feature
   * @private
   */
  _setSelectInteraction(options) {
    var self = this
    // Sub bar
    var sbar = new ol.control.Bar()
    var selectCtrl
    // Delete button
    if (options.interactions.Delete !== false) {
      if (options.interactions.Delete instanceof ol.interaction.Delete) {
        this._interactions.Delete = options.interactions.Delete
      } else {
        this._interactions.Delete = new ol.interaction.Delete()
      }
      var del = this._interactions.Delete
      del.setActive(false)
      if (this.getMap())
        this.getMap().addInteraction(del)
      sbar.addControl(new ol.control.Button({
        className: 'ol-delete',
        title: this._getTitle(options.interactions.Delete) || "Delete",
        name: 'Delete',
        handleClick: function (e) {
          // Delete selection
          del.delete(selectCtrl.getInteraction().getFeatures())
          var evt = {
            type: 'select',
            selected: [],
            deselected: selectCtrl.getInteraction().getFeatures().getArray().slice(),
            mapBrowserEvent: e.mapBrowserEvent
          }
          selectCtrl.getInteraction().getFeatures().clear()
          selectCtrl.getInteraction().dispatchEvent(evt)
        }
      }))
    }
    // Info button
    if (options.interactions.Info !== false) {
      sbar.addControl(new ol.control.Button({
        className: 'ol-info',
        name: 'Info',
        title: this._getTitle(options.interactions.Info) || "Show informations",
        handleClick: function () {
          self.dispatchEvent({
            type: 'info',
            features: selectCtrl.getInteraction().getFeatures()
          })
        }
      }))
    }
    // Select button
    if (options.interactions.Select !== false) {
      if (options.interactions.Select instanceof ol.interaction.Select) {
        this._interactions.Select = options.interactions.Select
      } else {
        this._interactions.Select = new ol.interaction.Select({
          condition: ol.events.condition.click
        })
      }
      var sel = this._interactions.Select
      selectCtrl = new ol.control.Toggle({
        className: 'ol-selection',
        name: 'Select',
        title: this._getTitle(options.interactions.Select) || "Select",
        interaction: sel,
        bar: sbar.getControls().length ? sbar : undefined,
        autoActivate: true,
        active: true
      })
      this.addControl(selectCtrl)
      sel.on('change:active', function () {
        if (!sel.getActive())
          sel.getFeatures().clear()
      })
    }
  }
  /** Add editing tools
   * @private
   */
  _setEditInteraction(options) {
    if (options.interactions.DrawPoint !== false) {
      if (options.interactions.DrawPoint instanceof ol.interaction.Draw) {
        this._interactions.DrawPoint = options.interactions.DrawPoint
      } else {
        this._interactions.DrawPoint = new ol.interaction.Draw({
          type: 'Point',
          source: this._source
        })
      }
      var pedit = new ol.control.Toggle({
        className: 'ol-drawpoint',
        name: 'DrawPoint',
        title: this._getTitle(options.interactions.DrawPoint) || 'Point',
        interaction: this._interactions.DrawPoint
      })
      this.addControl(pedit)
    }
    if (options.interactions.DrawLine !== false) {
      if (options.interactions.DrawLine instanceof ol.interaction.Draw) {
        this._interactions.DrawLine = options.interactions.DrawLine
      } else {
        this._interactions.DrawLine = new ol.interaction.Draw({
          type: 'LineString',
          source: this._source,
          // Count inserted points
          geometryFunction: function (coordinates, geometry) {
            if (geometry)
              geometry.setCoordinates(coordinates)
            else
              geometry = new ol.geom.LineString(coordinates)
            this.nbpts = geometry.getCoordinates().length
            return geometry
          }
        })
      }
      var ledit = new ol.control.Toggle({
        className: 'ol-drawline',
        title: this._getTitle(options.interactions.DrawLine) || 'LineString',
        name: 'DrawLine',
        interaction: this._interactions.DrawLine,
        // Options bar associated with the control
        bar: new ol.control.Bar({
          controls: [
            new ol.control.TextButton({
              html: this._getTitle(options.interactions.UndoDraw) || 'undo',
              title: this._getTitle(options.interactions.UndoDraw) || "delete last point",
              handleClick: function () {
                if (ledit.getInteraction().nbpts > 1)
                  ledit.getInteraction().removeLastPoint()
              }
            }),
            new ol.control.TextButton({
              html: this._getTitle(options.interactions.FinishDraw) || 'finish',
              title: this._getTitle(options.interactions.FinishDraw) || "finish",
              handleClick: function () {
                // Prevent null objects on finishDrawing
                if (ledit.getInteraction().nbpts > 2)
                  ledit.getInteraction().finishDrawing()
              }
            })
          ]
        })
      })
      this.addControl(ledit)
    }
    if (options.interactions.DrawPolygon !== false) {
      if (options.interactions.DrawPolygon instanceof ol.interaction.Draw) {
        this._interactions.DrawPolygon = options.interactions.DrawPolygon
      } else {
        this._interactions.DrawPolygon = new ol.interaction.Draw({
          type: 'Polygon',
          source: this._source,
          // Count inserted points
          geometryFunction: function (coordinates, geometry) {
            this.nbpts = coordinates[0].length
            if (geometry)
              geometry.setCoordinates([coordinates[0].concat([coordinates[0][0]])])
            else
              geometry = new ol.geom.Polygon(coordinates)
            return geometry
          }
        })
      }
      this._setDrawPolygon(
        'ol-drawpolygon',
        this._interactions.DrawPolygon,
        this._getTitle(options.interactions.DrawPolygon) || 'Polygon',
        'DrawPolygon',
        options
      )
    }
    // Draw hole
    if (options.interactions.DrawHole !== false) {
      if (options.interactions.DrawHole instanceof ol.interaction.DrawHole) {
        this._interactions.DrawHole = options.interactions.DrawHole
      } else {
        this._interactions.DrawHole = new ol.interaction.DrawHole()
      }
      this._setDrawPolygon(
        'ol-drawhole',
        this._interactions.DrawHole,
        this._getTitle(options.interactions.DrawHole) || 'Hole',
        'DrawHole',
        options
      )
    }
    // Draw regular
    if (options.interactions.DrawRegular !== false) {
      var label = { pts: 'pts', circle: 'circle' }
      if (options.interactions.DrawRegular instanceof ol.interaction.DrawRegular) {
        this._interactions.DrawRegular = options.interactions.DrawRegular
        label.pts = this._interactions.DrawRegular.get('ptsLabel') || label.pts
        label.circle = this._interactions.DrawRegular.get('circleLabel') || label.circle
      } else {
        this._interactions.DrawRegular = new ol.interaction.DrawRegular({
          source: this._source,
          sides: 4
        })
        if (options.interactions.DrawRegular) {
          label.pts = options.interactions.DrawRegular.ptsLabel || label.pts
          label.circle = options.interactions.DrawRegular.circleLabel || label.circle
        }
      }
      var regular = this._interactions.DrawRegular
      var div = document.createElement('DIV')
      var down = ol.ext.element.create('DIV', { parent: div })
      ol.ext.element.addListener(down, ['click', 'touchstart'], function () {
        var sides = regular.getSides() - 1
        if (sides < 2)
          sides = 2
        regular.setSides(sides)
        text.textContent = sides > 2 ? sides + ' ' + label.pts : label.circle
      }.bind(this))
      var text = ol.ext.element.create('TEXT', { html: '4 ' + label.pts, parent: div })
      var up = ol.ext.element.create('DIV', { parent: div })
      ol.ext.element.addListener(up, ['click', 'touchstart'], function () {
        var sides = regular.getSides() + 1
        if (sides < 3)
          sides = 3
        regular.setSides(sides)
        text.textContent = sides + ' ' + label.pts
      }.bind(this))
      var ctrl = new ol.control.Toggle({
        className: 'ol-drawregular',
        title: this._getTitle(options.interactions.DrawRegular) || 'Regular',
        name: 'DrawRegular',
        interaction: this._interactions.DrawRegular,
        // Options bar associated with the control
        bar: new ol.control.Bar({
          controls: [
            new ol.control.TextButton({
              html: div
            })
          ]
        })
      })
      this.addControl(ctrl)
    }
  }
  /**
   * @private
   */
  _setDrawPolygon(className, interaction, title, name, options) {
    var fedit = new ol.control.Toggle({
      className: className,
      name: name,
      title: title,
      interaction: interaction,
      // Options bar associated with the control
      bar: new ol.control.Bar({
        controls: [
          new ol.control.TextButton({
            html: this._getTitle(options.interactions.UndoDraw) || 'undo',
            title: this._getTitle(options.interactions.UndoDraw) || 'undo last point',
            handleClick: function () {
              if (fedit.getInteraction().nbpts > 1)
                fedit.getInteraction().removeLastPoint()
            }
          }),
          new ol.control.TextButton({
            html: this._getTitle(options.interactions.FinishDraw) || 'finish',
            title: this._getTitle(options.interactions.FinishDraw) || 'finish',
            handleClick: function () {
              // Prevent null objects on finishDrawing
              if (fedit.getInteraction().nbpts > 3)
                fedit.getInteraction().finishDrawing()
            }
          })
        ]
      })
    })
    this.addControl(fedit)
    return fedit
  }
  /** Add modify tools
   * @private
   */
  _setModifyInteraction(options) {
    // Modify on selected features
    if (options.interactions.ModifySelect !== false && options.interactions.Select !== false) {
      if (options.interactions.ModifySelect instanceof ol.interaction.ModifyFeature) {
        this._interactions.ModifySelect = options.interactions.ModifySelect
      } else {
        this._interactions.ModifySelect = new ol.interaction.ModifyFeature({
          features: this.getInteraction('Select').getFeatures()
        })
      }
      if (this.getMap())
        this.getMap().addInteraction(this._interactions.ModifySelect)
      // Activate with select
      this._interactions.ModifySelect.setActive(this._interactions.Select.getActive())
      this._interactions.Select.on('change:active', function () {
        this._interactions.ModifySelect.setActive(this._interactions.Select.getActive())
      }.bind(this))
    }
    if (options.interactions.Transform !== false) {
      if (options.interactions.Transform instanceof ol.interaction.Transform) {
        this._interactions.Transform = options.interactions.Transform
      } else {
        this._interactions.Transform = new ol.interaction.Transform({
          addCondition: ol.events.condition.shiftKeyOnly
        })
      }
      var transform = new ol.control.Toggle({
        html: '<i></i>',
        className: 'ol-transform',
        title: this._getTitle(options.interactions.Transform) || 'Transform',
        name: 'Transform',
        interaction: this._interactions.Transform
      })
      this.addControl(transform)
    }
    if (options.interactions.Split !== false) {
      if (options.interactions.Split instanceof ol.interaction.Split) {
        this._interactions.Split = options.interactions.Split
      } else {
        this._interactions.Split = new ol.interaction.Split({
          sources: this._source
        })
      }
      var split = new ol.control.Toggle({
        className: 'ol-split',
        title: this._getTitle(options.interactions.Split) || 'Split',
        name: 'Split',
        interaction: this._interactions.Split
      })
      this.addControl(split)
    }
    if (options.interactions.Offset !== false) {
      if (options.interactions.Offset instanceof ol.interaction.Offset) {
        this._interactions.Offset = options.interactions.Offset
      } else {
        this._interactions.Offset = new ol.interaction.Offset({
          source: this._source
        })
      }
      var offset = new ol.control.Toggle({
        html: '<i></i>',
        className: 'ol-offset',
        title: this._getTitle(options.interactions.Offset) || 'Offset',
        name: 'Offset',
        interaction: this._interactions.Offset
      })
      this.addControl(offset)
    }
  }
}
