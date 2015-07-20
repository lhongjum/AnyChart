goog.provide('anychart.core.ui.Crosshair');
goog.require('anychart.core.VisualBase');
goog.require('anychart.core.ui.CrosshairLabel');



/**
 * Crosshair class.
 * @constructor
 * @extends {anychart.core.VisualBase}
 */
anychart.core.ui.Crosshair = function() {
  goog.base(this);

  /**
   * If true, all default chart elements layout is swapped.
   * @type {boolean}
   * @private
   */
  this.barChartMode_;

  /**
   * @type {anychart.core.axes.Linear}
   * @private
   */
  this.xAxis_;

  /**
   * @type {anychart.core.axes.Linear}
   * @private
   */
  this.yAxis_;

  /**
   * @type {acgraph.vector.Stroke}
   * @private
   */
  this.xStroke_ = 'black';

  /**
   * @type {acgraph.vector.Stroke}
   * @private
   */
  this.yStroke_ = 'black';

  /**
   * @type {acgraph.vector.Path}
   * @private
   */
  this.xLine_;

  /**
   * @type {acgraph.vector.Path}
   * @private
   */
  this.yLine_;

  /**
   * @type {anychart.core.ui.CrosshairLabel}
   * @private
   */
  this.xLabel_;

  /**
   * @type {anychart.core.ui.CrosshairLabel}
   * @private
   */
  this.yLabel_;

  this.yLine_ = acgraph.path();
  this.xLine_ = acgraph.path();
  this.xLabel_ = new anychart.core.ui.CrosshairLabel();
  this.yLabel_ = new anychart.core.ui.CrosshairLabel();

  // formatting
  this.xLabel_.padding(6, 10);
  this.xLabel_.background('black .85');
  this.xLabel_.fontColor('white');
  this.xLabel_.fontWeight(400);

  this.yLabel_.padding(6, 10);
  this.yLabel_.background('black .85');
  this.yLabel_.fontColor('white');
  this.yLabel_.fontWeight(400);

  this.xLine_.disablePointerEvents(true);
  this.yLine_.disablePointerEvents(true);
  this.xLabel_.disablePointerEvents(true);
  this.yLabel_.disablePointerEvents(true);

  this.xLabel_.markConsistent(anychart.ConsistencyState.ALL);
  this.yLabel_.markConsistent(anychart.ConsistencyState.ALL);

  this.xLabel_.listenSignals(this.labelInvalidated_, this);
  this.yLabel_.listenSignals(this.labelInvalidated_, this);
};
goog.inherits(anychart.core.ui.Crosshair, anychart.core.VisualBase);


/**
 * Supported signals.
 * @type {number}
 */
anychart.core.ui.Crosshair.prototype.SUPPORTED_SIGNALS =
    anychart.core.VisualBase.prototype.SUPPORTED_SIGNALS |
    anychart.Signal.NEEDS_REAPPLICATION;


/**
 * Supported consistency states.
 * @type {number}
 */
anychart.core.ui.Crosshair.prototype.SUPPORTED_CONSISTENCY_STATES =
    anychart.core.VisualBase.prototype.SUPPORTED_CONSISTENCY_STATES |
    anychart.ConsistencyState.APPEARANCE;


/**
 * Internal label invalidation handler.
 * @param {anychart.SignalEvent} event Event object.
 * @private
 */
anychart.core.ui.Crosshair.prototype.labelInvalidated_ = function(event) {
  if (event.hasSignal(anychart.Signal.NEEDS_REAPPLICATION)) {
    this.dispatchSignal(anychart.Signal.NEEDS_REAPPLICATION);
  }
};


/**
 *
 * @param {boolean=} opt_barChartMode
 * @return {!(boolean|anychart.core.ui.Crosshair)}
 */
anychart.core.ui.Crosshair.prototype.barChartMode = function(opt_barChartMode) {
  if (goog.isDef(opt_barChartMode)) {
    opt_barChartMode = !!opt_barChartMode;
    if (this.barChartMode_ != opt_barChartMode) {
      this.barChartMode_ = opt_barChartMode;
    }
    return this;
  } else {
    return this.barChartMode_;
  }
};


/**
 *
 * @param {anychart.core.axes.Linear=} opt_value
 * @return {anychart.core.axes.Linear|anychart.core.ui.Crosshair}
 */
