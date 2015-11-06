goog.provide('anychart.math');
goog.provide('anychart.math.Rect');
goog.require('acgraph');
goog.require('acgraph.math.Coordinate');



/**
 @namespace
 @name anychart.math
 */


/**
 * @includeDoc
 * @typedef {{
     x: (string|number),
     y: (string|number)
  }}
 */
anychart.math.CoordinateObject;


/**
 * Identifies an x-y coordinate pair.
 * @includeDoc
 * @typedef {!(
 *  Array.<number, number> |
 *  {x: number, y:number} |
 *  anychart.math.CoordinateObject |
 *  acgraph.math.Coordinate
 * )} anychart.math.Coordinate
 */
anychart.math.Coordinate;


/**
 * Tries to normalize anychart.math.Coordinate to acgraph.math.Coordinate.
 * @param {anychart.math.Coordinate} value anychart.math.Coordinate to normalize.
 * @return {acgraph.math.Coordinate} Normalized to acgraph.math.Coordinate value.
 */
anychart.math.normalizeCoordinate = function(value) {
  if (value instanceof acgraph.math.Coordinate) {
    return /** @type {acgraph.math.Coordinate} */(value);
  } else {
    if (goog.isArray(value)) {
      return new acgraph.math.Coordinate(value[0], value[1]);
    } else if (goog.isObject(value)) {
      return new acgraph.math.Coordinate(value['x'], value['y']);
    }
  }
  return new acgraph.math.Coordinate(0, 0);
};


/**
 * Rounds a given number to a certain number of decimal places.
 * @param {number} num The number to be rounded.
 * @param {number=} opt_digitsCount Optional The number of places after the decimal point.
 * @return {number} The rounded number.
 */
anychart.math.round = function(num, opt_digitsCount) {
  var tmp = Math.pow(10, opt_digitsCount || 0);
  return Math.round(num * tmp) / tmp || 0;
};


/**
 * Rounds a given number to a certain number of decimal places.
 * @param {number} num The number to be rounded.
 * @return {number} The rounded number.
 */
anychart.math.specialRound = function(num) {
  return anychart.math.round(num, 13 - Math.max(Math.floor(Math.log(Math.abs(num)) * Math.LOG10E), 8));
};


/**
 * Comparison of two numbers numbers for roughly equal with some accuracy.
 * @param {number} value First value to compare.
 * @param {number} value2 Second value to compare.
 * @param {number=} opt_eps Accuracy or neighborhood on which two value roughly equal.
 * @return {boolean} Whether value1 rough equal value2.
 */
anychart.math.roughlyEqual = function(value, value2, opt_eps) {
  var eps = opt_eps || 0.01;
  return Math.abs(value - value2) < eps;
};


/**
 * Safe log of a value.
 * @param {number} val .
 * @param {number=} opt_base Must meet (base > 0 && base != 1).
 * @return {number} .
 */
anychart.math.log = function(val, opt_base) {
  var res = Math.log(Math.max(1e-7, val));
  if (opt_base)
    return res / Math.log(opt_base);
  else
    return res;
};


/**
 * Pow with rounding.
 * @param {number} base
 * @param {number} pow
 * @return {number}
 */
anychart.math.pow = function(base, pow) {
  return anychart.math.round(Math.pow(base, pow), 7);
};


/**
 * Cheking rectangles intersection. Rectangle described by an array of its vertices.
 * We consider that two rectangles do not intersect, if we find a side of any of two rectangles
 * relative to which all vertices of another rect lie towards the same direction or lie on this side.
 * @param {Array.<number>=} opt_first First rect.
 * @param {Array.<number>=} opt_second Second rect.
 * @return {boolean} Returns true if rectangles intersect, false
 * if rectangles do not intersect.
 */
