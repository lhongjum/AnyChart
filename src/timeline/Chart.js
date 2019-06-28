goog.provide('anychart.timelineModule.Chart');


//region -- Requirements.
goog.require('anychart.core.ChartWithSeries');
goog.require('anychart.core.IChart');
goog.require('anychart.core.IPlot');
goog.require('anychart.core.StateSettings');
goog.require('anychart.core.axisMarkers.Line');
goog.require('anychart.core.axisMarkers.Range');
goog.require('anychart.core.axisMarkers.Text');
goog.require('anychart.core.settings');
goog.require('anychart.core.ui.ChartScroller');
goog.require('anychart.scales.GanttDateTime');
goog.require('anychart.scales.Linear');
goog.require('anychart.timelineModule.Axis');
goog.require('anychart.timelineModule.Intersections');
goog.require('anychart.timelineModule.series.Moment');
goog.require('anychart.timelineModule.series.Range');
goog.require('goog.events.MouseWheelHandler');



//endregion
//region -- Constructor.
/**
 *
 * @implements {anychart.core.IPlot}
 * @implements {anychart.core.IChart}
 * @constructor
 * @extends {anychart.core.ChartWithSeries}
 */
anychart.timelineModule.Chart = function() {
  anychart.timelineModule.Chart.base(this, 'constructor');
  this.addThemes('timeline');

  /**
   * @type {anychart.scales.GanttDateTime}
   * @private
   */
  this.xScale_ = new anychart.scales.GanttDateTime();
  this.setupCreated('scale', this.xScale_);
  this.initScale_(this.xScale_);
  this.xScale_.listenSignals(this.scaleInvalidated_, this);

  /**
   * Base transformation matrix without any transformations/translations.
   * @type {Array.<number>}
   */
  this.baseTransform = [1, 0, 0, 1, 0, 0];

  /**
   * @type {Array.<anychart.core.axisMarkers.Line>}
   * @private
   */
  this.lineAxesMarkers_ = [];

  /**
   * @type {Array.<anychart.core.axisMarkers.Text>}
   * @private
   */
  this.textAxesMarkers_ = [];

  /**
   * @type {Array.<anychart.core.axisMarkers.Range>}
   * @private
   */
  this.rangeAxesMarkers_ = [];

  /**
   * Saved vertical translate.
   * @type {number}
   */
  this.verticalTranslate = 0;

  /**
   * Saved horizontal translate.
   * @type {number}
   */
  this.horizontalTranslate = 0;

  /**
   * Automagically translate chart so, that there are no white spaces.
   * Works only if one side has free space and other don't.
   * @type {boolean}
   */
  this.autoChartTranslating = true;

  this.rangeSeriesList = [];
  this.momentSeriesList = [];

  this.initInteractivity_();
};
goog.inherits(anychart.timelineModule.Chart, anychart.core.ChartWithSeries);


//endregion
//region -- Generating Series.
/**
 * Series config for Cartesian chart.
 * @type {!Object.<string, anychart.core.series.TypeConfig>}
 */
anychart.timelineModule.Chart.prototype.seriesConfig = (function() {
  var res = {};
  var capabilities = (anychart.core.series.Capabilities.ALLOW_INTERACTIVITY |
      anychart.core.series.Capabilities.ALLOW_POINT_SETTINGS |
      // anychart.core.series.Capabilities.ALLOW_ERROR |
      // anychart.core.series.Capabilities.SUPPORTS_MARKERS |
      anychart.core.series.Capabilities.SUPPORTS_LABELS | 0);

  res[anychart.enums.TimelineSeriesType.MOMENT] = {
    drawerType: anychart.enums.SeriesDrawerTypes.MOMENT,
    shapeManagerType: anychart.enums.ShapeManagerTypes.PER_POINT,
    shapesConfig: [
      anychart.core.shapeManagers.pathStrokeConfig
    ],
    secondaryShapesConfig: null,
    postProcessor: null,
    capabilities: capabilities | anychart.core.series.Capabilities.SUPPORTS_MARKERS,
    anchoredPositionBottom: 'zero'
  };

  res[anychart.enums.TimelineSeriesType.RANGE] = {
    drawerType: anychart.enums.SeriesDrawerTypes.RANGE,
    shapeManagerType: anychart.enums.ShapeManagerTypes.PER_POINT,
    shapesConfig: [
      anychart.core.shapeManagers.pathFillStrokeConfig
    ],
    secondaryShapesConfig: null,
    postProcessor: null,
    capabilities: capabilities,
    anchoredPositionBottom: 'zero'
  };

  return res;
})();
anychart.core.ChartWithSeries.generateSeriesConstructors(anychart.timelineModule.Chart, anychart.timelineModule.Chart.prototype.seriesConfig);


//endregion
//region -- Consistency states and signals.
/**
 * Supported consistency states.
 * @type {number}
 */
anychart.timelineModule.Chart.prototype.SUPPORTED_CONSISTENCY_STATES =
    anychart.core.ChartWithSeries.prototype.SUPPORTED_CONSISTENCY_STATES |
    anychart.ConsistencyState.AXES_CHART_AXES |
    anychart.ConsistencyState.SCALE_CHART_SCALES |
    anychart.ConsistencyState.AXES_CHART_AXES_MARKERS |
    anychart.ConsistencyState.CARTESIAN_X_SCROLLER;


/**
 * Supported consistency states.
 * @type {number}
 */
anychart.timelineModule.Chart.prototype.SUPPORTED_SIGNALS =
    anychart.core.SeparateChart.prototype.SUPPORTED_SIGNALS;


/**
 * Timeline chart states
 * @enum {string}
 */
anychart.timelineModule.Chart.States = {
  SCROLL: 'scroll',
  ZOOM: 'zoom'
};
anychart.consistency.supportStates(anychart.timelineModule.Chart, anychart.enums.Store.TIMELINE_CHART, [
      anychart.timelineModule.Chart.States.SCROLL]);


/**
 * Base z index of range series, used for z index calculation.
 * @type {number}
 */
anychart.timelineModule.Chart.RANGE_BASE_Z_INDEX = 34;


//endregion
//region -- Axis markers
/**
 * Getter/setter for rangeMarker.
 * @param {(Object|boolean|null|number)=} opt_indexOrValue Chart range marker settings to set.
 * @param {(Object|boolean|null)=} opt_value Chart range marker settings to set.
 * @return {!(anychart.core.axisMarkers.Range|anychart.timelineModule.Chart)} Range marker instance by index or itself for chaining call.
 */
anychart.timelineModule.Chart.prototype.rangeMarker = function(opt_indexOrValue, opt_value) {
  var index, value;
  index = anychart.utils.toNumber(opt_indexOrValue);
  if (isNaN(index)) {
    index = 0;
    value = opt_indexOrValue;
  } else {
    index = /** @type {number} */(opt_indexOrValue);
    value = opt_value;
  }
  var rangeMarker = this.rangeAxesMarkers_[index];
  if (!rangeMarker) {
    rangeMarker = this.createRangeMarkerInstance();
    rangeMarker.drawAtAnyRatio(true);

    var extendedThemes = this.createExtendedThemes(this.getThemes(), 'defaultRangeMarkerSettings');
    rangeMarker.addThemes(extendedThemes);

    rangeMarker.setChart(this);
    rangeMarker.setDefaultLayout(anychart.enums.Layout.VERTICAL);
    this.rangeAxesMarkers_[index] = rangeMarker;
    rangeMarker.listenSignals(this.markerInvalidated_, this);
    this.invalidate(anychart.ConsistencyState.AXES_CHART_AXES_MARKERS, anychart.Signal.NEEDS_REDRAW);
  }

  if (goog.isDef(value)) {
    rangeMarker.setup(value);
    return this;
  } else {
    return rangeMarker;
  }
};


/**
 * Create rangeMarker instance.
 * @return {!(anychart.core.axisMarkers.Range)}
 * @protected
 */
anychart.timelineModule.Chart.prototype.createRangeMarkerInstance = function() {
  return new anychart.core.axisMarkers.Range();
};


/**
 * Getter/setter for textMarker.
 * @param {(Object|boolean|null|number)=} opt_indexOrValue Chart line marker settings to set.
 * @param {(Object|boolean|null)=} opt_value Chart line marker settings to set.
 * @return {!(anychart.core.axisMarkers.Text|anychart.timelineModule.Chart)} Text marker instance by index or itself for chaining call.
 */