anychart.core.ui.Crosshair.prototype.xAxis = function(opt_value) {
  if (goog.isDef(opt_value)) {
    if (this.xAxis_ != opt_value) {
      // set textFormatter
      if (!this.xLabel_.textFormatter() ||
          (this.xAxis_ && this.xLabel_.textFormatter() == this.xAxis_.labels().textFormatter())) {

        this.xLabel_.textFormatter(/** @type {Function} */(opt_value.labels().textFormatter()));
      }

      // set anchor
      if (!this.xLabel_.anchor() ||
          (this.xAxis_ && this.xLabel_.anchor() == this.getAnchorByAxis_(this.xAxis_))) {

        this.xLabel_.anchor(this.getAnchorByAxis_(opt_value));
      }

      this.xAxis_ = opt_value;
    }
    return this;
  } else {
    return this.xAxis_;
  }
};


/**
 *
 * @param {anychart.core.axes.Linear=} opt_value
 * @return {anychart.core.axes.Linear|anychart.core.ui.Crosshair}
 */
anychart.core.ui.Crosshair.prototype.yAxis = function(opt_value) {
  if (goog.isDef(opt_value)) {
    if (this.yAxis_ != opt_value) {
      // set textFormatter
      if (!this.yLabel_.textFormatter() ||
          (this.yAxis_ && this.yLabel_.textFormatter() == this.yAxis_.labels().textFormatter())) {

        this.yLabel_.textFormatter(/** @type {Function} */(opt_value.labels().textFormatter()));
      }

      // set anchor
      if (!this.yLabel_.anchor() ||
          (this.yAxis_ && this.yLabel_.anchor() == this.getAnchorByAxis_(this.yAxis_))) {

        this.yLabel_.anchor(this.getAnchorByAxis_(opt_value));
      }

      this.yAxis_ = opt_value;
    }
    return this;
  } else {
    return this.yAxis_;
  }
};


/**
 *
 * @param {anychart.core.axes.Linear} axis
 * @return {anychart.enums.Anchor}
 * @private
 */
anychart.core.ui.Crosshair.prototype.getAnchorByAxis_ = function(axis) {
  switch (axis.orientation()) {
    case anychart.enums.Orientation.LEFT:
      return anychart.enums.Anchor.RIGHT_CENTER;
    case anychart.enums.Orientation.TOP:
      return anychart.enums.Anchor.CENTER_BOTTOM;
    case anychart.enums.Orientation.RIGHT:
      return anychart.enums.Anchor.LEFT_CENTER;
    case anychart.enums.Orientation.BOTTOM:
      return anychart.enums.Anchor.CENTER_TOP;
    default:
      return anychart.enums.Anchor.LEFT_TOP;
  }
};


/**
 * Getter crosshair xLabel
 * @param {(Object|boolean|null)=} opt_value
 * @return {anychart.core.ui.CrosshairLabel|anychart.core.ui.Crosshair}
 */
anychart.core.ui.Crosshair.prototype.xLabel = function(opt_value) {
  if (goog.isDef(opt_value)) {
    this.xLabel_.setup(opt_value);
    return this;
  } else {
    return this.xLabel_;
  }
};


/**
 * Getter crosshair yLabel
 * @param {(Object|boolean|null)=} opt_value
 * @return {anychart.core.ui.CrosshairLabel|anychart.core.ui.Crosshair}
 */
anychart.core.ui.Crosshair.prototype.yLabel = function(opt_value) {
  if (goog.isDef(opt_value)) {
    this.yLabel_.setup(opt_value);
    return this;
  } else {
    return this.yLabel_;
  }
};


/**
 * Getter/Setter for the X line stroke.
 * @param {(acgraph.vector.Stroke|acgraph.vector.ColoredFill|string|null)=} opt_strokeOrFill Fill settings
 *    or stroke settings.
 * @param {number=} opt_thickness [1] Line thickness.
 * @param {string=} opt_dashpattern Controls the pattern of dashes and gaps used to stroke paths.
 * @param {acgraph.vector.StrokeLineJoin=} opt_lineJoin Line joint style.
 * @param {acgraph.vector.StrokeLineCap=} opt_lineCap Line cap style.
 * @return {anychart.core.ui.Crosshair|acgraph.vector.Stroke} .
 */