anychart.math.checkRectIntersection = function(opt_first, opt_second) {
  var result = false, k, k1, i, len;
  if (!opt_first || !opt_second) return false;
  for (i = 0, len = opt_first.length; i < len - 1; i = i + 2) {
    k = i == len - 2 ? 0 : i + 2;
    k1 = i == len - 2 ? 1 : i + 3;
    result = result || anychart.math.checkPointsRelativeLine(
        opt_first[i], opt_first[i + 1], opt_first[k], opt_first[k1], opt_second);
  }
  for (i = 0, len = opt_second.length; i < len - 1; i = i + 2) {
    k = i == len - 2 ? 0 : i + 2;
    k1 = i == len - 2 ? 1 : i + 3;
    result = result || anychart.math.checkPointsRelativeLine(
        opt_second[i], opt_second[i + 1], opt_second[k], opt_second[k1], opt_first);
  }
  return !result;
};


/**
 * Cheking rectangles intersection. Rectangle described by an array of its vertices.
 * We consider that two rectangles do not intersect, if we find a side of any of two rectangles
 * relative to which all vertices of another rect lie towards the same direction or lie on this side.
 * @param {Array.<number>=} opt_first First rect.
 * @param {Array.<number>=} opt_second Second rect.
 * @return {boolean|Array.<boolean>} Returns true if rectangles intersect, false
 * if rectangles do not intersect.
 */
anychart.math.checkRectIntersectionExt = function(opt_first, opt_second) {
  var result = [], k, k1, i, len;
  if (!opt_first || !opt_second) return false;
  for (i = 0, len = opt_first.length; i < len - 1; i = i + 2) {
    k = i == len - 2 ? 0 : i + 2;
    k1 = i == len - 2 ? 1 : i + 3;
    result.push(anychart.math.checkPointsRelativeLine(
        opt_first[i], opt_first[i + 1], opt_first[k], opt_first[k1], opt_second));
  }
  for (i = 0, len = opt_second.length; i < len - 1; i = i + 2) {
    k = i == len - 2 ? 0 : i + 2;
    k1 = i == len - 2 ? 1 : i + 3;
    result.push(anychart.math.checkPointsRelativeLine(
        opt_second[i], opt_second[i + 1], opt_second[k], opt_second[k1], opt_first));
  }
  return result;
};


/**
 * Check an array of points position in relation to
 * a line defined by two points.
 * @param {number} p1x X coordinate of the first point.
 * @param {number} p1y Y coordinate of the first point.
 * @param {number} p2x X coordinate of the second point.
 * @param {number} p2y Y coordinate of the second point.
 * @param {Array.<number>} pointsArr Array of points to check against the line
 * defined by two points.
 * @return {boolean} If all points from an array lie on the line or lie towards the same direction,
 * returns true, returns false otherwise.
 */
anychart.math.checkPointsRelativeLine = function(p1x, p1y, p2x, p2y, pointsArr) {
  var ok = true;
  for (var j = 0, len = pointsArr.length; j < len - 1; j = j + 2) {
    ok = ok && anychart.math.isPointOnLine(p1x, p1y, p2x, p2y, pointsArr[j], pointsArr[j + 1]) <= 0;
  }
  return ok;
};


/**
 * Check a point position against a line defined by two points.
 * @param {number} p1x X coordinate of the first point.
 * @param {number} p1y Y coordinate of the first point.
 * @param {number} p2x X coordinate of the second point.
 * @param {number} p2y Y coordinate of the second point.
 * @param {number} p3x X coordinate of a point to check.
 * @param {number} p3y X coordinate of a point to check.
 * @return {number} Returns 0 if a point lies on a line, in other cases a sign of a number
 * defines a direction.
 */
anychart.math.isPointOnLine = function(p1x, p1y, p2x, p2y, p3x, p3y) {
  var result = (p1y - p2y) * p3x + (p2x - p1x) * p3y + (p1x * p2y - p2x * p1y);
  return result == 0 ? 0 : result > 0 ? 1 : -1;
};


/**
 * Checks whether segment have intersection with rect.
 * @param {number} x1 X coord of first segment point.
 * @param {number} y1 Y coord of first segment point.
 * @param {number} x2 X coord of second segment point.
 * @param {number} y2 Y coord of second segment point.
 * @param {Array.<number>=} opt_rect Array of rect coords.
 * @return {boolean}
 */