anychart.timelineModule.Chart.prototype.textMarker = function(opt_indexOrValue, opt_value) {
  var index, value;
  index = anychart.utils.toNumber(opt_indexOrValue);
  if (isNaN(index)) {
    index = 0;
    value = opt_indexOrValue;
  } else {
    index = /** @type {number} */(opt_indexOrValue);
    value = opt_value;
  }
  var textMarker = this.textAxesMarkers_[index];
  if (!textMarker) {
    textMarker = this.createTextMarkerInstance();
    textMarker.drawAtAnyRatio(true);

    // textMarker.addThemes('cartesianBase.defaultTextMarkerSettings');
    var extendedThemes = this.createExtendedThemes(this.getThemes(), 'defaultTextMarkerSettings');
    textMarker.addThemes(extendedThemes);

    textMarker.setChart(this);
    textMarker.setDefaultLayout(anychart.enums.Layout.VERTICAL);
    this.textAxesMarkers_[index] = textMarker;
    textMarker.listenSignals(this.markerInvalidated_, this);
    this.invalidate(anychart.ConsistencyState.AXES_CHART_AXES_MARKERS, anychart.Signal.NEEDS_REDRAW);
  }

  if (goog.isDef(value)) {
    textMarker.setup(value);
    return this;
  } else {
    return textMarker;
  }
};


/**
 * Create textMarker instance.
 * @return {anychart.core.axisMarkers.Text}
 * @protected
 */
anychart.timelineModule.Chart.prototype.createTextMarkerInstance = function() {
  return new anychart.core.axisMarkers.Text();
};


/**
 * Getter/setter for lineMarker.
 * @param {(Object|boolean|null|number)=} opt_indexOrValue Chart line marker settings to set.
 * @param {(Object|boolean|null)=} opt_value Chart line marker settings to set.
 * @return {!(anychart.core.axisMarkers.Line|anychart.timelineModule.Chart)} Line marker instance by index or itself for method chaining.
 */
anychart.timelineModule.Chart.prototype.lineMarker = function(opt_indexOrValue, opt_value) {
  var index, value;
  index = anychart.utils.toNumber(opt_indexOrValue);
  if (isNaN(index)) {
    index = 0;
    value = opt_indexOrValue;
  } else {
    index = /** @type {number} */(opt_indexOrValue);
    value = opt_value;
  }
  var lineMarker = this.lineAxesMarkers_[index];
  if (!lineMarker) {
    lineMarker = this.createLineMarkerInstance();
    lineMarker.drawAtAnyRatio(true);

    var extendedThemes = this.createExtendedThemes(this.getThemes(), 'defaultLineMarkerSettings');
    lineMarker.addThemes(extendedThemes);

    lineMarker.setChart(this);
    lineMarker.setDefaultLayout(anychart.enums.Layout.VERTICAL);
    this.lineAxesMarkers_[index] = lineMarker;
    lineMarker.listenSignals(this.markerInvalidated_, this);
    this.invalidate(anychart.ConsistencyState.AXES_CHART_AXES_MARKERS, anychart.Signal.NEEDS_REDRAW);
  }

  if (goog.isDef(value)) {
    lineMarker.setup(value);
    return this;
  } else {
    return lineMarker;
  }
};


/**
 * @return {anychart.core.axisMarkers.Line}
 */
anychart.timelineModule.Chart.prototype.createLineMarkerInstance = function() {
  return new anychart.core.axisMarkers.Line();
};


/**
 * @param {anychart.SignalEvent} event
 * @private
 */
anychart.timelineModule.Chart.prototype.markerInvalidated_ = function(event) {
  var consistency = anychart.ConsistencyState.AXES_CHART_AXES_MARKERS;
  if (event.hasSignal(anychart.Signal.NEEDS_RECALCULATION)) {
    consistency |= anychart.ConsistencyState.SCALE_CHART_SCALES;
  }
  this.invalidate(consistency, anychart.Signal.NEEDS_REDRAW);
};


/**
 * Returns instance of today marker. Today marker is line marker with current date, for now.
 * @param {(Object|boolean|null)=} opt_value
 * @return {anychart.core.axisMarkers.Line|anychart.timelineModule.Chart}
 */
anychart.timelineModule.Chart.prototype.todayMarker = function(opt_value) {
  if (!this.todayMarker_) {
    this.todayMarker_ = this.createLineMarkerInstance();
    this.todayMarker_.drawAtAnyRatio(true);

    var extendedThemes = this.createExtendedThemes(this.getThemes(), 'defaultLineMarkerSettings');
    this.todayMarker_.addThemes(extendedThemes);
    this.setupCreated('todayMarker', this.todayMarker_);

    this.todayMarker_.setChart(this);
    this.todayMarker_.setDefaultLayout(anychart.enums.Layout.VERTICAL);
    this.todayMarker_.listenSignals(this.markerInvalidated_, this);
    var curDate = new Date();
    this.todayMarker_['value'](Date.UTC(curDate.getUTCFullYear(), curDate.getUTCMonth(), curDate.getUTCDay()));
    this.invalidate(anychart.ConsistencyState.AXES_CHART_AXES_MARKERS | anychart.ConsistencyState.SCALE_CHART_SCALES, anychart.Signal.NEEDS_REDRAW);
  }

  if (goog.isDef(opt_value)) {
    this.todayMarker_.setup(opt_value);
    return this;
  }
  return this.todayMarker_;
};


//endregion
//region -- Chart Infrastructure Overrides.