anychart.core.ui.Crosshair.prototype.xStroke = function(opt_strokeOrFill, opt_thickness, opt_dashpattern, opt_lineJoin, opt_lineCap) {
  if (goog.isDef(opt_strokeOrFill)) {
    var stroke = acgraph.vector.normalizeStroke.apply(null, arguments);
    if (stroke != this.xStroke_) {
      this.xStroke_ = stroke;
      this.invalidate(anychart.ConsistencyState.APPEARANCE, anychart.Signal.NEEDS_REDRAW);
    }
    return this;
  }
  return this.xStroke_;
};


/**
 * Getter/Setter for the Y line stroke.
 * @param {(acgraph.vector.Stroke|acgraph.vector.ColoredFill|string|null)=} opt_strokeOrFill Fill settings
 *    or stroke settings.
 * @param {number=} opt_thickness [1] Line thickness.
 * @param {string=} opt_dashpattern Controls the pattern of dashes and gaps used to stroke paths.
 * @param {acgraph.vector.StrokeLineJoin=} opt_lineJoin Line joint style.
 * @param {acgraph.vector.StrokeLineCap=} opt_lineCap Line cap style.
 * @return {anychart.core.ui.Crosshair|acgraph.vector.Stroke} .
 */
anychart.core.ui.Crosshair.prototype.yStroke = function(opt_strokeOrFill, opt_thickness, opt_dashpattern, opt_lineJoin, opt_lineCap) {
  if (goog.isDef(opt_strokeOrFill)) {
    var stroke = acgraph.vector.normalizeStroke.apply(null, arguments);
    if (stroke != this.yStroke_) {
      this.yStroke_ = stroke;
      this.invalidate(anychart.ConsistencyState.APPEARANCE, anychart.Signal.NEEDS_REDRAW);
    }
    return this;
  }
  return this.yStroke_;
};


/**
 * Create xLine, yLine and Labels
 * @return {!anychart.core.ui.Crosshair} {@link anychart.core.ui.Crosshair} instance for method chaining.
 */
anychart.core.ui.Crosshair.prototype.draw = function() {
  if (!this.checkDrawingNeeded())
    return this;

  var bounds = /** @type {anychart.math.Rect} */(this.parentBounds());
  var zIndex = /** @type {number} */(this.zIndex());
  var container = /** @type {acgraph.vector.ILayer} */(this.container());

  if (this.hasInvalidationState(anychart.ConsistencyState.APPEARANCE)) {
    this.xLine_.stroke(this.xStroke_);
    this.yLine_.stroke(this.yStroke_);

    this.markConsistent(anychart.ConsistencyState.APPEARANCE);
  }

  if (this.hasInvalidationState(anychart.ConsistencyState.CONTAINER)) {
    this.xLine_.parent(container);
    this.yLine_.parent(container);

    this.xLabel_.container(container);
    this.yLabel_.container(container);

    this.markConsistent(anychart.ConsistencyState.CONTAINER);
  }

  if (this.hasInvalidationState(anychart.ConsistencyState.Z_INDEX)) {
    this.xLine_.zIndex(zIndex);
    this.yLine_.zIndex(zIndex);

    this.xLabel_.zIndex(zIndex);
    this.yLabel_.zIndex(zIndex);

    this.markConsistent(anychart.ConsistencyState.Z_INDEX);
  }

  if (this.hasInvalidationState(anychart.ConsistencyState.BOUNDS)) {
    this.xLabel_.parentBounds(bounds);
    this.yLabel_.parentBounds(bounds);

    this.markConsistent(anychart.ConsistencyState.BOUNDS);
  }

  return this;
};


/**
 *
 * @param {anychart.charts.Cartesian|anychart.charts.Scatter} chart
 */
anychart.core.ui.Crosshair.prototype.bindHandlersTo = function(chart) {
  this.bindHandlersToComponent(chart, this.handleMouseOverAndMove_, this.handleMouseOut_, null, this.handleMouseOverAndMove_);
};


/**
 *
 * @param {anychart.core.MouseEvent} e Event object.
 * @private
 */