anychart.math.checkRectIntersectionWithSegment = function(x1, y1, x2, y2, opt_rect) {
  var result = false, k, k1, i, len;
  if (!opt_rect) return false;

  for (i = 0, len = opt_rect.length; i < len - 1; i = i + 2) {
    k = i == len - 2 ? 0 : i + 2;
    k1 = i == len - 2 ? 1 : i + 3;
    result = result || anychart.math.checkSegmentsIntersection(
        opt_rect[i], opt_rect[i + 1], opt_rect[k], opt_rect[k1], x1, y1, x2, y2);
  }
  return result;
};


/**
 * Check intersection for vertical aor horizontal segments.
 * @param {number} a Coord of first point of first segment.
 * @param {number} b Coord of second point of first segment.
 * @param {number} c Coord of first point of second segment.
 * @param {number} d Coord of second point of second segment.
 * @return {boolean} Whether segments have intersection.
 */
anychart.math.intersectVerticalOrHorizontalSegments = function(a, b, c, d) {
  var temp;
  if (a > b) {
    temp = a;
    a = b;
    b = temp;
  }

  if (c > d) {
    temp = c;
    c = d;
    d = temp;
  }

  return Math.max(a, c) <= Math.min(b, d);
};


/**
 * Calculates oriented area od triangle.
 * @param {number} x1 X coord of fist point of triangle.
 * @param {number} y1 Y coord of fist point of triangle.
 * @param {number} x2 X coord of second point of triangle.
 * @param {number} y2 Y coord of second point of triangle.
 * @param {number} x3 X coord of third point of triangle.
 * @param {number} y3 Y coord of third point of triangle.
 * @return {number} Triangle area.
 */
anychart.math.calcOrientedTriangleArea = function(x1, y1, x2, y2, x3, y3) {
  return (x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1);
};


/**
 * Checks two segments intersection.
 * @param {number} x1 X coord of first point of first segment.
 * @param {number} y1 Y coord of first point of first segment.
 * @param {number} x2 X coord of second point of first segment.
 * @param {number} y2 Y coord of second point of first segment.
 * @param {number} x3 X coord of first point of second segment.
 * @param {number} y3 Y coord of first point of second segment.
 * @param {number} x4 X coord of second point of second segment.
 * @param {number} y4 Y coord of second point of second segment.
 * @return {boolean} Whether segments have intersection.
 */
anychart.math.checkSegmentsIntersection = function(x1, y1, x2, y2, x3, y3, x4, y4) {
  return anychart.math.intersectVerticalOrHorizontalSegments(x1, x2, x3, x4) &&
      anychart.math.intersectVerticalOrHorizontalSegments(y1, y2, y3, y4) &&
      anychart.math.calcOrientedTriangleArea(x1, y1, x2, y2, x3, y3) * anychart.math.calcOrientedTriangleArea(x1, y1, x2, y2, x4, y4) <= 0 &&
      anychart.math.calcOrientedTriangleArea(x3, y3, x4, y4, x1, y1) * anychart.math.calcOrientedTriangleArea(x3, y3, x4, y4, x2, y2) <= 0;
};


/**
 * Checks whether rect is out of circle bounds.
 * @param {number} cx X coord of circle center.
 * @param {number} cy Y coord of circle center.
 * @param {number} radius Circle radius.
 * @param {Array.<number>=} opt_rect Array of rect coords.
 * @return {boolean}
 */
anychart.math.checkForRectIsOutOfCircleBounds = function(cx, cy, radius, opt_rect) {
  var result = false, i, len;
  if (!opt_rect) return false;

  for (i = 0, len = opt_rect.length; i < len - 1; i = i + 2) {
    result = result || anychart.math.checkForPointIsOutOfCircleBounds(opt_rect[i], opt_rect[i + 1], cx, cy, radius);
  }
  return result;
};