/** @inheritDoc */
anychart.timelineModule.Chart.prototype.calculate = function() {
  var dateMin = +Infinity;
  var dateMax = -Infinity;

  var directions = [anychart.enums.Direction.UP, anychart.enums.Direction.DOWN];
  var rangeNum = 0;
  var eventNum = 0;

  this.drawingPlans = [];
  this.drawingPlansRange = [];
  this.drawingPlansEvent = [];

  var axisHeight = this.axis().enabled() ? /** @type {number} */(this.axis().getOption('height')) : 0;

  /**
   * Checks if given value is inside range min and max.
   * If range max is NaN, it's thought to be +Infinity.
   * @param {number} value
   * @param {number} rangeMin
   * @param {number} rangeMax
   * @return {boolean}
   */
  var valueInsideRange = function(value, rangeMin, rangeMax) {
    return (value > rangeMin && (value < rangeMax || isNaN(rangeMax)));
  };

  var intersectingBounds = [];
  var intersectingBoundsRange = [];
  var intersectingBoundsRangeUp = [];
  var intersectingBoundsRangeDown = [];
  var intersectingBoundsEvent = [];
  var intersectingBoundsEventUp = [];
  var intersectingBoundsEventDown = [];

  if (this.getSeriesCount() == 0) {
    this.scale().reset();
    this.axis().invalidate(anychart.ConsistencyState.APPEARANCE | anychart.ConsistencyState.AXIS_TICKS | anychart.ConsistencyState.AXIS_LABELS);

    this.dateMax = +Infinity;
    this.dateMin = -Infinity;

    this.momentSeriesList.length = 0;
    this.rangeSeriesList.length = 0;

    this.totalRange = {
      sX: 0,
      eX: this.dataBounds.width,
      sY: -this.dataBounds.height / 2,
      eY: this.dataBounds.height / 2
    };
    return;
  }

  if (this.hasInvalidationState(anychart.ConsistencyState.SERIES_CHART_SERIES | anychart.ConsistencyState.SCALE_CHART_SCALES)) {
    var eventSeriesList = [];
    var rangeSeriesList = [];
    for (var i = 0; i < this.seriesList.length; i++) {
      var series = this.seriesList[i];
      var seriesType = series.seriesType();

      switch (seriesType) {
        case anychart.enums.TimelineSeriesType.MOMENT:
          eventSeriesList.push(series);
          break;
        case anychart.enums.TimelineSeriesType.RANGE:
          rangeSeriesList.push(series);
          break;
      }

      //region setting auto directions for series if needed
      if (series.getOption('direction') == anychart.enums.Direction.ODD_EVEN) {
        if (series.seriesType() == anychart.enums.TimelineSeriesType.RANGE) {
          series.autoDirection(directions[rangeNum & 1]);
          rangeNum++;
        } else if (series.seriesType() == anychart.enums.TimelineSeriesType.MOMENT) {
          series.autoDirection(directions[eventNum & 1]);
          eventNum++;
        }
      }

      if (series.getOption('direction') == anychart.enums.Direction.AUTO) {
        if (series.seriesType() == anychart.enums.TimelineSeriesType.RANGE) {
          series.autoDirection(anychart.enums.Direction.UP);
          rangeNum++;
        } else if (series.seriesType() == anychart.enums.TimelineSeriesType.MOMENT) {
          series.autoDirection(anychart.enums.Direction.UP);
          eventNum++;
        }
      }
      //endregion

      //region searching min/max values
      var it = series.getResetIterator();
      if (seriesType == anychart.enums.TimelineSeriesType.MOMENT) {
        while (it.advance()) {
          var date = anychart.utils.normalizeTimestamp(it.get('x'));
          dateMin = Math.min(dateMin, date);
          dateMax = Math.max(dateMax, date);
        }
      } else if (seriesType == anychart.enums.TimelineSeriesType.RANGE) {
        while (it.advance()) {
          var start = anychart.utils.normalizeTimestamp(it.get('start'));
          var end = anychart.utils.normalizeTimestamp(it.get('end'));
          if (!isNaN(end)) {
            dateMin = Math.min(dateMin, end);
            dateMax = Math.max(dateMax, end);
          }

          dateMin = Math.min(dateMin, start);
          dateMax = Math.max(dateMax, start);
        }
      }
      //endregion

      //region obtaining drawing plan for series
      var drawingPlan = series.getScatterDrawingPlan(false, true);
      this.drawingPlans.push(drawingPlan);
      if (seriesType == anychart.enums.TimelineSeriesType.RANGE) {
        this.drawingPlansRange.push(drawingPlan);
      } else {
        this.drawingPlansEvent.push(drawingPlan);
      }
      //endregion


    }

    var markers = goog.array.concat(
        this.lineAxesMarkers_,
        this.rangeAxesMarkers_,
        this.textAxesMarkers_,
        [this.todayMarker_]);

    var valuesToConsider = [];

    for (var mid = 0; mid < markers.length; mid++) {
      var m = markers[mid];
      if (m) {
        if (m.getOption('scaleRangeMode') == anychart.enums.ScaleRangeMode.CONSIDER) {
          var refVals = m.getReferenceValues();
          for (var valId = 0; valId < refVals.length; valId++) {
            valuesToConsider.push(anychart.format.parseDateTime(refVals[valId]).getTime());
          }
        }
      }
    }

    var markersMin = Math.min.apply(null, valuesToConsider);
    var markersMax = Math.max.apply(null, valuesToConsider);

    dateMin = Math.min(dateMin, markersMin);
    dateMax = Math.max(dateMax, markersMax);

    if (dateMin == dateMax) {
      var day = anychart.utils.getIntervalRange(anychart.enums.Interval.DAY, 1);
      dateMin -= day / 2;
      dateMax += day / 2;
    }

    var rangeChanged = (this.dateMin != dateMin || this.dateMax != dateMax);

    if (rangeChanged) {
      this.dateMin = dateMin;
      this.dateMax = dateMax;

      this.scale().setDataRange(this.dateMin, this.dateMax);

      this.scale().suspendSignalsDispatching();
      this.scale().fitAll();
      this.scale().resumeSignalsDispatching(false);
    }



    //region populate array of intersecting bounds
    /** @type {anychart.timelineModule.Intersections.Range} */
    var pointBounds;
    var sX, eX, sY, eY, direction, pointId;
    var k, point;
    var data;
    for (var i = 0; i < this.drawingPlansRange.length; i++) {
      var drawingPlan = this.drawingPlansRange[i];
      data = drawingPlan.data;
      series = drawingPlan.series;
      var maxTotalRange = this.scale().getTotalRange()['max'];
      for (k = 0; k < data.length; k++) {
        it = series.getResetIterator();
        it.select(k);
        point = data[k];

        var startValue = it.get('start');
        if (!goog.isDefAndNotNull(startValue) || isNaN(startValue) || !goog.isDefAndNotNull(it.get('name'))) {
          it.meta('missing', true);
          continue;
        }

        sX = this.scale().transform(point.data['start']) * this.dataBounds.width;
        eX = isNaN(point.data['end']) ? this.scale().transform(maxTotalRange) * this.dataBounds.width :
            this.scale().transform(point.data['end']) * this.dataBounds.width;
        sY = 0;
        eY = anychart.utils.normalizeSize(series.getOption('height'), this.dataBounds.height);
        direction = series.getFinalDirection();
        pointId = k;

        pointBounds = {
          sX: sX,
          eX: eX,
          sY: sY,
          eY: eY,
          direction: direction,
          series: series,
          pointId: pointId,
          drawingPlan: this.drawingPlansRange[i]
        };

        intersectingBounds.push(pointBounds);
        intersectingBoundsRange.push(pointBounds);
        if (direction == anychart.enums.Direction.UP) {
          intersectingBoundsRangeUp.push(pointBounds);
        } else {
          intersectingBoundsRangeDown.push(pointBounds);
        }
        point.meta['axisHeight'] = axisHeight;
      }
    }

    for (var i = 0; i < this.drawingPlansEvent.length; i++) {
      var drawingPlan = this.drawingPlansEvent[i];
      series = drawingPlan.series;
      data = this.drawingPlansEvent[i].data;
      var labelsFactory = series.labels();
      var markersFactory = series.markers();
      var markersFactoryEnabled = markersFactory.enabled();
      var markersFactorySize = markersFactoryEnabled ? markersFactory.getOption('size') : 0;
      for (k = 0; k < data.length; k++) {
        var it = series.getResetIterator();
        it.select(k);

        if (!goog.isDefAndNotNull(it.get('value')) || !goog.isDefAndNotNull(it.get('x'))) {
          it.meta('missing', true);
          continue;
        }

        var label = labelsFactory.getLabel(k);// = factory.add(formatProvider, positionProvider);
        if (goog.isNull(label)) {
          var formatProvider = series.createLabelsContextProvider();
          var text = it.get('value');
          formatProvider['value'] = text;
          var positionProvider = series.createPositionProvider(series.labels().anchor());
          label = labelsFactory.add(formatProvider, positionProvider);
        }
        label.draw();
        var bounds = label.getTextElement().getBounds();
        if (labelsFactory.background().enabled())
          bounds = labelsFactory.padding().widenBounds(bounds);

        // var offsetX = label.getFinalSettings('offsetX') || 0;
        var offsetX = labelsFactory.getOption('offsetX') || 0;

        point = data[k];
        sX = this.scale().transform(point.data['x']) * this.dataBounds.width - markersFactorySize;
        eX = sX + bounds.width + offsetX + markersFactorySize;
        sY = 50 - bounds.height / 2;
        eY = 50 + bounds.height / 2;
        direction = series.getFinalDirection();
        pointId = k;

        pointBounds = {
          sX: sX,
          eX: eX,
          sY: sY,
          eY: eY,
          direction: direction,
          series: series,
          pointId: pointId,
          drawingPlan: this.drawingPlansEvent[i],
          text: text
        };

        intersectingBounds.push(pointBounds);
        intersectingBoundsEvent.push(pointBounds);

        if (direction == anychart.enums.Direction.UP) {
          intersectingBoundsEventUp.push(pointBounds);
        } else {
          intersectingBoundsEventDown.push(pointBounds);
        }

        point.meta['axisHeight'] = axisHeight;
      }
    }
    //endregion

    goog.array.sort(intersectingBoundsRangeUp, anychart.timelineModule.Chart.rangeSortCallback);
    goog.array.sort(intersectingBoundsRangeDown, anychart.timelineModule.Chart.rangeSortCallback);

    goog.array.sort(intersectingBoundsEventUp, anychart.timelineModule.Chart.momentSortCallback);
    goog.array.sort(intersectingBoundsEventDown, anychart.timelineModule.Chart.momentSortCallback);

    var scaleTotalRange = this.scale().getTotalRange();

    this.totalRange = {
      sX: +Infinity,
      eX: -Infinity,
      sY: +Infinity,
      eY: -Infinity
    };
    this.totalRange.sX = Math.min(this.totalRange.sX, this.scale().transform(scaleTotalRange.min) * this.dataBounds.width);
    this.totalRange.eX = Math.max(this.totalRange.eX, this.scale().transform(scaleTotalRange.max) * this.dataBounds.width);

    //region upper range and event overlap calculation
    var rangeSeries = [];

    var intersectionsUpper = new anychart.timelineModule.Intersections();

    for (var i = 0; i < intersectingBoundsRangeUp.length; i++) {
      var range = intersectingBoundsRangeUp[i];

      /*
      Note! Per point zIndex doesn't work cross series. We have to set zIndexes by series first
      and then inside series we can use per point zIndex.
       */
      if (range && rangeSeries.indexOf(range.series) == -1) {
        range.series.zIndex(anychart.timelineModule.Chart.RANGE_BASE_Z_INDEX - rangeSeries.length / 100);
        rangeSeries.push(range.series);
      }

      var id = range.pointId;
      var drawingPlanData = range.drawingPlan.data[id];
      intersectionsUpper.add(range, true);
      this.enlargeTotalRange_(range);
      drawingPlanData.meta['startY'] = range.sY;
      drawingPlanData.meta['endY'] = range.eY;
      drawingPlanData.meta['stateZIndex'] = 1 - range.eY / 1000000;
    }

    for (var i = intersectingBoundsEventUp.length - 1; i >= 0; i--) {
      var range = intersectingBoundsEventUp[i];
      var id = range.pointId;
      intersectionsUpper.add(range);
      this.enlargeTotalRange_(range);
      var drawingPlanData = range.drawingPlan.data[id];
      drawingPlanData.meta['minLength'] = range.sY + (range.eY - range.sY) / 2;
    }
    //endregion

    //region lower range and event overlap calculation
    var intersectionsLower = new anychart.timelineModule.Intersections();

    rangeSeries = [];
    for (var i = 0; i < intersectingBoundsRangeDown.length; i++) {
      var range = intersectingBoundsRangeDown[i];

      /*
      Note! Per point zIndex doesn't work cross series. We have to set zIndexes by series first
      and then inside series we can use per point zIndex.
       */
      if (range && rangeSeries.indexOf(range.series) == -1) {
        range.series.zIndex(anychart.timelineModule.Chart.RANGE_BASE_Z_INDEX - rangeSeries.length / 100);
        rangeSeries.push(range.series);
      }

      var id = range.pointId;
      var drawingPlanData = range.drawingPlan.data[id];
      intersectionsLower.add(range, true);
      drawingPlanData.meta['startY'] = range.sY;
      drawingPlanData.meta['endY'] = range.eY;
      drawingPlanData.meta['stateZIndex'] = 1 - range.eY / 1000000;
      this.enlargeTotalRange_({sX: range.sX, eX: range.eX, sY: -range.eY, eY: -range.sY});
    }

    for (var i = intersectingBoundsEventDown.length - 1; i >= 0; i--) {
      var range = intersectingBoundsEventDown[i];
      var id = range.pointId;
      intersectionsLower.add(range);
      var drawingPlanData = range.drawingPlan.data[id];
      drawingPlanData.meta['minLength'] = range.sY + (range.eY - range.sY) / 2;
      this.enlargeTotalRange_({sX: range.sX, eX: range.eX, sY: -range.eY, eY: -range.sY});
    }
    //endregion

    //fixing white space under the axis
    var halfAxisHeight = axisHeight / 2;

    this.totalRange.sY -= halfAxisHeight;
    this.totalRange.eY += halfAxisHeight;

    var scroller = this.getCreated('scroller');
    var scrollerOrientation;
    var scrollerHeightTop = 0;
    var scrollerHeightBottom = 0;
    if (scroller && scroller.enabled()) {
      scrollerOrientation = scroller.getOption('orientation');
      var scrollerHeight = /** @type {number} */(scroller.getOption('height'));
      switch (scrollerOrientation) {
        case anychart.enums.Orientation.TOP:
          scrollerHeightTop = scrollerHeight;
          break;
        case anychart.enums.Orientation.BOTTOM:
          scrollerHeightBottom = scrollerHeight;
          break;
      }
    }

    if (this.autoChartTranslating) {
      if (this.totalRange.sY > -(this.dataBounds.height / 2) && this.totalRange.eY > (this.dataBounds.height / 2)) {
        this.verticalTranslate = this.totalRange.sY + this.dataBounds.height / 2 - halfAxisHeight - scrollerHeightBottom;
        this.invalidateState(anychart.enums.Store.TIMELINE_CHART, anychart.timelineModule.Chart.States.SCROLL, anychart.Signal.NEEDS_REDRAW);
      } else if (this.totalRange.eY < (this.dataBounds.height / 2) && this.totalRange.sY < -(this.dataBounds.height / 2)) {//white space over the axis
        this.verticalTranslate = this.totalRange.eY - this.dataBounds.height / 2 + halfAxisHeight + scrollerHeightTop;
        this.invalidateState(anychart.enums.Store.TIMELINE_CHART, anychart.timelineModule.Chart.States.SCROLL, anychart.Signal.NEEDS_REDRAW);
      }
    }
    this.momentSeriesList = eventSeriesList;
    this.rangeSeriesList = rangeSeriesList;

    // var maxVisibleDate = this.scale().inverseTransform(this.totalRange.eX / this.dataBounds.width);
    // if (maxVisibleDate > this.dateMax) {
    //   this.scale().setDataRange(this.dateMin, maxVisibleDate);
    // }
  }
};