anychart.core.ui.Crosshair.prototype.handleMouseOverAndMove_ = function(e) {
  if (!this.enabled()) return;

  var container = /** @type {acgraph.vector.ILayer} */(this.container());
  var bounds = this.parentBounds();
  var chartOffset = goog.style.getClientPosition(/** @type {Element} */(this.container().getStage().container()));

  var mouseX = e['clientX'] - chartOffset.x;
  var mouseY = e['clientY'] - chartOffset.y;

  if (mouseX >= bounds.getLeft() && mouseX <= bounds.getRight() &&
      mouseY >= bounds.getTop() && mouseY <= bounds.getBottom()) {

    var shiftX = this.xLine_.strokeThickness() % 2 == 0 ? 0 : -.5;
    var shiftY = this.yLine_.strokeThickness() % 2 == 0 ? 0 : -.5;

    var width = bounds.getRight() - bounds.getLeft();
    var height = bounds.getBottom() - bounds.getTop();
    var dataPlotOffsetX = mouseX - bounds.getLeft();
    var dataPlotOffsetY = mouseY - bounds.getTop();

    var xRatio, yRatio;
    if (this.barChartMode_) {
      xRatio = (height - dataPlotOffsetY) / height;
      yRatio = dataPlotOffsetX / width;
    } else {
      xRatio = dataPlotOffsetX / width;
      yRatio = (height - dataPlotOffsetY) / height;
    }

    if (this.xAxis_ && this.xAxis_.enabled()) {
      if (this.xStroke_ && this.xStroke_ != 'none') {
        var xLineCoord;
        this.xLine_.clear();

        if (this.xAxis_.isHorizontal()) {
          // one pixel shift with clamp
          xLineCoord = goog.math.clamp(this.prepareCoordinate_(this.xAxis_, xRatio, mouseX), bounds.getLeft(), bounds.getRight() - 1);
          this.xLine_
              .moveTo(xLineCoord - shiftX, bounds.getTop())
              .lineTo(xLineCoord - shiftX, bounds.getBottom());
        } else {
          xLineCoord = goog.math.clamp(this.prepareCoordinate_(this.xAxis_, xRatio, mouseY), bounds.getTop(), bounds.getBottom() - 1);
          this.xLine_
              .moveTo(bounds.getLeft(), xLineCoord - shiftY)
              .lineTo(bounds.getRight(), xLineCoord - shiftY);
        }
      }

      if (this.xLabel_.enabled()) {
        var xLabelFormatProvider = this.getLabelsFormatProvider_(this.xAxis_, xRatio);
        var xLabelTextFormatter = this.xLabel_.textFormatter() || anychart.utils.DEFAULT_FORMATTER;
        this.xLabel_.text(xLabelTextFormatter.call(xLabelFormatProvider, xLabelFormatProvider));
        var xLabelPosition = this.getLabelPosition_(this.xAxis_, this.xLabel_, mouseX, mouseY, xRatio);
        this.xLabel_.x(/** @type {number}*/(xLabelPosition.x)).y(/** @type {number}*/(xLabelPosition.y));
        this.xLabel_.container(container).draw();
      }
    }

    if (this.yAxis_ && this.yAxis_.enabled()) {
      if (this.yStroke_ && this.yStroke_ != 'none') {
        var yLineCoord;
        this.yLine_.clear();

        if (this.yAxis_.isHorizontal()) {
          yLineCoord = goog.math.clamp(this.prepareCoordinate_(this.yAxis_, yRatio, mouseX), bounds.getLeft(), bounds.getRight() - 1);
          this.yLine_
              .moveTo(yLineCoord - shiftX, bounds.getTop())
              .lineTo(yLineCoord - shiftX, bounds.getBottom());
        } else {
          yLineCoord = goog.math.clamp(this.prepareCoordinate_(this.yAxis_, yRatio, mouseY), bounds.getTop(), bounds.getBottom() - 1);
          this.yLine_
              .moveTo(bounds.getLeft(), yLineCoord - shiftY)
              .lineTo(bounds.getRight(), yLineCoord - shiftY);
        }
      }

      if (this.yLabel_.enabled()) {
        var yLabelFormatProvider = this.getLabelsFormatProvider_(this.yAxis_, yRatio);
        var yLabelTextFormatter = this.yLabel_.textFormatter() || anychart.utils.DEFAULT_FORMATTER;
        this.yLabel_.text(yLabelTextFormatter.call(yLabelFormatProvider, yLabelFormatProvider));
        var yLabelPosition = this.getLabelPosition_(this.yAxis_, this.yLabel_, mouseX, mouseY, yRatio);
        this.yLabel_.x(/** @type {number}*/(yLabelPosition.x)).y(/** @type {number}*/(yLabelPosition.y));
        this.yLabel_.container(container).draw();
      }
    }

  } else {
    this.xLine_.clear();
    this.yLine_.clear();

    this.xLabel_.container(null).remove();
    this.yLabel_.container(null).remove();
  }
};