/**
 * Checks whether point is out of circle bounds.
 * @param {number} x1 X coord of point.
 * @param {number} y1 Y coord of point.
 * @param {number} cx X coord of circle center.
 * @param {number} cy Y coord of circle center.
 * @param {number} r Circle radius.
 * @return {boolean} if point out of circle bounds then returns true.
 */
anychart.math.checkForPointIsOutOfCircleBounds = function(x1, y1, cx, cy, r) {
  return Math.sqrt(Math.pow(cx - x1, 2) + Math.pow(cy - y1, 2)) > r;
};



/**
 * Define rectangle.
 * @param {number} x X-coordinate of top-left point.
 * @param {number} y Y-coordinate of top-left point.
 * @param {number} w Width.
 * @param {number} h Height.
 * @constructor
 * @includeDoc
 */
anychart.math.Rect = acgraph.math.Rect;


/**
 * Compares rectangles for equality.
 * @param {anychart.math.Rect} a A Rectangle.
 * @param {anychart.math.Rect} b A Rectangle.
 * @return {boolean} True iff the rectangles have the same left, top, width,
 *     and height, or if both are null.
 */
anychart.math.Rect.equals = goog.math.Rect.equals;


//region --- Declarations for IDEA ---
//----------------------------------------------------------------------------------------------------------------------
//
//  Declarations for IDEA
//
//----------------------------------------------------------------------------------------------------------------------
// Prevents IDEA from throwing warnings about undefined fields.
/**
 * @type {number}
 */
anychart.math.Rect.prototype.left;


/**
 * @type {number}
 */
anychart.math.Rect.prototype.top;


/**
 * @type {number}
 */
anychart.math.Rect.prototype.width;


/**
 * @type {number}
 */
anychart.math.Rect.prototype.height;


/**
 * @return {!anychart.math.Rect} A copy of a rectangle.
 */
anychart.math.Rect.prototype.clone;


/**
 * @return {!Array.<number>}
 */
anychart.math.Rect.prototype.toCoordinateBox = function() {
  return [this.left, this.top,
    this.left + this.width, this.top,
    this.left + this.width, this.top + this.height,
    this.left, this.top + this.height];
};


/**
 * @param {Array.<number>} value .
 * @return {!anychart.math.Rect} .
 */
anychart.math.Rect.fromCoordinateBox = function(value) {
  /** @type {anychart.math.Rect} */
  var rect = new anychart.math.Rect(0, 0, 0, 0);
  var bounds = new anychart.math.Rect(value[0], value[1], 0, 0);
  for (var i = 2, len = value.length; i < len; i += 2) {
    rect.left = value[i];
    rect.top = value[i + 1];
    bounds.boundingRect(rect);
  }
  return bounds;
};


/**
 * @return {Array.<number>}
 */
anychart.math.Rect.prototype.toArray = function() {
  return [this.left, this.top, this.width, this.height];
};


/**
 * @param {Array.<number>} arr Array representing the rectangle.
 * @return {!anychart.math.Rect} .
 */
anychart.math.Rect.fromArray = function(arr) {
  return new anychart.math.Rect(arr[0], arr[1], arr[2], arr[3]);
};


/**
 * Serializes the rect.
 * @return {!Object}
 */
anychart.math.Rect.prototype.serialize = function() {
  return {
    'left': this.left,
    'top': this.top,
    'width': this.width,
    'height': this.height
  };
};


/**
 * Creates the rect and setups it from the config.
 * @param {Object} config
 * @return {!anychart.math.Rect} Deserialized rect.
 */
anychart.math.Rect.fromJSON = function(config) {
  return new anychart.math.Rect(
      +config['left'] || 0,
      +config['top'] || 0,
      +config['width'] || 0,
      +config['height'] || 0);
};
//endregion


/**
 * Constructor function.
 * @param {number} x X-coordinate.
 * @param {number} y Y-coordinate.
 * @param {number} w Width.
 * @param {number} h Height.
 * @return {!anychart.math.Rect}
 */
anychart.math.rect = function(x, y, w, h) {
  return new anychart.math.Rect(x, y, w, h);
};


//exports
goog.exportSymbol('anychart.math.rect', anychart.math.rect);