/**
 * Callback used for range series bounds sorting.
 * @param {anychart.timelineModule.Intersections.Range} a
 * @param {anychart.timelineModule.Intersections.Range} b
 * @return {number}
 */
anychart.timelineModule.Chart.rangeSortCallback = function(a, b) {
  var diff = a.sX - b.sX;
  if (diff == 0) {
    return b.eX - a.eX;
  }
  return diff;
};


/**
 * Callback used for event series bounds sorting.
 * @param {anychart.timelineModule.Intersections.Range} a
 * @param {anychart.timelineModule.Intersections.Range} b
 * @return {number}
 */
anychart.timelineModule.Chart.momentSortCallback = function(a, b) {
  var diff = a.sX - b.sX;
  if (diff == 0) {
    return a.eX - b.eX;
  }
  return diff;
};


/**
 * Widens total range of chart with passed range.
 * @param {anychart.timelineModule.Intersections.Range} range
 * @private
 */
anychart.timelineModule.Chart.prototype.enlargeTotalRange_ = function(range) {
  this.totalRange.sX = Math.min(this.totalRange.sX, range.sX);
  this.totalRange.eX = Math.max(this.totalRange.eX, range.eX);
  this.totalRange.sY = Math.min(this.totalRange.sY, range.sY);
  this.totalRange.eY = Math.max(this.totalRange.eY, range.eY);
};