/**
 * Get the coordinate on the axis scale, given the type of scale.
 * @param {anychart.core.axes.Linear} axis
 * @param {number} ratio Current ratio.
 * @param {number} coord Current mouse coordinate.
 * @return {number}
 * @private
 */
anychart.core.ui.Crosshair.prototype.prepareCoordinate_ = function(axis, ratio, coord) {
  var bounds = this.parentBounds();
  var scale = axis.scale();
  var isOrdinal = scale.getType() == anychart.enums.ScaleTypes.ORDINAL;
  var centerRatio = scale.transform(scale.inverseTransform(ratio), .5);

  if (axis.isHorizontal()) {
    return isOrdinal ? Math.round(bounds.left + centerRatio * bounds.width) : coord;
  } else {
    return isOrdinal ? Math.round(bounds.top + bounds.height - centerRatio * bounds.height) : coord;
  }
};


/**
 * Get the label position, given the type of scale and axis orientation.
 * @param {anychart.core.axes.Linear} axis
 * @param {anychart.core.ui.CrosshairLabel} label
 * @param {number} mouseX
 * @param {number} mouseY
 * @param {number} ratio Current ratio.
 * @return {anychart.math.CoordinateObject}
 * @private
 */
anychart.core.ui.Crosshair.prototype.getLabelPosition_ = function(axis, label, mouseX, mouseY, ratio) {
  var bounds = this.parentBounds();
  var x = 0, y = 0;

  if (!axis) return {x: x, y: y};

  var scale = axis.scale();
  var axisBounds = axis.getPixelBounds();

  var isOrdinal = scale.getType() == anychart.enums.ScaleTypes.ORDINAL;
  var centerRatio = scale.transform(scale.inverseTransform(ratio), .5);
  var shift = 1;

  var axisEnabled = axis.enabled();
  var left = axisEnabled ? axisBounds.getLeft() : bounds.getRight();
  var top = axisEnabled ? axisBounds.getTop() : bounds.getBottom();
  var right = axisEnabled ? axisBounds.getRight() : bounds.getLeft();
  var bottom = axisEnabled ? axisBounds.getBottom() : bounds.getTop();

  switch (axis.orientation()) {
    case anychart.enums.Orientation.LEFT:
      x = this.isLabelAnchorLeft(label) ? right - shift : right + shift;
      y = isOrdinal ? Math.round(bounds.top + bounds.height - centerRatio * bounds.height) : mouseY;
      break;
    case anychart.enums.Orientation.TOP:
      x = isOrdinal ? Math.round(bounds.left + centerRatio * bounds.width) : mouseX;
      y = this.isLabelAnchorTop(label) ? bottom - shift : bottom + shift;
      break;
    case anychart.enums.Orientation.RIGHT:
      x = this.isLabelAnchorLeft(label) ? left - shift : left + shift;
      y = isOrdinal ? Math.round(bounds.top + bounds.height - centerRatio * bounds.height) : mouseY;
      break;
    case anychart.enums.Orientation.BOTTOM:
      x = isOrdinal ? Math.round(bounds.left + centerRatio * bounds.width) : mouseX;
      y = this.isLabelAnchorTop(label) ? top - shift : top + shift;
      break;
  }

  return {x: x, y: y};
};


/**
 *
 * @param {anychart.core.ui.CrosshairLabel} label
 * @return {boolean}
 */
anychart.core.ui.Crosshair.prototype.isLabelAnchorLeft = function(label) {
  var anchor = label.anchor();
  return anchor == anychart.enums.Anchor.LEFT_TOP ||
      anchor == anychart.enums.Anchor.LEFT_CENTER ||
      anchor == anychart.enums.Anchor.LEFT_BOTTOM;
};


/**
 *
 * @param {anychart.core.ui.CrosshairLabel} label
 * @return {boolean}
 */