/** @inheritDoc */
anychart.timelineModule.Chart.prototype.drawContent = function(bounds) {
  if (this.isConsistent())
    return;

  if (!this.timelineLayer_) {
    this.timelineLayer_ = this.rootElement.layer();
    this.timelineLayer_.zIndex(1);
  }

  /*
  Separate layer for axes markers to keep them in the visible area on vertical scroll.
   */
  if (!this.axesMarkersLayer_) {
    this.axesMarkersLayer_ = this.rootElement.layer();
    this.axesMarkersLayer_.zIndex(0.5);
  }

  if (!this.axisLayer_) {
    this.axisLayer_ = this.rootElement.layer();
    this.axisLayer_.zIndex(1);
  }

  if (this.hasInvalidationState(anychart.ConsistencyState.BOUNDS)) {
    this.dataBounds = bounds.clone();
    this.invalidate(anychart.ConsistencyState.AXES_CHART_AXES | anychart.ConsistencyState.SERIES_CHART_SERIES |
        anychart.ConsistencyState.AXES_CHART_AXES_MARKERS | anychart.ConsistencyState.CARTESIAN_X_SCROLLER);
    this.invalidateState(anychart.enums.Store.TIMELINE_CHART, anychart.timelineModule.Chart.States.SCROLL);
    this.markConsistent(anychart.ConsistencyState.BOUNDS);
  }

  // calculate needs data bounds populated for event series overlap processing
  this.calculate();

  var scroller = this.getCreated('scroller');
  var axis = this.getCreated('axis');

  if (this.hasInvalidationState(anychart.ConsistencyState.CARTESIAN_X_SCROLLER)) {
    if (scroller) {
      scroller.container(this.rootElement);
      scroller.parentBounds(this.dataBounds);
      scroller.draw();
    }
    this.markConsistent(anychart.ConsistencyState.CARTESIAN_X_SCROLLER);
  }

  if (this.hasStateInvalidation(anychart.enums.Store.TIMELINE_CHART, anychart.timelineModule.Chart.States.SCROLL)) {
    var matrix = this.timelineLayer_.getTransformationMatrix();

    //fix horizontal translate going places
    if (this.totalRange && (this.horizontalTranslate + this.dataBounds.getRight() > (this.totalRange.eX + this.dataBounds.left))) {
      this.horizontalTranslate = (this.totalRange.eX - this.dataBounds.getRight() + this.dataBounds.left);
    }
    else if (this.totalRange && (this.horizontalTranslate + this.dataBounds.getLeft() < (this.totalRange.sX + this.dataBounds.left))) {
      this.horizontalTranslate = (this.totalRange.sX - this.dataBounds.getLeft() + this.dataBounds.left);
    }

    //fix vertical translate going places
    if (this.totalRange && (this.verticalTranslate + this.dataBounds.height / 2 > Math.max(this.totalRange.eY, this.dataBounds.height / 2))) {
      this.verticalTranslate = Math.max(this.totalRange.eY - this.dataBounds.height / 2, 0);
    } else if (this.totalRange && (this.verticalTranslate - this.dataBounds.height / 2 < Math.min(this.totalRange.sY, -(this.dataBounds.height / 2)))) {
      this.verticalTranslate = Math.min(this.totalRange.sY + this.dataBounds.height / 2, 0);
    }

    matrix[4] = -this.horizontalTranslate;
    matrix[5] = this.verticalTranslate;
    this.timelineLayer_.setTransformationMatrix.apply(this.timelineLayer_, matrix);

    var clipBounds = this.dataBounds.clone();
    clipBounds.left += this.horizontalTranslate;
    clipBounds.top -= this.verticalTranslate;
    this.timelineLayer_.clip(clipBounds);

    //remove verticalTranslation for axes markers
    matrix[5] = 0;
    this.axesMarkersLayer_.setTransformationMatrix.apply(this.axesMarkersLayer_, matrix);
    clipBounds.top = this.dataBounds.top;
    this.axesMarkersLayer_.clip(clipBounds);

    //make axis stick to lower and upper bounds of viewport
    var axisVerticalTranslate = this.verticalTranslate;
    var axisHeightHalf = 0;
    if (axis) {
      axisHeightHalf = /** @type {number} */(axis.getOption('height')) / 2;
    }

    var scrollerHeightTop = 0;
    var scrollerHeightBottom = 0;
    var scrollerOrientation;
    if (scroller && scroller.enabled()) {
      var scrollerHeight = /** @type {number} */(scroller.getOption('height'));
      scrollerOrientation = /** @type {anychart.enums.Orientation} */(scroller.getOption('orientation'));
      if (scrollerOrientation == anychart.enums.Orientation.TOP) {
        scrollerHeightTop = scrollerHeight;
      } else if (scrollerOrientation == anychart.enums.Orientation.BOTTOM) {
        scrollerHeightBottom = scrollerHeight;
      }
    }

    clipBounds = this.dataBounds.clone();
    clipBounds.left += this.horizontalTranslate;
    if (this.verticalTranslate > (this.dataBounds.height / 2 - axisHeightHalf) - scrollerHeightBottom) {
      axisVerticalTranslate = this.dataBounds.height / 2 - axisHeightHalf - scrollerHeightBottom;
    } else if (this.verticalTranslate < -(this.dataBounds.height / 2) + axisHeightHalf + scrollerHeightTop) {
      axisVerticalTranslate = -(this.dataBounds.height / 2) + axisHeightHalf + scrollerHeightTop;
    }
    matrix[5] = axisVerticalTranslate;
    this.axisLayer_.setTransformationMatrix.apply(this.axisLayer_, matrix);
    this.axisLayer_.clip(clipBounds);

    //redraw series labels on scroll to fit them into visible area if possible
    for (var i = 0; i < this.rangeSeriesList.length; i++) {
      var series = this.rangeSeriesList[i];
      series.invalidate(anychart.ConsistencyState.SERIES_LABELS);
      series.parentBounds(this.dataBounds);
      series.container(this.timelineLayer_);
      series.draw();
    }
    this.markStateConsistent(anychart.enums.Store.TIMELINE_CHART, anychart.timelineModule.Chart.States.SCROLL);
  }

  if (this.hasInvalidationState(anychart.ConsistencyState.SCALE_CHART_SCALES)) {
    if (axis) {
      axis.scale(this.scale());
    }
    this.invalidate(anychart.ConsistencyState.SERIES_CHART_SERIES | anychart.ConsistencyState.AXES_CHART_AXES |
        anychart.ConsistencyState.AXES_CHART_AXES_MARKERS);
    this.markConsistent(anychart.ConsistencyState.SCALE_CHART_SCALES);
  }

  if (this.hasInvalidationState(anychart.ConsistencyState.SERIES_CHART_SERIES)) {
    for (var i = 0; i < this.seriesList.length; i++) {
      var series = this.seriesList[i];
      series.parentBounds(this.dataBounds);
      series.container(this.timelineLayer_);
      series.draw();
    }

    this.markConsistent(anychart.ConsistencyState.SERIES_CHART_SERIES);
  }

  if (this.hasInvalidationState(anychart.ConsistencyState.AXES_CHART_AXES)) {
    if (axis) {
      axis.parentBounds(this.dataBounds);
      axis.container(this.axisLayer_);
      axis.draw();
    }
    this.markConsistent(anychart.ConsistencyState.AXES_CHART_AXES);
  }

  if (this.hasInvalidationState(anychart.ConsistencyState.AXES_CHART_AXES_MARKERS)) {
    var markers = goog.array.concat(
        this.lineAxesMarkers_,
        this.rangeAxesMarkers_,
        this.textAxesMarkers_,
        [this.todayMarker_]);

    for (i = 0; i < markers.length; i++) {
      var axesMarker = markers[i];

      if (axesMarker) {
        /*
        When scale range changes - markers (except from text marker) do not redraw themselves.
        Invalidating their bounds fixes this problem.
        */
        axesMarker.invalidate(anychart.ConsistencyState.BOUNDS);

        axesMarker.suspendSignalsDispatching();
        if (!axesMarker.scale())
          axesMarker.autoScale(this.xScale_);
        axesMarker.parentBounds(this.dataBounds);
        axesMarker.container(this.axesMarkersLayer_);
        axesMarker.draw();
        axesMarker.resumeSignalsDispatching(false);
      }
    }
    this.markConsistent(anychart.ConsistencyState.AXES_CHART_AXES_MARKERS);
  }

  if (!this.mouseWheelHandler_) {
    this.mouseWheelHandler_ = new goog.events.MouseWheelHandler(
        this.container().getStage().getDomWrapper(), false);
    this.mouseWheelHandler_.listen('mousewheel', this.handleMouseWheel_, false, this);
  }
};


/**
 * @param {goog.events.MouseWheelEvent} event
 * @private
 */
anychart.timelineModule.Chart.prototype.handleMouseWheel_ = function(event) {
  var range = this.scale().getRange();
  var totalRange = this.scale().getTotalRange();
  var ratio = 0.1;//how much of current range we want to cut after zoom
  var matrix;

  var dx = event['deltaX'];
  var dy = event['deltaY'];

  if (goog.userAgent.WINDOWS) {
    dx *= 15;
    dy *= 15;
  }

  var currentDate, leftDate, rightDate;

  if (!event['shiftKey'] && this.interactivity().getOption('zoomOnMouseWheel')) {//zooming
    event.preventDefault();
    var zoomIn = event['deltaY'] < 0;
    if ((range['min']) <= totalRange['min'] && (range['max']) >= totalRange['max'] && !zoomIn)
      return;

    var mouseX = event['clientX'];

    currentDate = this.scale().inverseTransform((mouseX + this.horizontalTranslate) / this.dataBounds.width);
    leftDate = this.scale().inverseTransform(this.horizontalTranslate / this.dataBounds.width);
    rightDate = this.scale().inverseTransform((this.horizontalTranslate + this.dataBounds.width) / this.dataBounds.width);

    this.suspendSignalsDispatching();
    var anchor = (mouseX - this.dataBounds.left) / this.dataBounds.width;
    if (zoomIn) {
      this.zoomIn(1.2, anchor);
    } else {
      this.zoomOut(1.2, anchor);
    }
    this.resumeSignalsDispatching(true);
  }
};


/**
 * Translate chart using given offsets.
 * @param {number} dx
 * @param {number} dy
 */
anychart.timelineModule.Chart.prototype.move = function(dx, dy) {
  this.moveTo(this.horizontalTranslate + dx, this.verticalTranslate - dy);
};


/**
 * Translate chart using x and y.
 * @param {number} x
 * @param {number} y
 */
anychart.timelineModule.Chart.prototype.moveTo = function(x, y) {
  var range = this.scale().getRange();
  var totalRange = this.scale().getTotalRange();

  var dx = x - this.horizontalTranslate;
  var dy = y - this.verticalTranslate;

  if (this.timelineLayer_) {
    var matrix = this.timelineLayer_.getTransformationMatrix();
    this.horizontalTranslate = x;
    this.verticalTranslate = y;

    if (dx != 0) {
      if (this.horizontalTranslate + this.dataBounds.getRight() > (this.totalRange.eX + this.dataBounds.left)) {
        this.horizontalTranslate = (this.totalRange.eX - this.dataBounds.getRight() + this.dataBounds.left);
      }
      else if (this.horizontalTranslate + this.dataBounds.getLeft() < (this.totalRange.sX + this.dataBounds.left)) {
        this.horizontalTranslate = (this.totalRange.sX - this.dataBounds.getLeft() + this.dataBounds.left);
      }
    }

    if (dy != 0) {
      if (this.verticalTranslate + this.dataBounds.height / 2 > Math.max(this.totalRange.eY, (this.dataBounds.height / 2))) {
        this.verticalTranslate = Math.max(this.totalRange.eY, (this.dataBounds.height / 2)) - this.dataBounds.height / 2;
      }
      else if (this.verticalTranslate - this.dataBounds.height / 2 < Math.min(this.totalRange.sY, -(this.dataBounds.height / 2))) {
        this.verticalTranslate = Math.min(this.totalRange.sY, -(this.dataBounds.height / 2)) + this.dataBounds.height / 2;
      }
    }

    var leftDate = this.scale().inverseTransform(this.horizontalTranslate / this.dataBounds.width);
    var rightDate = this.scale().inverseTransform((this.horizontalTranslate + this.dataBounds.width) / this.dataBounds.width);
    var offset = leftDate - range['min'];

    var delta = totalRange['max'] - totalRange['min'];
    var scroller = this.scroller();
    this.scroller().setRangeInternal((leftDate - totalRange['min']) / delta, (rightDate - totalRange['min']) / delta);

    //this is hack to redraw axis ticks and labels using offset
    this.suspendSignalsDispatching();

    this.invalidate(anychart.ConsistencyState.AXES_CHART_AXES);
    this.axis().offset(offset);
    this.invalidateState(anychart.enums.Store.TIMELINE_CHART, anychart.timelineModule.Chart.States.SCROLL, anychart.Signal.NEEDS_REDRAW);

    this.resumeSignalsDispatching(true);
  }
};


/**
 * Initialises mouse drag interactivity.
 * @private
 */
anychart.timelineModule.Chart.prototype.initInteractivity_ = function() {
  goog.events.listen(document, goog.events.EventType.MOUSEDOWN, this.mouseDownHandler, false, this);
};


/**
 *
 * @param {anychart.core.MouseEvent} event
 */
anychart.timelineModule.Chart.prototype.mouseDownHandler = function(event) {
  var bounds = this.dataBounds;

  var scroller = this.getCreated('scroller');
  if (scroller && scroller.enabled()) {
    bounds = scroller.getRemainingBounds();
  }

  var containerPosition = this.container().getStage().getClientPosition();
  var insideBounds = bounds &&
      event.clientX >= bounds.left + containerPosition.x &&
      event.clientX <= bounds.left + containerPosition.x + bounds.width &&
      event.clientY >= bounds.top + containerPosition.y &&
      event.clientY <= bounds.top + containerPosition.y + bounds.height;
  if (insideBounds) {
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.startTranslateHorizontal = this.horizontalTranslate;
    this.startTranslateVertical = this.verticalTranslate;

    goog.events.listen(document, goog.events.EventType.MOUSEMOVE, this.mouseMoveHandler, true, this);
    goog.events.listen(document, goog.events.EventType.MOUSEUP, this.mouseUpHandler, true, this);
  }
};


/**
 *
 * @param {anychart.core.MouseEvent} event
 */
anychart.timelineModule.Chart.prototype.mouseMoveHandler = function(event) {
  this.autoChartTranslating = false;
  this.move((this.startX - event.clientX), (this.startY - event.clientY));
  this.startX = event.clientX;
  this.startY = event.clientY;
};


/**
 *
 * @param {anychart.core.MouseEvent} event
 */
anychart.timelineModule.Chart.prototype.mouseUpHandler = function(event) {
  goog.events.unlisten(document, goog.events.EventType.MOUSEMOVE, this.mouseMoveHandler, true, this);
  goog.events.unlisten(document, goog.events.EventType.MOUSEUP, this.mouseUpHandler, true, this);
};


/**
 *
 * @param {Object=} opt_value
 * @return {anychart.timelineModule.Chart|anychart.timelineModule.Axis}
 */
anychart.timelineModule.Chart.prototype.axis = function(opt_value) {
  if (!this.axis_) {
    this.axis_ = new anychart.timelineModule.Axis();
    this.axis_.listenSignals(this.axisInvalidated_, this);
    anychart.measuriator.register(this.axis_);
    this.setupCreated('axis', this.axis_);
  }

  if (goog.isDef(opt_value)) {
    this.axis_.setup(opt_value);
    return this;
  }

  return this.axis_;
};


/** @inheritDoc */
anychart.timelineModule.Chart.prototype.xScale = function() {
  return this.scale();
};


/**
 * @param {anychart.SignalEvent} event
 * @private
 */
anychart.timelineModule.Chart.prototype.axisInvalidated_ = function(event) {
  var consistency = anychart.ConsistencyState.AXES_CHART_AXES;
  if (event.hasSignal(anychart.Signal.ENABLED_STATE_CHANGED | anychart.Signal.NEEDS_RECALCULATION)) {
    consistency |= anychart.ConsistencyState.SERIES_CHART_SERIES | anychart.ConsistencyState.BOUNDS;
  }
  this.invalidate(consistency, anychart.Signal.NEEDS_REDRAW);
};


/**
 *
 * @param {Object=} opt_value Scale configuration.
 * @return {anychart.timelineModule.Chart|anychart.scales.GanttDateTime} Scale instance or chart.
 */
anychart.timelineModule.Chart.prototype.scale = function(opt_value) {
  if (goog.isDef(opt_value)) {
    this.xScale_.setup(opt_value);
    return this;
  }

  return this.xScale_;
};


/**
 * Sets custom zoom levels for timeline scale.
 * @param {anychart.scales.GanttDateTime} scale
 * @private
 */
anychart.timelineModule.Chart.prototype.initScale_ = function(scale) {
  var levels = [
    [{'unit': 'minute', 'count': 10}, {'unit': 'hour', 'count': 1}, {'unit': 'day', 'count': 1}],
    [{'unit': 'hour', 'count': 4}, {'unit': 'hour', 'count': 12}, {'unit': 'day', 'count': 1}],
    [{'unit': 'day', 'count': 1}, {'unit': 'day', 'count': 2}, {'unit': 'week', 'count': 1}],
    [{'unit': 'day', 'count': 2}, {'unit': 'week', 'count': 1}, {'unit': 'month', 'count': 1}],
    [{'unit': 'month', 'count': 1}, {'unit': 'quarter', 'count': 1}, {'unit': 'year', 'count': 1}],
    [{'unit': 'quarter', 'count': 1}, {'unit': 'year', 'count': 1}, {'unit': 'year', 'count': 10}],
    [{'unit': 'year', 'count': 1}, {'unit': 'year', 'count': 10}, {'unit': 'year', 'count': 50}],
    [{'unit': 'year', 'count': 10}, {'unit': 'year', 'count': 50}, {'unit': 'year', 'count': 200}]
  ];
  scale.zoomLevels(levels);
};


/**
 * @param {anychart.SignalEvent} event
 * @private
 */