anychart.core.ui.Crosshair.prototype.isLabelAnchorTop = function(label) {
  var anchor = label.anchor();
  return anchor == anychart.enums.Anchor.LEFT_TOP ||
      anchor == anychart.enums.Anchor.CENTER_TOP ||
      anchor == anychart.enums.Anchor.RIGHT_TOP;
};


/**
 * Gets format provider for label.
 * @param {anychart.core.axes.Linear} axis
 * @param {number} ratio
 * @return {Object} Labels format provider.
 * @private
 */
anychart.core.ui.Crosshair.prototype.getLabelsFormatProvider_ = function(axis, ratio) {
  if (!axis) return null;

  var scale = axis.scale();
  var scaleType = scale.getType();
  var scaleValue = scale.inverseTransform(ratio);

  var labelText;
  switch (scaleType) {
    case anychart.enums.ScaleTypes.LINEAR:
      labelText = +parseFloat(scaleValue).toFixed();
      break;
    case anychart.enums.ScaleTypes.LOG:
      labelText = +scaleValue.toFixed(1);
      break;
    case anychart.enums.ScaleTypes.ORDINAL:
      labelText = scaleValue.toString();
      break;
    case anychart.enums.ScaleTypes.DATE_TIME:
      var date = new Date(scaleValue);
      var mm = date.getMonth() + 1;
      var dd = date.getDate();
      var yy = date.getFullYear();

      mm = mm < 10 ? '0' + mm : '' + mm;
      dd = dd < 10 ? '0' + dd : '' + dd;

      labelText = mm + '-' + dd + '-' + yy;

      break;
  }

  return {
    'value': labelText,
    'rawValue': scaleValue,
    'max': scale.max ? scale.max : null,
    'min': scale.min ? scale.min : null,
    'scale': scale
  };
};


/**
 *
 * @param {anychart.core.MouseEvent} e Event object.
 * @private
 */
anychart.core.ui.Crosshair.prototype.handleMouseOut_ = function(e) {
  var bounds = this.parentBounds();

  var offsetX = e['offsetX'];
  var offsetY = e['offsetY'];

  if ((offsetX <= bounds.getLeft() || offsetX >= bounds.getRight()) ||
      (offsetY <= bounds.getTop() || offsetY >= bounds.getBottom())) {
    this.xLine_.clear();
    this.yLine_.clear();

    this.xLabel_.container(null).remove();
    this.yLabel_.container(null).remove();
  }
};


//----------------------------------------------------------------------------------------------------------------------
//  Disposing.
//----------------------------------------------------------------------------------------------------------------------
/** @inheritDoc */
anychart.core.ui.Crosshair.prototype.disposeInternal = function() {
  goog.dispose(this.xLine_);
  this.xLine_ = null;

  goog.dispose(this.yLine_);
  this.yLine_ = null;

  this.xAxis_ = null;
  this.yAxis_ = null;

  goog.dispose(this.xLabel_);
  this.xLabel_ = null;

  goog.dispose(this.yLabel_);
  this.yLabel_ = null;

  goog.base(this, 'disposeInternal');
};


/** @inheritDoc */
anychart.core.ui.Crosshair.prototype.serialize = function() {
  var json = goog.base(this, 'serialize');
  json['xStroke'] = anychart.color.serialize(/** @type {acgraph.vector.Stroke}*/(this.xStroke()));
  json['yStroke'] = anychart.color.serialize(/** @type {acgraph.vector.Stroke}*/(this.yStroke()));

  json['xLabel'] = this.xLabel_.serialize();
  json['yLabel'] = this.yLabel_.serialize();
  return json;
};


/** @inheritDoc */
anychart.core.ui.Crosshair.prototype.setupByJSON = function(config) {
  goog.base(this, 'setupByJSON', config);
  this.xStroke(config['xStroke']);
  this.yStroke(config['yStroke']);
  this.xLabel(config['xLabel']);
  this.yLabel(config['yLabel']);
};


//exports
anychart.core.ui.Crosshair.prototype['xStroke'] = anychart.core.ui.Crosshair.prototype.xStroke;
anychart.core.ui.Crosshair.prototype['yStroke'] = anychart.core.ui.Crosshair.prototype.yStroke;
anychart.core.ui.Crosshair.prototype['xLabel'] = anychart.core.ui.Crosshair.prototype.xLabel;
anychart.core.ui.Crosshair.prototype['yLabel'] = anychart.core.ui.Crosshair.prototype.yLabel;