anychart.timelineModule.Chart.prototype.scaleInvalidated_ = function(event) {
  if (event.hasSignal(anychart.Signal.NEEDS_RECALCULATION)) {
    this.updateZoomState_();
    this.moveTo(0, this.verticalTranslate);
    this.invalidate(anychart.ConsistencyState.SCALE_CHART_SCALES | anychart.ConsistencyState.AXES_CHART_AXES, anychart.Signal.NEEDS_REDRAW);
  }
};


/** @inheritDoc */
anychart.timelineModule.Chart.prototype.createSeriesInstance = function(type, config) {
  if (type == anychart.enums.TimelineSeriesType.MOMENT) {
    return new anychart.timelineModule.series.Moment(this, this, type, config, true);
  } else {
    return new anychart.timelineModule.series.Range(this, this, type, config, true);
  }
};


/** @inheritDoc */
anychart.timelineModule.Chart.prototype.getYAxisByIndex = function(index) {
  return null;
};


/** @inheritDoc */
anychart.timelineModule.Chart.prototype.getXAxisByIndex = function(index) {
  return null;
};


/** @inheritDoc */
anychart.timelineModule.Chart.prototype.yScale = function() {
  if (!this.yScale_) {
    this.yScale_ = new anychart.scales.Linear();
  }
  return this.yScale_;
};


/** @inheritDoc */
anychart.timelineModule.Chart.prototype.isVertical = function(opt_value) {
  return false;
};


/**
 *
 * @param {string|number|Date} startDate
 * @param {string|number|Date} endDate
 * @return {anychart.timelineModule.Chart}
 */
anychart.timelineModule.Chart.prototype.zoomTo = function(startDate, endDate) {
  this.suspendSignalsDispatching();
  var startTimestamp = anychart.utils.normalizeTimestamp(startDate);
  var endTimestamp = anychart.utils.normalizeTimestamp(endDate);
  this.scale().zoomTo(startTimestamp, endTimestamp);
  var scroller = this.getCreated('scroller');
  if (scroller) {
    var totalRange = this.scale().getTotalRange();
    var delta = totalRange['max'] - totalRange['min'];
    scroller.setRangeInternal((startTimestamp - totalRange['min']) / delta, (endTimestamp - totalRange['min']) / delta);
  }
  this.resumeSignalsDispatching(true);
  return this;
};


/**
 * Reset zoom/scroll manipulations.
 * @return {anychart.timelineModule.Chart}
 */
anychart.timelineModule.Chart.prototype.fitAll = function() {
  this.suspendSignalsDispatching();
  this.autoChartTranslating = true;
  this.scroll(0);
  this.scale().fitAll();
  this.invalidate(anychart.ConsistencyState.SCALE_CHART_SCALES, anychart.Signal.NEEDS_REDRAW);
  this.resumeSignalsDispatching(true);
  return this;
};


/**
 * Scrolls chart vertically.
 * @param {number=} opt_value scroll value, negative means showing upper half of chart, positive - lower half,
 * zero - center chart.
 * @return {number|anychart.timelineModule.Chart}
 */
anychart.timelineModule.Chart.prototype.scroll = function(opt_value) {
  if (goog.isDef(opt_value)) {
    opt_value = +opt_value;
    if (this.scroll_ != opt_value) {
      this.scroll_ = opt_value;
      if (this.scroll_ > 0) {
        this.verticalTranslate = - this.dataBounds.height / 2;
      } else if (this.scroll_ < 0) {
        this.verticalTranslate = this.dataBounds.height / 2;
      } else {
        this.verticalTranslate = 0;
      }
      this.invalidateState(anychart.enums.Store.TIMELINE_CHART, anychart.timelineModule.Chart.States.SCROLL, anychart.Signal.NEEDS_REDRAW);
      return this;
    }
  }

  return this.scroll_;
};


/** @inheritDoc */
anychart.timelineModule.Chart.prototype.getType = function() {
  return anychart.enums.ChartTypes.TIMELINE;
};


/**
 * Scroller getter/setter.
 * @param {(Object|boolean|null)=} opt_value Chart scroller settings.
 * @return {anychart.core.ui.ChartScroller|anychart.timelineModule.Chart} Itself for chaining.
 */
anychart.timelineModule.Chart.prototype.scroller = function(opt_value) {
  if (!this.scroller_) {
    this.scroller_ = new anychart.core.ui.ChartScroller();
    this.scroller_.setParentEventTarget(this);
    this.scroller_.listenSignals(this.scrollerInvalidated_, this);
    this.eventsHandler.listen(this.scroller_, anychart.enums.EventType.SCROLLER_CHANGE, this.scrollerChangeHandler);
    this.eventsHandler.listen(this.scroller_, anychart.enums.EventType.SCROLLER_CHANGE_FINISH, this.scrollerChangeHandler);
    this.setupCreated('scroller', this.scroller_);
    this.invalidate(
        anychart.ConsistencyState.CARTESIAN_X_SCROLLER |
        anychart.ConsistencyState.BOUNDS,
        anychart.Signal.NEEDS_REDRAW);
  }

  if (goog.isDef(opt_value)) {
    this.scroller_.setup(opt_value);
    return this;
  } else {
    return this.scroller_;
  }
};


/**
 * Scroller invalidation handler.
 * @param {anychart.SignalEvent} event
 * @private
 */
anychart.timelineModule.Chart.prototype.scrollerInvalidated_ = function(event) {
  var state = anychart.ConsistencyState.CARTESIAN_X_SCROLLER;
  var signal = anychart.Signal.NEEDS_REDRAW;
  if (event.hasSignal(anychart.Signal.BOUNDS_CHANGED)) {
    state |= anychart.ConsistencyState.BOUNDS;
    signal |= anychart.Signal.BOUNDS_CHANGED;
  }
  this.invalidate(state, signal);
};


/**
 * Scroller zoom change handler.
 * @param {anychart.core.ui.Scroller.ScrollerChangeEvent} event
 */
anychart.timelineModule.Chart.prototype.scrollerChangeHandler = function(event) {
  var totalRange = this.scale().getTotalRange();

  var totalRangeDelta = totalRange['max'] - totalRange['min'];

  var startRatio = event['startRatio'];
  var endRatio = event['endRatio'];

  var scrollerStart = totalRange['min'] + startRatio * totalRangeDelta;
  var scrollerEnd = totalRange['min'] + endRatio * totalRangeDelta;

  this.zoomTo(scrollerStart, scrollerEnd);
};


/**
 * Events overlap settings. Doesn't work and isn't public right now.
 * @param {*=} opt_value
 * @return {anychart.timelineModule.Chart|*}
 */
anychart.timelineModule.Chart.prototype.momentsOverlap = function(opt_value) {
  if (goog.isDef(opt_value)) {
    this.momentsOverlap_ = opt_value;
    return this;
  }
  return this.momentsOverlap_;
};


/**
 * Method for ui.Zoom.
 * @return {anychart.timelineModule.Chart}
 */
anychart.timelineModule.Chart.prototype.getCurrentScene = function() {
  return this;
};


/**
 * @param {number=} opt_zoomFactor How much to zoom in.
 * @param {number=} opt_anchor Number in [0; 1] range, telling which point in visible range we anchor to.
 * By default it's 0.5 (center).
 * @return {anychart.timelineModule.Chart}
 */
anychart.timelineModule.Chart.prototype.zoomIn = function(opt_zoomFactor, opt_anchor) {
  var defaultZoomFactor = 1.6;
  var scale = this.scale();
  var visibleRange = scale.getRange();
  var anchor = goog.isDef(opt_anchor) ? opt_anchor : 0.5;
  var tr = scale.getTotalRange()['max'] - scale.getTotalRange()['min'];

  var horizontalTranslateRatio = this.horizontalTranslate / this.dataBounds.width;
  var horizontalTranslateDate = scale.inverseTransform(horizontalTranslateRatio);
  visibleRange = {
    'min': horizontalTranslateDate,
    'max': horizontalTranslateDate + (visibleRange['max'] - visibleRange['min'])
  };

  opt_zoomFactor = opt_zoomFactor ? (1 / opt_zoomFactor) : (1 / defaultZoomFactor);
  var range = visibleRange['max'] - visibleRange['min'];

  /*
  Restrict maximum zoom to avoid ranges and axis disappear.
  This happens because they are drawn all the way from the start tick to the end one,
  thus going out of on-screen visible range.*/
  if ((range / tr) < 0.0002) {
    return this;
  }

  var msInterval = Math.round(range * (opt_zoomFactor - 1));
  var newMin = visibleRange['min'] - msInterval * anchor;
  var newMax = visibleRange['max'] + msInterval * (1 - anchor);
  if (Math.abs(newMin - newMax) <= anychart.scales.GanttDateTime.MILLISECONDS_IN_MINUTE) {
    var middle = (visibleRange['min'] + visibleRange['max']) / 2;
    newMin = middle - anychart.scales.GanttDateTime.MILLISECONDS_IN_MINUTE * anchor;
    newMax = middle + anychart.scales.GanttDateTime.MILLISECONDS_IN_MINUTE * (1 - anchor);
  }
  scale.zoomTo(newMin, newMax);
  return this;
};


/**
 * @param {number=} opt_zoomFactor How much to zoom out.
 * @param {number=} opt_anchor Number in [0; 1] range, telling which point in visible range we anchor to.
 * By default it's 0.5 (center).
 * @return {anychart.timelineModule.Chart}
 */
anychart.timelineModule.Chart.prototype.zoomOut = function(opt_zoomFactor, opt_anchor) {
  opt_zoomFactor = opt_zoomFactor || 1.6;
  var scale = this.scale();
  var visibleRange = scale.getRange();
  var anchor = goog.isDef(opt_anchor) ? opt_anchor : 0.5;

  var horizontalTranslateRatio = this.horizontalTranslate / this.dataBounds.width;
  var horizontalTranslateDate = scale.inverseTransform(horizontalTranslateRatio);
  visibleRange = {
    'min': horizontalTranslateDate,
    'max': horizontalTranslateDate + (visibleRange['max'] - visibleRange['min'])
  };

  var msInterval = Math.round((visibleRange['max'] - visibleRange['min']) * (opt_zoomFactor - 1));

  var newMin = visibleRange['min'] - msInterval * anchor;
  var newMax = visibleRange['max'] + msInterval * (1 - anchor);

  scale.zoomTo(newMin, newMax);
  return this;
};


/**
 * Update zoom state values to keep up with current scale zoom ranges.
 * @param {{min: number, max: number}=} opt_range
 * @private
 */
anychart.timelineModule.Chart.prototype.updateZoomState_ = function(opt_range) {
  var scale = this.scale();
  var totalRange = scale.getTotalRange();
  var range = opt_range || scale.getRange();

  var currentZoom = (totalRange['max'] - totalRange['min']) / (range['max'] - range['min']);
  this.zoomState = currentZoom;
  this.prevZoomState = currentZoom;
};


/**
 *
 * @return {anychart.math.Rect}
 */
anychart.timelineModule.Chart.prototype.getDataBounds = function() {
  return this.dataBounds.clone();
};


/**
 *
 * @return {number}
 */
anychart.timelineModule.Chart.prototype.getHorizontalTranslate = function() {
  return this.horizontalTranslate;
};


//endregion
//region -- Palette.
//endregion
//region -- Serialization/Deserialization.
/**
 * @inheritDoc
 */
anychart.timelineModule.Chart.prototype.setupByJSON = function(config, opt_default) {
  anychart.timelineModule.Chart.base(this, 'setupByJSON', config, opt_default);
  if (config['scale']) {
    this.scale(config['scale']);
  }

  if (config['axis']) {
    this.axis(config['axis']);
  }

  this.scroll(config['scroll']);

  this.setupElements(config['lineAxesMarkers'], this.lineMarker);
  this.setupElements(config['textAxesMarkers'], this.textMarker);
  this.setupElements(config['rangeAxesMarkers'], this.rangeMarker);

  this.setupSeriesByJSON(config);
};


/**
 * Creates series from passed json config.
 * @param {Object} config
 */
anychart.timelineModule.Chart.prototype.setupSeriesByJSON = function(config) {
  var json;
  var series = config['series'];
  for (var i = 0; i < series.length; i++) {
    json = series[i];
    var seriesType = json['seriesType'] || this.getOption('defaultSeriesType');
    var seriesInstance = this.createSeriesByType(seriesType, json);
    if (seriesInstance) {
      seriesInstance.setup(json);
    }
  }
};


/**
 * @param {Object} config
 * @param {Function} itemConstructor
 */
anychart.timelineModule.Chart.prototype.setupElements = function(config, itemConstructor) {
  for (var i = 0; i < config.length; i++) {
    var item = itemConstructor.call(this, i);
    item.setup(config[i]);
  }
};


/**
 * @inheritDoc
 */
anychart.timelineModule.Chart.prototype.serialize = function() {
  var json = anychart.timelineModule.Chart.base(this, 'serialize');

  json['scale'] = this.scale().serialize();
  json['axis'] = this.axis().serialize();

  var i;
  json['lineAxesMarkers'] = [];
  for (i = 0; i < this.lineAxesMarkers_.length; i++) {
    json['lineAxesMarkers'].push(this.lineAxesMarkers_[i].serialize());
  }

  json['textAxesMarkers'] = [];
  for (i = 0; i < this.textAxesMarkers_.length; i++) {
    json['textAxesMarkers'].push(this.textAxesMarkers_[i].serialize());
  }

  json['rangeAxesMarkers'] = [];
  for (i = 0; i < this.rangeAxesMarkers_.length; i++) {
    json['rangeAxesMarkers'].push(this.rangeAxesMarkers_[i].serialize());
  }

  this.serializeSeries(json);

  json['type'] = this.getType();
  if (goog.isDef(this.scroll_))
    json['scroll'] = this.scroll_;

  return {'chart': json};
};


/**
 * @param {!Object} json
 */
anychart.timelineModule.Chart.prototype.serializeSeries = function(json) {
  var i;
  var config;
  var seriesList = [];
  for (i = 0; i < this.seriesList.length; i++) {
    var series = this.seriesList[i];
    config = series.serialize();
    seriesList.push(config);
  }
  if (seriesList.length)
    json['series'] = seriesList;
};


//endregion
//region -- Disposing.
/**
 * @inheritDoc
 */
anychart.timelineModule.Chart.prototype.disposeInternal = function() {
  this.xScale_.unlistenSignals(this.scaleInvalidated_, this);
  this.axis_.unlistenSignals(this.axisInvalidated_, this);

  goog.disposeAll(this.axis_, this.xScale_, this.yScale_, this.lineAxesMarkers_, this.textAxesMarkers_,
      this.rangeAxesMarkers_, this.timelineLayer_, this.todayMarker_, this.axesMarkersLayer_);
  this.axis_ = null;
  this.xScale_ = null;
  this.yScale_ = null;
  this.lineAxesMarkers_.length = 0;
  this.textAxesMarkers_.length = 0;
  this.rangeAxesMarkers_.length = 0;
  this.todayMarker_ = null;
  this.timelineLayer_ = null;
  this.axesMarkersLayer_ = null;
  anychart.timelineModule.Chart.base(this, 'disposeInternal');
};


//endregion
//region -- Exports.
//exports
(function() {
  var proto = anychart.timelineModule.Chart.prototype;
  proto['axis'] = proto.axis;
  proto['scale'] = proto.scale;
  proto['fitAll'] = proto.fitAll;
  proto['fit'] = proto.fitAll;
  proto['zoomTo'] = proto.zoomTo;
  proto['getType'] = proto.getType;

  proto['getCurrentScene'] = proto.getCurrentScene;
  proto['zoomIn'] = proto.zoomIn;
  proto['zoomOut'] = proto.zoomOut;

  proto['getSeries'] = proto.getSeries;
  proto['addSeries'] = proto.addSeries;
  proto['getSeriesAt'] = proto.getSeriesAt;
  proto['getSeriesCount'] = proto.getSeriesCount;
  proto['removeSeries'] = proto.removeSeries;
  proto['removeSeriesAt'] = proto.removeSeriesAt;
  proto['removeAllSeries'] = proto.removeAllSeries;

  proto['scroll'] = proto.scroll;
  proto['lineMarker'] = proto.lineMarker;
  proto['textMarker'] = proto.textMarker;
  proto['rangeMarker'] = proto.rangeMarker;
  proto['todayMarker'] = proto.todayMarker;
  proto['scroller'] = proto.scroller;
})();
//exports

//endregion