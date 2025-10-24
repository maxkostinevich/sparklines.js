/*!
 * sparklines.js
 *
 * MIT License (c) 2025 Max Kostinevich
 *
 * Portions of this software are derived from:
 *   jquery.sparkline.js v2.1.2
 *   (c) 2012 Splunk Inc., author Gareth Watts (gareth@splunk.com)
 *   Licensed under the New BSD License
 *   http://omnipotent.net/jquery.sparkline/
 *
 * This library is a derivative work: a conversion of the original
 * jQuery-based sparkline implementation into a vanilla JavaScript
 * version. While much of the rendering logic and utility functions
 * remain adapted from the original, the code has been refactored
 * and restructured for modern environments without jQuery.
 *
 * Usage:
 *  sparklines(element, values, options)
 *
 * If values is undefined or set to 'html' then the data values are read from the specified tag:
 *   <p>Sparkline: <span class="sparkline">1,4,6,6,8,5,3,5</span></p>
 *   sparklines('.sparkline');
 * There must be no spaces in the enclosed data set
 *
 * Otherwise values must be an array of numbers or null values
 *    <p>Sparkline: <span id="sparkline1">This text replaced if the browser is compatible</span></p>
 *    sparklines('#sparkline1', [1,4,6,6,8,5,3,5])
 *    sparklines('#sparkline2', [1,4,6,null,null,5,3,5])
 *
 * Values can also be specified in an HTML comment, or as a values attribute:
 *    <p>Sparkline: <span class="sparkline"><!--1,4,6,6,8,5,3,5 --></span></p>
 *    <p>Sparkline: <span class="sparkline" values="1,4,6,6,8,5,3,5"></span></p>
 *    sparklines('.sparkline');
 *
 * For line charts, x values can also be specified:
 *   <p>Sparkline: <span class="sparkline">1:1,2.7:4,3.4:6,5:6,6:8,8.7:5,9:3,10:5</span></p>
 *    sparklines('#sparkline1', [ [1,1], [2.7,4], [3.4,6], [5,6], [6,8], [8.7,5], [9,3], [10,5] ])
 *
 * By default, options should be passed in as the second argument to the sparklines function:
 *   sparklines('.sparkline', [1,2,3,4], {type: 'bar'})
 *
 * Options can also be set by passing them on the tag itself.  This feature is disabled by default though
 * as there's a slight performance overhead:
 *   sparklines('.sparkline', [1,2,3,4], {enableTagOptions: true})
 *   <p>Sparkline: <span class="sparkline" sparkType="bar" sparkBarColor="red">loading</span></p>
 * Prefix all options supplied as tag attribute with "spark" (configurable by setting tagOptionPrefix)
 */

(function (document, Math, undefined) {
  "use strict";

  // Element data storage using WeakMap
  var elementData = new WeakMap();

  // Utility functions to replace jQuery methods
  var utils = {
    // Replace $() selector
    select: function (selector) {
      if (typeof selector === "string") {
        var elements = document.querySelectorAll(selector);
        return elements.length === 1 ? elements[0] : Array.from(elements);
      }
      return selector;
    },

    // Replace $.extend()
    extend: function () {
      var target = arguments[0] || {};
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];
        if (source) {
          for (var key in source) {
            if (source.hasOwnProperty(key)) {
              target[key] = source[key];
            }
          }
        }
      }
      return target;
    },

    // Replace $.isArray()
    isArray: function (obj) {
      return Array.isArray(obj);
    },

    // Replace $.map()
    map: function (array, callback) {
      return Array.prototype.map.call(array, callback);
    },

    // Replace $.proxy()
    proxy: function (fn, context) {
      return function () {
        return fn.apply(context, arguments);
      };
    },

    // Replace $.inArray()
    inArray: function (value, array) {
      return Array.prototype.indexOf.call(array, value);
    },

    // Replace $.data()
    data: function (element, key, value) {
      if (!elementData.has(element)) {
        elementData.set(element, {});
      }
      var data = elementData.get(element);

      if (arguments.length === 3) {
        data[key] = value;
        return value;
      } else if (arguments.length === 2) {
        return data[key];
      } else {
        return data;
      }
    },

    // Replace $(el).html()
    html: function (element, content) {
      if (content !== undefined) {
        element.innerHTML = content;
        return element;
      }
      return element.innerHTML;
    },

    // Replace $(el).css()
    css: function (element, property, value) {
      if (typeof property === "object") {
        for (var key in property) {
          if (property.hasOwnProperty(key)) {
            element.style[key] = property[key];
          }
        }
        return element;
      } else if (value !== undefined) {
        element.style[property] = value;
        return element;
      } else {
        return window.getComputedStyle(element)[property];
      }
    },

    // Replace $(el).offset()
    offset: function (element) {
      var rect = element.getBoundingClientRect();
      return {
        top: rect.top + window.pageYOffset,
        left: rect.left + window.pageXOffset,
      };
    },

    // Replace $(el).width() and $(el).height()
    width: function (element) {
      return element.offsetWidth;
    },

    height: function (element) {
      return element.offsetHeight;
    },

    innerWidth: function (element) {
      return element.clientWidth;
    },

    innerHeight: function (element) {
      return element.clientHeight;
    },

    // Replace $(el).append()
    append: function (element, child) {
      element.appendChild(child);
      return element;
    },

    // Replace $(el).remove()
    remove: function (element) {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      return element;
    },

    // Replace $(el).attr()
    attr: function (element, name, value) {
      if (value !== undefined) {
        element.setAttribute(name, value);
        return element;
      }
      return element.getAttribute(name);
    },

    // Replace $(el).parents()
    parents: function (element, selector) {
      var parents = [];
      var parent = element.parentNode;
      while (parent && parent !== document) {
        if (!selector || parent.matches(selector)) {
          parents.push(parent);
        }
        parent = parent.parentNode;
      }
      return parents;
    },

    // Replace $(el).is()
    is: function (element, selector) {
      if (selector === ":hidden") {
        return element.offsetWidth === 0 && element.offsetHeight === 0;
      }
      if (selector === ":visible") {
        return element.offsetWidth > 0 || element.offsetHeight > 0;
      }
      return element.matches(selector);
    },

    // Replace $(el).closest()
    closest: function (element, selector) {
      var parent = element.parentNode;
      while (parent && parent !== document) {
        if (parent.matches(selector)) {
          return parent;
        }
        parent = parent.parentNode;
      }
      return null;
    },

    // Custom event system to replace $.Event() and .trigger()
    Event: function (type, properties) {
      var event = new CustomEvent(type, {
        bubbles: true,
        cancelable: true,
      });
      if (properties) {
        utils.extend(event, properties);
      }
      return event;
    },

    trigger: function (element, event) {
      element.dispatchEvent(event);
    },

    // Event binding helpers
    bind: function (element, event, handler) {
      element.addEventListener(event, handler);
    },

    unbind: function (element, event, handler) {
      element.removeEventListener(event, handler);
    },

    // Window/document helpers
    window: function () {
      return window;
    },

    document: function () {
      return document;
    },
  };

  var UNSET_OPTION = {},
    getDefaults,
    createClass,
    SPFormat,
    clipval,
    quartile,
    normalizeValue,
    normalizeValues,
    remove,
    isNumber,
    all,
    sum,
    addCSS,
    ensureArray,
    formatNumber,
    RangeMap,
    MouseHandler,
    Tooltip,
    barHighlightMixin,
    line,
    bar,
    tristate,
    discrete,
    bullet,
    pie,
    box,
    defaultStyles,
    initStyles,
    VShape,
    VCanvas_base,
    VCanvas_canvas,
    VCanvas_vml,
    pending,
    shapeCount = 0;

  /**
   * Default configuration settings
   */
  getDefaults = function () {
    return {
      // Settings common to most/all chart types
      common: {
        type: "line",
        lineColor: "#00f",
        fillColor: "#cdf",
        defaultPixelsPerValue: 3,
        width: "auto",
        height: "auto",
        composite: false,
        tagValuesAttribute: "values",
        tagOptionsPrefix: "spark",
        enableTagOptions: false,
        enableHighlight: true,
        highlightLighten: 1.4,
        tooltipSkipNull: true,
        tooltipPrefix: "",
        tooltipSuffix: "",
        disableHiddenCheck: false,
        numberFormatter: false,
        numberDigitGroupCount: 3,
        numberDigitGroupSep: ",",
        numberDecimalMark: ".",
        disableTooltips: false,
        disableInteraction: false,
      },
      // Defaults for line charts
      line: {
        spotColor: "#f80",
        highlightSpotColor: "#5f5",
        highlightLineColor: "#f22",
        spotRadius: 1.5,
        minSpotColor: "#f80",
        maxSpotColor: "#f80",
        lineWidth: 1,
        normalRangeMin: undefined,
        normalRangeMax: undefined,
        normalRangeColor: "#ccc",
        drawNormalOnTop: false,
        chartRangeMin: undefined,
        chartRangeMax: undefined,
        chartRangeMinX: undefined,
        chartRangeMaxX: undefined,
        tooltipFormat: new SPFormat(
          '<span style="color: {{color}}">&#9679;</span> {{prefix}}{{y}}{{suffix}}'
        ),
      },
      // Defaults for bar charts
      bar: {
        barColor: "#3366cc",
        negBarColor: "#f44",
        stackedBarColor: [
          "#3366cc",
          "#dc3912",
          "#ff9900",
          "#109618",
          "#66aa00",
          "#dd4477",
          "#0099c6",
          "#990099",
        ],
        zeroColor: undefined,
        nullColor: undefined,
        zeroAxis: true,
        barWidth: 4,
        barSpacing: 1,
        chartRangeMax: undefined,
        chartRangeMin: undefined,
        chartRangeClip: false,
        colorMap: undefined,
        tooltipFormat: new SPFormat(
          '<span style="color: {{color}}">&#9679;</span> {{prefix}}{{value}}{{suffix}}'
        ),
      },
      // Defaults for tristate charts
      tristate: {
        barWidth: 4,
        barSpacing: 1,
        posBarColor: "#6f6",
        negBarColor: "#f44",
        zeroBarColor: "#999",
        colorMap: {},
        tooltipFormat: new SPFormat(
          '<span style="color: {{color}}">&#9679;</span> {{value:map}}'
        ),
        tooltipValueLookups: { map: { "-1": "Loss", 0: "Draw", 1: "Win" } },
      },
      // Defaults for discrete charts
      discrete: {
        lineHeight: "auto",
        thresholdColor: undefined,
        thresholdValue: 0,
        chartRangeMax: undefined,
        chartRangeMin: undefined,
        chartRangeClip: false,
        tooltipFormat: new SPFormat("{{prefix}}{{value}}{{suffix}}"),
      },
      // Defaults for bullet charts
      bullet: {
        targetColor: "#f33",
        targetWidth: 3, // width of the target bar in pixels
        performanceColor: "#33f",
        rangeColors: ["#d3dafe", "#a8b6ff", "#7f94ff"],
        base: undefined, // set this to a number to change the base start number
        tooltipFormat: new SPFormat("{{fieldkey:fields}} - {{value}}"),
        tooltipValueLookups: {
          fields: { r: "Range", p: "Performance", t: "Target" },
        },
      },
      // Defaults for pie charts
      pie: {
        offset: 0,
        sliceColors: [
          "#3366cc",
          "#dc3912",
          "#ff9900",
          "#109618",
          "#66aa00",
          "#dd4477",
          "#0099c6",
          "#990099",
        ],
        borderWidth: 0,
        borderColor: "#000",
        tooltipFormat: new SPFormat(
          '<span style="color: {{color}}">&#9679;</span> {{value}} ({{percent.1}}%)'
        ),
      },
      // Defaults for box plots
      box: {
        raw: false,
        boxLineColor: "#000",
        boxFillColor: "#cdf",
        whiskerColor: "#000",
        outlierLineColor: "#333",
        outlierFillColor: "#fff",
        medianColor: "#f00",
        showOutliers: true,
        outlierIQR: 1.5,
        spotRadius: 1.5,
        target: undefined,
        targetColor: "#4a2",
        chartRangeMax: undefined,
        chartRangeMin: undefined,
        tooltipFormat: new SPFormat("{{field:fields}}: {{value}}"),
        tooltipFormatFieldlistKey: "field",
        tooltipValueLookups: {
          fields: {
            lq: "Lower Quartile",
            med: "Median",
            uq: "Upper Quartile",
            lo: "Left Outlier",
            ro: "Right Outlier",
            lw: "Left Whisker",
            rw: "Right Whisker",
          },
        },
      },
    };
  };

  // You can have tooltips use a css class other than jqstooltip by specifying tooltipClassname
  defaultStyles =
    ".jqstooltip { " +
    "position: absolute;" +
    "left: 0px;" +
    "top: 0px;" +
    "visibility: hidden;" +
    "background: rgb(0, 0, 0) transparent;" +
    "background-color: rgba(0,0,0,0.6);" +
    "filter:progid:DXImageTransform.Microsoft.gradient(startColorstr=#99000000, endColorstr=#99000000);" +
    '-ms-filter: "progid:DXImageTransform.Microsoft.gradient(startColorstr=#99000000, endColorstr=#99000000)";' +
    "color: white;" +
    "font: 10px arial, san serif;" +
    "text-align: left;" +
    "white-space: nowrap;" +
    "padding: 5px;" +
    "border: 1px solid white;" +
    "z-index: 10000;" +
    "}" +
    ".jqsfield { " +
    "color: white;" +
    "font: 10px arial, san serif;" +
    "text-align: left;" +
    "}";

  /**
   * Utilities
   */

  createClass = function (/* [baseclass, [mixin, ...]], definition */) {
    var Class, args;
    Class = function () {
      this.init.apply(this, arguments);
    };
    if (arguments.length > 1) {
      if (arguments[0]) {
        Class.prototype = utils.extend(
          new arguments[0](),
          arguments[arguments.length - 1]
        );
        Class._super = arguments[0].prototype;
      } else {
        Class.prototype = arguments[arguments.length - 1];
      }
      if (arguments.length > 2) {
        args = Array.prototype.slice.call(arguments, 1, -1);
        args.unshift(Class.prototype);
        utils.extend.apply(utils, args);
      }
    } else {
      Class.prototype = arguments[0];
    }
    Class.prototype.cls = Class;
    return Class;
  };

  /**
   * Wraps a format string for tooltips
   * {{x}}
   * {{x.2}
   * {{x:months}}
   */
  SPFormat = createClass({
    fre: /\{\{([\w.]+?)(:(.+?))?\}\}/g,
    precre: /(\w+)\.(\d+)/,

    init: function (format, fclass) {
      this.format = format;
      this.fclass = fclass;
    },

    render: function (fieldset, lookups, options) {
      var self = this,
        fields = fieldset,
        match,
        token,
        lookupkey,
        fieldvalue,
        prec;
      return this.format.replace(this.fre, function () {
        var lookup;
        token = arguments[1];
        lookupkey = arguments[3];
        match = self.precre.exec(token);
        if (match) {
          prec = match[2];
          token = match[1];
        } else {
          prec = false;
        }
        fieldvalue = fields[token];
        if (fieldvalue === undefined) {
          return "";
        }
        if (lookupkey && lookups && lookups[lookupkey]) {
          lookup = lookups[lookupkey];
          if (lookup.get) {
            // RangeMap
            return lookups[lookupkey].get(fieldvalue) || fieldvalue;
          } else {
            return lookups[lookupkey][fieldvalue] || fieldvalue;
          }
        }
        if (isNumber(fieldvalue)) {
          if (options.get("numberFormatter")) {
            fieldvalue = options.get("numberFormatter")(fieldvalue);
          } else {
            fieldvalue = formatNumber(
              fieldvalue,
              prec,
              options.get("numberDigitGroupCount"),
              options.get("numberDigitGroupSep"),
              options.get("numberDecimalMark")
            );
          }
        }
        return fieldvalue;
      });
    },
  });

  // convience method to avoid needing the new operator
  var spformat = function (format, fclass) {
    return new SPFormat(format, fclass);
  };

  clipval = function (val, min, max) {
    if (val < min) {
      return min;
    }
    if (val > max) {
      return max;
    }
    return val;
  };

  quartile = function (values, q) {
    var vl;
    if (q === 2) {
      vl = Math.floor(values.length / 2);
      return values.length % 2 ? values[vl] : (values[vl - 1] + values[vl]) / 2;
    } else {
      if (values.length % 2) {
        // odd
        vl = (values.length * q + q) / 4;
        return vl % 1
          ? (values[Math.floor(vl)] + values[Math.floor(vl) - 1]) / 2
          : values[vl - 1];
      } else {
        //even
        vl = (values.length * q + 2) / 4;
        return vl % 1
          ? (values[Math.floor(vl)] + values[Math.floor(vl) - 1]) / 2
          : values[vl - 1];
      }
    }
  };

  normalizeValue = function (val) {
    var nf;
    switch (val) {
      case "undefined":
        val = undefined;
        break;
      case "null":
        val = null;
        break;
      case "true":
        val = true;
        break;
      case "false":
        val = false;
        break;
      default:
        nf = parseFloat(val);
        if (val == nf) {
          val = nf;
        }
    }
    return val;
  };

  normalizeValues = function (vals) {
    var i,
      result = [];
    for (i = vals.length; i--; ) {
      result[i] = normalizeValue(vals[i]);
    }
    return result;
  };

  remove = function (vals, filter) {
    var i,
      vl,
      result = [];
    for (i = 0, vl = vals.length; i < vl; i++) {
      if (vals[i] !== filter) {
        result.push(vals[i]);
      }
    }
    return result;
  };

  isNumber = function (num) {
    return !isNaN(parseFloat(num)) && isFinite(num);
  };

  formatNumber = function (num, prec, groupsize, groupsep, decsep) {
    var p, i;
    num = (
      prec === false ? parseFloat(num).toString() : num.toFixed(prec)
    ).split("");
    p = (p = utils.inArray(".", num)) < 0 ? num.length : p;
    if (p < num.length) {
      num[p] = decsep;
    }
    for (i = p - groupsize; i > 0; i -= groupsize) {
      num.splice(i, 0, groupsep);
    }
    return num.join("");
  };

  // determine if all values of an array match a value
  // returns true if the array is empty
  all = function (val, arr, ignoreNull) {
    var i;
    for (i = arr.length; i--; ) {
      if (ignoreNull && arr[i] === null) continue;
      if (arr[i] !== val) {
        return false;
      }
    }
    return true;
  };

  // sums the numeric values in an array, ignoring other values
  sum = function (vals) {
    var total = 0,
      i;
    for (i = vals.length; i--; ) {
      total += typeof vals[i] === "number" ? vals[i] : 0;
    }
    return total;
  };

  ensureArray = function (val) {
    return utils.isArray(val) ? val : [val];
  };

  // http://paulirish.com/2008/bookmarklet-inject-new-css-rules/
  addCSS = function (css) {
    var tag;
    //if ('\v' == 'v') /* ie only */ {
    if (document.createStyleSheet) {
      document.createStyleSheet().cssText = css;
    } else {
      tag = document.createElement("style");
      tag.type = "text/css";
      document.getElementsByTagName("head")[0].appendChild(tag);
      tag[
        typeof document.body.style.WebkitAppearance ==
        "string" /* webkit only */
          ? "innerText"
          : "innerHTML"
      ] = css;
    }
  };

  // Provide a cross-browser interface to a few simple drawing primitives
  var simpledraw = function (element, width, height, useExisting, interact) {
    var target, mhandler;
    if (useExisting && (target = utils.data(element, "_jqs_vcanvas"))) {
      return target;
    }

    if (sparklines.canvas === false) {
      // We've already determined that neither Canvas nor VML are available
      return false;
    } else if (sparklines.canvas === undefined) {
      // No function defined yet -- need to see if we support Canvas or VML
      var el = document.createElement("canvas");
      if (!!(el.getContext && el.getContext("2d"))) {
        // Canvas is available
        sparklines.canvas = function (width, height, target, interact) {
          return new VCanvas_canvas(width, height, target, interact);
        };
      } else if (document.namespaces && !document.namespaces.v) {
        // VML is available
        document.namespaces.add(
          "v",
          "urn:schemas-microsoft-com:vml",
          "#default#VML"
        );
        sparklines.canvas = function (width, height, target) {
          return new VCanvas_vml(width, height, target);
        };
      } else {
        // Neither Canvas nor VML are available
        sparklines.canvas = false;
        return false;
      }
    }

    if (width === undefined) {
      width = utils.innerWidth(element);
      if (width === 0 || width < 50) {
        // Use default if too small
        width = 300; // Default width
      }
    }
    if (height === undefined) {
      height = utils.innerHeight(element);
      if (height === 0 || height < 20) {
        // Use default if too small
        height = 150; // Default height
      }
    }

    target = sparklines.canvas(width, height, element, interact);

    mhandler = utils.data(element, "_jqs_mhandler");
    if (mhandler) {
      mhandler.registerCanvas(target);
    }
    return target;
  };

  var cleardraw = function (element) {
    var target = utils.data(element, "_jqs_vcanvas");
    if (target) {
      target.reset();
    }
  };

  RangeMap = createClass({
    init: function (map) {
      var key,
        range,
        rangelist = [];
      for (key in map) {
        if (
          map.hasOwnProperty(key) &&
          typeof key === "string" &&
          key.indexOf(":") > -1
        ) {
          range = key.split(":");
          range[0] = range[0].length === 0 ? -Infinity : parseFloat(range[0]);
          range[1] = range[1].length === 0 ? Infinity : parseFloat(range[1]);
          range[2] = map[key];
          rangelist.push(range);
        }
      }
      this.map = map;
      this.rangelist = rangelist || false;
    },

    get: function (value) {
      var rangelist = this.rangelist,
        i,
        range,
        result;
      if ((result = this.map[value]) !== undefined) {
        return result;
      }
      if (rangelist) {
        for (i = rangelist.length; i--; ) {
          range = rangelist[i];
          if (range[0] <= value && range[1] >= value) {
            return range[2];
          }
        }
      }
      return undefined;
    },
  });

  // Convenience function
  var range_map = function (map) {
    return new RangeMap(map);
  };

  initStyles = function () {
    addCSS(defaultStyles);
  };

  // Initialize styles immediately
  initStyles();

  pending = [];

  // Main sparklines function
  function sparklines(element, userValues, userOptions) {
    var elements = utils.select(element);
    if (!utils.isArray(elements)) {
      elements = [elements];
    }

    elements.forEach(function (el) {
      var options = new sparklines.options(el, userOptions),
        render,
        i;
      render = function () {
        var values, width, height, tmp, mhandler, sp, vals;
        if (
          userValues === "html" ||
          userValues === undefined ||
          userValues === null
        ) {
          vals = el.getAttribute(options.get("tagValuesAttribute"));
          if (vals === undefined || vals === null) {
            vals = utils.html(el);
          }
          if (vals) {
            values = vals.replace(/(^\s*<!--)|(-->\s*$)|\s+/g, "").split(",");
          } else {
            values = [];
          }
        } else {
          values = userValues;
        }

        width =
          options.get("width") === "auto"
            ? values.length * options.get("defaultPixelsPerValue")
            : options.get("width");

        // Use default width if calculated width is too small
        if (width < 50) {
          width = 300;
        }
        if (options.get("height") === "auto") {
          if (!options.get("composite") || !utils.data(el, "_jqs_vcanvas")) {
            // must be a better way to get the line height
            tmp = document.createElement("span");
            tmp.innerHTML = "a";
            utils.html(el, tmp.outerHTML);
            height = utils.height(tmp) || utils.height(tmp);
            utils.remove(tmp);
            tmp = null;
          }
        } else {
          height = options.get("height");
        }

        // Use default height if calculated height is too small
        if (height < 20) {
          height = 150;
        }

        if (!options.get("disableInteraction")) {
          mhandler = utils.data(el, "_jqs_mhandler");
          if (!mhandler) {
            mhandler = new MouseHandler(el, options);
            utils.data(el, "_jqs_mhandler", mhandler);
          } else if (!options.get("composite")) {
            mhandler.reset();
          }
        } else {
          mhandler = false;
        }

        if (options.get("composite") && !utils.data(el, "_jqs_vcanvas")) {
          if (!utils.data(el, "_jqs_errnotify")) {
            alert(
              "Attempted to attach a composite sparkline to an element with no existing sparkline"
            );
            utils.data(el, "_jqs_errnotify", true);
          }
          return;
        }

        sp = new sparklines[options.get("type")](
          el,
          values,
          options,
          width,
          height
        );

        sp.render();

        // Store the sparkline object on the element
        utils.data(el, "_jqs_sparkline", sp);

        if (mhandler) {
          mhandler.registerSparkline(sp);
        }
      };
      if (
        (utils.html(el) &&
          !options.get("disableHiddenCheck") &&
          utils.is(el, ":hidden")) ||
        !utils.parents(el, "body").length
      ) {
        if (!options.get("composite") && utils.data(el, "_jqs_pending")) {
          // remove any existing references to the element
          for (i = pending.length; i; i--) {
            if (pending[i - 1][0] == el) {
              pending.splice(i - 1, 1);
            }
          }
        }
        pending.push([el, render]);
        utils.data(el, "_jqs_pending", true);
      } else {
        render.call(el);
      }
    });
  }

  sparklines.defaults = getDefaults();

  sparklines.display_visible = function () {
    var el, i, pl;
    var done = [];
    for (i = 0, pl = pending.length; i < pl; i++) {
      el = pending[i][0];
      if (
        utils.is(el, ":visible") &&
        !utils.parents(el).some(function (p) {
          return utils.is(p, ":hidden");
        })
      ) {
        pending[i][1].call(el);
        utils.data(pending[i][0], "_jqs_pending", false);
        done.push(i);
      } else if (
        !utils.closest(el, "html") &&
        !utils.data(el, "_jqs_pending")
      ) {
        // element has been inserted and removed from the DOM
        // If it was not yet inserted into the dom then the .data request
        // will return true.
        // removing from the dom causes the data to be removed.
        utils.data(pending[i][0], "_jqs_pending", false);
        done.push(i);
      }
    }
    for (i = done.length; i; i--) {
      pending.splice(done[i - 1], 1);
    }
  };

  /**
   * User option handler
   */
  sparklines.options = createClass({
    init: function (tag, userOptions) {
      var extendedOptions, defaults, base, tagOptionType;
      this.userOptions = userOptions = userOptions || {};
      this.tag = tag;
      this.tagValCache = {};
      defaults = sparklines.defaults;
      base = defaults.common;
      this.tagOptionsPrefix =
        userOptions.enableTagOptions &&
        (userOptions.tagOptionsPrefix || base.tagOptionsPrefix);

      tagOptionType = this.getTagSetting("type");
      if (tagOptionType === UNSET_OPTION) {
        extendedOptions = defaults[userOptions.type || base.type];
      } else {
        extendedOptions = defaults[tagOptionType];
      }
      this.mergedOptions = utils.extend({}, base, extendedOptions, userOptions);
    },

    getTagSetting: function (key) {
      var prefix = this.tagOptionsPrefix,
        val,
        i,
        pairs,
        keyval;
      if (prefix === false || prefix === undefined) {
        return UNSET_OPTION;
      }
      if (this.tagValCache.hasOwnProperty(key)) {
        val = this.tagValCache.key;
      } else {
        val = this.tag.getAttribute(prefix + key);
        if (val === undefined || val === null) {
          val = UNSET_OPTION;
        } else if (val.substr(0, 1) === "[") {
          val = val.substr(1, val.length - 2).split(",");
          for (i = val.length; i--; ) {
            val[i] = normalizeValue(val[i].replace(/(^\s*)|(\s*$)/g, ""));
          }
        } else if (val.substr(0, 1) === "{") {
          pairs = val.substr(1, val.length - 2).split(",");
          val = {};
          for (i = pairs.length; i--; ) {
            keyval = pairs[i].split(":", 2);
            val[keyval[0].replace(/(^\s*)|(\s*$)/g, "")] = normalizeValue(
              keyval[1].replace(/(^\s*)|(\s*$)/g, "")
            );
          }
        } else {
          val = normalizeValue(val);
        }
        this.tagValCache.key = val;
      }
      return val;
    },

    get: function (key, defaultval) {
      var tagOption = this.getTagSetting(key),
        result;
      if (tagOption !== UNSET_OPTION) {
        return tagOption;
      }
      return (result = this.mergedOptions[key]) === undefined
        ? defaultval
        : result;
    },
  });

  MouseHandler = createClass({
    init: function (el, options) {
      this.el = el;
      this.options = options;
      this.currentPageX = 0;
      this.currentPageY = 0;
      this.splist = [];
      this.tooltip = null;
      this.over = false;
      this.displayTooltips = !options.get("disableTooltips");
      this.highlightEnabled = !options.get("disableHighlight");
    },

    registerSparkline: function (sp) {
      this.splist.push(sp);
      if (this.over) {
        this.updateDisplay();
      }
    },

    registerCanvas: function (canvas) {
      var canvasEl = canvas.canvas;
      this.canvas = canvas;
      this.canvasEl = canvasEl;

      // Use addEventListener instead of jQuery events
      canvasEl.addEventListener(
        "mouseenter",
        utils.proxy(this.mouseenter, this)
      );
      canvasEl.addEventListener(
        "mouseleave",
        utils.proxy(this.mouseleave, this)
      );
      canvasEl.addEventListener("click", utils.proxy(this.mouseclick, this));
    },

    reset: function (removeTooltip) {
      this.splist = [];
      if (this.tooltip && removeTooltip) {
        this.tooltip.remove();
        this.tooltip = undefined;
      }
    },

    mouseclick: function (e) {
      var clickEvent = utils.Event("sparklineClick");
      clickEvent.originalEvent = e;
      clickEvent.sparklines = this.splist;
      utils.trigger(this.el, clickEvent);
    },

    mouseenter: function (e) {
      document.body.removeEventListener("mousemove", this.mousemoveHandler);
      this.mousemoveHandler = utils.proxy(this.mousemove, this);
      document.body.addEventListener("mousemove", this.mousemoveHandler);
      this.over = true;
      this.currentPageX = e.pageX;
      this.currentPageY = e.pageY;
      this.currentEl = e.target;
      if (!this.tooltip && this.displayTooltips) {
        this.tooltip = new Tooltip(this.options);
        this.tooltip.updatePosition(e.pageX, e.pageY);
      }
      this.updateDisplay();
    },

    mouseleave: function () {
      document.body.removeEventListener("mousemove", this.mousemoveHandler);
      var splist = this.splist,
        spcount = splist.length,
        needsRefresh = false,
        sp,
        i;
      this.over = false;
      this.currentEl = null;

      if (this.tooltip) {
        this.tooltip.remove();
        this.tooltip = null;
      }

      for (i = 0; i < spcount; i++) {
        sp = splist[i];
        if (sp.clearRegionHighlight()) {
          needsRefresh = true;
        }
      }

      if (needsRefresh) {
        this.canvas.render();
      }
    },

    mousemove: function (e) {
      this.currentPageX = e.pageX;
      this.currentPageY = e.pageY;
      this.currentEl = e.target;
      if (this.tooltip) {
        this.tooltip.updatePosition(e.pageX, e.pageY);
      }
      this.updateDisplay();
    },

    updateDisplay: function () {
      var splist = this.splist,
        spcount = splist.length,
        needsRefresh = false,
        offset = utils.offset(this.canvasEl),
        localX = this.currentPageX - offset.left,
        localY = this.currentPageY - offset.top,
        tooltiphtml,
        sp,
        i,
        result,
        changeEvent;
      if (!this.over) {
        return;
      }
      for (i = 0; i < spcount; i++) {
        sp = splist[i];
        result = sp.setRegionHighlight(this.currentEl, localX, localY);
        if (result) {
          needsRefresh = true;
        }
      }
      if (needsRefresh) {
        changeEvent = utils.Event("sparklineRegionChange");
        changeEvent.sparklines = this.splist;
        utils.trigger(this.el, changeEvent);
        if (this.tooltip) {
          tooltiphtml = "";
          for (i = 0; i < spcount; i++) {
            sp = splist[i];
            tooltiphtml += sp.getCurrentRegionTooltip();
          }
          this.tooltip.setContent(tooltiphtml);
        }
        if (!this.disableHighlight) {
          this.canvas.render();
        }
      }
      if (result === null) {
        this.mouseleave();
      }
    },
  });

  Tooltip = createClass({
    sizeStyle:
      "position: static !important;" +
      "display: block !important;" +
      "visibility: hidden !important;" +
      "float: left !important;",

    init: function (options) {
      var tooltipClassname = options.get("tooltipClassname", "jqstooltip"),
        sizetipStyle = this.sizeStyle,
        offset;
      this.container = options.get("tooltipContainer") || document.body;
      this.tooltipOffsetX = options.get("tooltipOffsetX", 10);
      this.tooltipOffsetY = options.get("tooltipOffsetY", 12);
      // remove any previous lingering tooltip
      var existingSizetip = document.getElementById("jqssizetip");
      var existingTooltip = document.getElementById("jqstooltip");
      if (existingSizetip) existingSizetip.remove();
      if (existingTooltip) existingTooltip.remove();

      this.sizetip = document.createElement("div");
      this.sizetip.id = "jqssizetip";
      this.sizetip.style.cssText = sizetipStyle;
      this.sizetip.className = tooltipClassname;

      this.tooltip = document.createElement("div");
      this.tooltip.id = "jqstooltip";
      this.tooltip.className = tooltipClassname;
      this.container.appendChild(this.tooltip);

      this.hidden = true;

      // Use addEventListener instead of jQuery events
      var resizeHandler = utils.proxy(this.updateWindowDims, this);
      window.removeEventListener("resize", resizeHandler);
      window.removeEventListener("scroll", resizeHandler);
      window.addEventListener("resize", resizeHandler);
      window.addEventListener("scroll", resizeHandler);
      this.updateWindowDims();
    },

    updateWindowDims: function () {
      this.scrollTop = window.pageYOffset;
      this.scrollLeft = window.pageXOffset;
      this.scrollRight = this.scrollLeft + window.innerWidth;
      this.updatePosition();
    },

    getSize: function (content) {
      this.sizetip.innerHTML = content;
      this.container.appendChild(this.sizetip);
      this.width = utils.width(this.sizetip) + 1;
      this.height = utils.height(this.sizetip);
      utils.remove(this.sizetip);
    },

    setContent: function (content) {
      if (!this.tooltip) return;

      if (!content) {
        utils.css(this.tooltip, "visibility", "hidden");
        this.hidden = true;
        return;
      }
      this.getSize(content);
      this.tooltip.innerHTML = content;
      utils.css(this.tooltip, {
        width: this.width,
        height: this.height,
        visibility: "visible",
      });
      if (this.hidden) {
        this.hidden = false;
        this.updatePosition();
      }
    },

    updatePosition: function (x, y) {
      if (!this.tooltip) return;

      if (x === undefined) {
        if (this.mousex === undefined) {
          return;
        }
        x = this.mousex;
        y = this.mousey;
      } else {
        this.mousex = x;
        this.mousey = y;
      }
      if (!this.height || !this.width || this.hidden) {
        return;
      }

      // Position tooltip relative to mouse position
      y -= this.height + this.tooltipOffsetY;
      x += this.tooltipOffsetX;

      // Keep tooltip within viewport
      if (y < this.scrollTop) {
        y = this.scrollTop;
      }
      if (x < this.scrollLeft) {
        x = this.scrollLeft;
      } else if (x + this.width > this.scrollRight) {
        x = this.scrollRight - this.width;
      }

      utils.css(this.tooltip, {
        left: x + "px",
        top: y + "px",
      });
    },

    remove: function () {
      utils.remove(this.tooltip);
      utils.remove(this.sizetip);
      this.sizetip = this.tooltip = undefined;
      var resizeHandler = utils.proxy(this.updateWindowDims, this);
      window.removeEventListener("resize", resizeHandler);
      window.removeEventListener("scroll", resizeHandler);
    },
  });

  sparklines._base = createClass({
    disabled: false,

    init: function (el, values, options, width, height) {
      this.el = el;
      this.values = values;
      this.options = options;
      this.width = width;
      this.height = height;
      this.currentRegion = undefined;
    },

    /**
     * Setup the canvas
     */
    initTarget: function () {
      var interactive = !this.options.get("disableInteraction");
      if (
        !(this.target = simpledraw(
          this.el,
          this.width,
          this.height,
          this.options.get("composite"),
          interactive
        ))
      ) {
        this.disabled = true;
      } else {
        this.canvasWidth = this.target.pixelWidth;
        this.canvasHeight = this.target.pixelHeight;
      }
    },

    /**
     * Actually render the chart to the canvas
     */
    render: function () {
      if (this.disabled) {
        this.el.innerHTML = "";
        return false;
      }
      return true;
    },

    /**
     * Return a region id for a given x/y co-ordinate
     */
    getRegion: function (x, y) {},

    /**
     * Highlight an item based on the moused-over x,y co-ordinate
     */
    setRegionHighlight: function (el, x, y) {
      var currentRegion = this.currentRegion,
        highlightEnabled = !this.options.get("disableHighlight"),
        newRegion;
      if (x > this.canvasWidth || y > this.canvasHeight || x < 0 || y < 0) {
        return null;
      }
      newRegion = this.getRegion(el, x, y);
      if (currentRegion !== newRegion) {
        if (currentRegion !== undefined && highlightEnabled) {
          this.removeHighlight();
        }
        this.currentRegion = newRegion;
        if (newRegion !== undefined && highlightEnabled) {
          this.renderHighlight();
        }
        return true;
      }
      return false;
    },

    /**
     * Reset any currently highlighted item
     */
    clearRegionHighlight: function () {
      if (this.currentRegion !== undefined) {
        this.removeHighlight();
        this.currentRegion = undefined;
        return true;
      }
      return false;
    },

    renderHighlight: function () {
      this.changeHighlight(true);
    },

    removeHighlight: function () {
      this.changeHighlight(false);
    },

    changeHighlight: function (highlight) {},

    /**
     * Fetch the HTML to display as a tooltip
     */
    getCurrentRegionTooltip: function () {
      var options = this.options,
        header = "",
        entries = [],
        fields,
        formats,
        formatlen,
        fclass,
        text,
        i,
        showFields,
        showFieldsKey,
        newFields,
        fv,
        formatter,
        format,
        fieldlen,
        j;
      if (this.currentRegion === undefined) {
        return "";
      }
      fields = this.getCurrentRegionFields();
      formatter = options.get("tooltipFormatter");
      if (formatter) {
        return formatter(this, options, fields);
      }
      if (options.get("tooltipChartTitle")) {
        header +=
          '<div class="jqs jqstitle">' +
          options.get("tooltipChartTitle") +
          "</div>\n";
      }
      formats = this.options.get("tooltipFormat");
      if (!formats) {
        return "";
      }
      if (!utils.isArray(formats)) {
        formats = [formats];
      }
      if (!utils.isArray(fields)) {
        fields = [fields];
      }
      showFields = this.options.get("tooltipFormatFieldlist");
      showFieldsKey = this.options.get("tooltipFormatFieldlistKey");
      if (showFields && showFieldsKey) {
        // user-selected ordering of fields
        newFields = [];
        for (i = fields.length; i--; ) {
          fv = fields[i][showFieldsKey];
          if ((j = utils.inArray(fv, showFields)) != -1) {
            newFields[j] = fields[i];
          }
        }
        fields = newFields;
      }
      formatlen = formats.length;
      fieldlen = fields.length;
      for (i = 0; i < formatlen; i++) {
        format = formats[i];
        if (typeof format === "string") {
          format = new SPFormat(format);
        }
        fclass = format.fclass || "jqsfield";
        for (j = 0; j < fieldlen; j++) {
          if (!fields[j].isNull || !options.get("tooltipSkipNull")) {
            utils.extend(fields[j], {
              prefix: options.get("tooltipPrefix"),
              suffix: options.get("tooltipSuffix"),
            });
            text = format.render(
              fields[j],
              options.get("tooltipValueLookups"),
              options
            );
            entries.push('<div class="' + fclass + '">' + text + "</div>");
          }
        }
      }
      if (entries.length) {
        return header + entries.join("\n");
      }
      return "";
    },

    getCurrentRegionFields: function () {},

    calcHighlightColor: function (color, options) {
      var highlightColor = options.get("highlightColor"),
        lighten = options.get("highlightLighten"),
        parse,
        mult,
        rgbnew,
        i;
      if (highlightColor) {
        return highlightColor;
      }
      if (lighten) {
        // extract RGB values
        parse =
          /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(color) ||
          /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(color);
        if (parse) {
          rgbnew = [];
          mult = color.length === 4 ? 16 : 1;
          for (i = 0; i < 3; i++) {
            rgbnew[i] = clipval(
              Math.round(parseInt(parse[i + 1], 16) * mult * lighten),
              0,
              255
            );
          }
          return "rgb(" + rgbnew.join(",") + ")";
        }
      }
      return color;
    },
  });

  barHighlightMixin = {
    changeHighlight: function (highlight) {
      var currentRegion = this.currentRegion,
        target = this.target,
        shapeids = this.regionShapes[currentRegion],
        newShapes;
      // will be null if the region value was null
      if (shapeids) {
        newShapes = this.renderRegion(currentRegion, highlight);
        if (utils.isArray(newShapes) || utils.isArray(shapeids)) {
          target.replaceWithShapes(shapeids, newShapes);
          this.regionShapes[currentRegion] = utils.map(
            newShapes,
            function (newShape) {
              return newShape.id;
            }
          );
        } else {
          target.replaceWithShape(shapeids, newShapes);
          this.regionShapes[currentRegion] = newShapes.id;
        }
      }
    },

    render: function () {
      var values = this.values,
        target = this.target,
        regionShapes = this.regionShapes,
        shapes,
        ids,
        i,
        j;

      if (!this.cls._super.render.call(this)) {
        return;
      }

      for (i = values.length; i--; ) {
        shapes = this.renderRegion(i);
        if (shapes) {
          if (utils.isArray(shapes)) {
            ids = [];
            for (j = shapes.length; j--; ) {
              shapes[j].append();
              ids.push(shapes[j].id);
            }
            regionShapes[i] = ids;
          } else {
            shapes.append();
            regionShapes[i] = shapes.id; // store just the shapeid
          }
        } else {
          // null value
          regionShapes[i] = null;
        }
      }
      target.render();
    },
  };

  /**
   * Line charts
   */
  sparklines.line = line = createClass(sparklines._base, {
    type: "line",

    init: function (el, values, options, width, height) {
      line._super.init.call(this, el, values, options, width, height);
      this.vertices = [];
      this.regionMap = [];
      this.xvalues = [];
      this.yvalues = [];
      this.yminmax = [];
      this.hightlightSpotId = null;
      this.lastShapeId = null;
      this.initTarget();
    },

    getRegion: function (el, x, y) {
      var i,
        regionMap = this.regionMap; // maps regions to value positions
      for (i = regionMap.length; i--; ) {
        if (
          regionMap[i] !== null &&
          x >= regionMap[i][0] &&
          x <= regionMap[i][1]
        ) {
          return regionMap[i][2];
        }
      }
      return undefined;
    },

    getCurrentRegionFields: function () {
      var currentRegion = this.currentRegion;
      return {
        isNull: this.yvalues[currentRegion] === null,
        x: this.xvalues[currentRegion],
        y: this.yvalues[currentRegion],
        color: this.options.get("lineColor"),
        fillColor: this.options.get("fillColor"),
        offset: currentRegion,
      };
    },

    renderHighlight: function () {
      var currentRegion = this.currentRegion,
        target = this.target,
        vertex = this.vertices[currentRegion],
        options = this.options,
        spotRadius = options.get("spotRadius"),
        highlightSpotColor = options.get("highlightSpotColor"),
        highlightLineColor = options.get("highlightLineColor"),
        highlightSpot,
        highlightLine;

      if (!vertex) {
        return;
      }
      if (spotRadius && highlightSpotColor) {
        highlightSpot = target.drawCircle(
          vertex[0],
          vertex[1],
          spotRadius,
          undefined,
          highlightSpotColor
        );
        this.highlightSpotId = highlightSpot.id;
        target.insertAfterShape(this.lastShapeId, highlightSpot);
      }
      if (highlightLineColor) {
        highlightLine = target.drawLine(
          vertex[0],
          this.canvasTop,
          vertex[0],
          this.canvasTop + this.canvasHeight,
          highlightLineColor
        );
        this.highlightLineId = highlightLine.id;
        target.insertAfterShape(this.lastShapeId, highlightLine);
      }
    },

    removeHighlight: function () {
      var target = this.target;
      if (this.highlightSpotId) {
        target.removeShapeId(this.highlightSpotId);
        this.highlightSpotId = null;
      }
      if (this.highlightLineId) {
        target.removeShapeId(this.highlightLineId);
        this.highlightLineId = null;
      }
    },

    scanValues: function () {
      var values = this.values,
        valcount = values.length,
        xvalues = this.xvalues,
        yvalues = this.yvalues,
        yminmax = this.yminmax,
        i,
        val,
        isStr,
        isArray,
        sp;
      for (i = 0; i < valcount; i++) {
        val = values[i];
        isStr = typeof values[i] === "string";
        isArray = typeof values[i] === "object" && values[i] instanceof Array;
        sp = isStr && values[i].split(":");
        if (isStr && sp.length === 2) {
          // x:y
          xvalues.push(Number(sp[0]));
          yvalues.push(Number(sp[1]));
          yminmax.push(Number(sp[1]));
        } else if (isArray) {
          xvalues.push(val[0]);
          yvalues.push(val[1]);
          yminmax.push(val[1]);
        } else {
          xvalues.push(i);
          if (values[i] === null || values[i] === "null") {
            yvalues.push(null);
          } else {
            yvalues.push(Number(val));
            yminmax.push(Number(val));
          }
        }
      }
      if (this.options.get("xvalues")) {
        xvalues = this.options.get("xvalues");
      }

      this.maxy = this.maxyorg = Math.max.apply(Math, yminmax);
      this.miny = this.minyorg = Math.min.apply(Math, yminmax);

      this.maxx = Math.max.apply(Math, xvalues);
      this.minx = Math.min.apply(Math, xvalues);

      this.xvalues = xvalues;
      this.yvalues = yvalues;
      this.yminmax = yminmax;
    },

    processRangeOptions: function () {
      var options = this.options,
        normalRangeMin = options.get("normalRangeMin"),
        normalRangeMax = options.get("normalRangeMax");

      if (normalRangeMin !== undefined) {
        if (normalRangeMin < this.miny) {
          this.miny = normalRangeMin;
        }
        if (normalRangeMax > this.maxy) {
          this.maxy = normalRangeMax;
        }
      }
      if (
        options.get("chartRangeMin") !== undefined &&
        (options.get("chartRangeClip") ||
          options.get("chartRangeMin") < this.miny)
      ) {
        this.miny = options.get("chartRangeMin");
      }
      if (
        options.get("chartRangeMax") !== undefined &&
        (options.get("chartRangeClip") ||
          options.get("chartRangeMax") > this.maxy)
      ) {
        this.maxy = options.get("chartRangeMax");
      }
      if (
        options.get("chartRangeMinX") !== undefined &&
        (options.get("chartRangeClipX") ||
          options.get("chartRangeMinX") < this.minx)
      ) {
        this.minx = options.get("chartRangeMinX");
      }
      if (
        options.get("chartRangeMaxX") !== undefined &&
        (options.get("chartRangeClipX") ||
          options.get("chartRangeMaxX") > this.maxx)
      ) {
        this.maxx = options.get("chartRangeMaxX");
      }
    },

    drawNormalRange: function (
      canvasLeft,
      canvasTop,
      canvasHeight,
      canvasWidth,
      rangey
    ) {
      var normalRangeMin = this.options.get("normalRangeMin"),
        normalRangeMax = this.options.get("normalRangeMax"),
        ytop =
          canvasTop +
          Math.round(
            canvasHeight -
              canvasHeight * ((normalRangeMax - this.miny) / rangey)
          ),
        height = Math.round(
          (canvasHeight * (normalRangeMax - normalRangeMin)) / rangey
        );
      this.target
        .drawRect(
          canvasLeft,
          ytop,
          canvasWidth,
          height,
          undefined,
          this.options.get("normalRangeColor")
        )
        .append();
    },

    render: function () {
      var options = this.options,
        target = this.target,
        canvasWidth = this.canvasWidth,
        canvasHeight = this.canvasHeight,
        vertices = this.vertices,
        spotRadius = options.get("spotRadius"),
        regionMap = this.regionMap,
        rangex,
        rangey,
        yvallast,
        canvasTop,
        canvasLeft,
        vertex,
        path,
        paths,
        x,
        y,
        xnext,
        xpos,
        xposnext,
        last,
        next,
        yvalcount,
        lineShapes,
        fillShapes,
        plen,
        valueSpots,
        hlSpotsEnabled,
        color,
        xvalues,
        yvalues,
        i;

      if (!line._super.render.call(this)) {
        return;
      }

      this.scanValues();
      this.processRangeOptions();

      xvalues = this.xvalues;
      yvalues = this.yvalues;

      if (!this.yminmax.length || this.yvalues.length < 2) {
        // empty or all null valuess
        return;
      }

      canvasTop = canvasLeft = 0;

      rangex = this.maxx - this.minx === 0 ? 1 : this.maxx - this.minx;
      rangey = this.maxy - this.miny === 0 ? 1 : this.maxy - this.miny;
      yvallast = this.yvalues.length - 1;

      if (
        spotRadius &&
        (canvasWidth < spotRadius * 4 || canvasHeight < spotRadius * 4)
      ) {
        spotRadius = 0;
      }
      if (spotRadius) {
        // adjust the canvas size as required so that spots will fit
        hlSpotsEnabled =
          options.get("highlightSpotColor") &&
          !options.get("disableInteraction");
        if (
          hlSpotsEnabled ||
          options.get("minSpotColor") ||
          (options.get("spotColor") && yvalues[yvallast] === this.miny)
        ) {
          canvasHeight -= Math.ceil(spotRadius);
        }
        if (
          hlSpotsEnabled ||
          options.get("maxSpotColor") ||
          (options.get("spotColor") && yvalues[yvallast] === this.maxy)
        ) {
          canvasHeight -= Math.ceil(spotRadius);
          canvasTop += Math.ceil(spotRadius);
        }
        if (
          hlSpotsEnabled ||
          ((options.get("minSpotColor") || options.get("maxSpotColor")) &&
            (yvalues[0] === this.miny || yvalues[0] === this.maxy))
        ) {
          canvasLeft += Math.ceil(spotRadius);
          canvasWidth -= Math.ceil(spotRadius);
        }
        if (
          hlSpotsEnabled ||
          options.get("spotColor") ||
          options.get("minSpotColor") ||
          (options.get("maxSpotColor") &&
            (yvalues[yvallast] === this.miny ||
              yvalues[yvallast] === this.maxy))
        ) {
          canvasWidth -= Math.ceil(spotRadius);
        }
      }

      canvasHeight--;

      if (
        options.get("normalRangeMin") !== undefined &&
        !options.get("drawNormalOnTop")
      ) {
        this.drawNormalRange(
          canvasLeft,
          canvasTop,
          canvasHeight,
          canvasWidth,
          rangey
        );
      }

      path = [];
      paths = [path];
      last = next = null;
      yvalcount = yvalues.length;
      for (i = 0; i < yvalcount; i++) {
        x = xvalues[i];
        xnext = xvalues[i + 1];
        y = yvalues[i];
        xpos =
          canvasLeft + Math.round((x - this.minx) * (canvasWidth / rangex));
        xposnext =
          i < yvalcount - 1
            ? canvasLeft +
              Math.round((xnext - this.minx) * (canvasWidth / rangex))
            : canvasWidth;
        next = xpos + (xposnext - xpos) / 2;
        regionMap[i] = [last || 0, next, i];
        last = next;
        if (y === null) {
          if (i) {
            if (yvalues[i - 1] !== null) {
              path = [];
              paths.push(path);
            }
            vertices.push(null);
          }
        } else {
          if (y < this.miny) {
            y = this.miny;
          }
          if (y > this.maxy) {
            y = this.maxy;
          }
          if (!path.length) {
            // previous value was null
            path.push([xpos, canvasTop + canvasHeight]);
          }
          vertex = [
            xpos,
            canvasTop +
              Math.round(
                canvasHeight - canvasHeight * ((y - this.miny) / rangey)
              ),
          ];
          path.push(vertex);
          vertices.push(vertex);
        }
      }

      lineShapes = [];
      fillShapes = [];
      plen = paths.length;
      for (i = 0; i < plen; i++) {
        path = paths[i];
        if (path.length) {
          if (options.get("fillColor")) {
            path.push([path[path.length - 1][0], canvasTop + canvasHeight]);
            fillShapes.push(path.slice(0));
            path.pop();
          }
          // if there's only a single point in this path, then we want to display it
          // as a vertical line which means we keep path[0]  as is
          if (path.length > 2) {
            // else we want the first value
            path[0] = [path[0][0], path[1][1]];
          }
          lineShapes.push(path);
        }
      }

      // draw the fill first, then optionally the normal range, then the line on top of that
      plen = fillShapes.length;
      for (i = 0; i < plen; i++) {
        target
          .drawShape(
            fillShapes[i],
            options.get("fillColor"),
            options.get("fillColor")
          )
          .append();
      }

      if (
        options.get("normalRangeMin") !== undefined &&
        options.get("drawNormalOnTop")
      ) {
        this.drawNormalRange(
          canvasLeft,
          canvasTop,
          canvasHeight,
          canvasWidth,
          rangey
        );
      }

      plen = lineShapes.length;
      for (i = 0; i < plen; i++) {
        target
          .drawShape(
            lineShapes[i],
            options.get("lineColor"),
            undefined,
            options.get("lineWidth")
          )
          .append();
      }

      if (spotRadius && options.get("valueSpots")) {
        valueSpots = options.get("valueSpots");
        if (valueSpots.get === undefined) {
          valueSpots = new RangeMap(valueSpots);
        }
        for (i = 0; i < yvalcount; i++) {
          color = valueSpots.get(yvalues[i]);
          if (color) {
            target
              .drawCircle(
                canvasLeft +
                  Math.round((xvalues[i] - this.minx) * (canvasWidth / rangex)),
                canvasTop +
                  Math.round(
                    canvasHeight -
                      canvasHeight * ((yvalues[i] - this.miny) / rangey)
                  ),
                spotRadius,
                undefined,
                color
              )
              .append();
          }
        }
      }
      if (
        spotRadius &&
        options.get("spotColor") &&
        yvalues[yvallast] !== null
      ) {
        target
          .drawCircle(
            canvasLeft +
              Math.round(
                (xvalues[xvalues.length - 1] - this.minx) *
                  (canvasWidth / rangex)
              ),
            canvasTop +
              Math.round(
                canvasHeight -
                  canvasHeight * ((yvalues[yvallast] - this.miny) / rangey)
              ),
            spotRadius,
            undefined,
            options.get("spotColor")
          )
          .append();
      }
      if (this.maxy !== this.minyorg) {
        if (spotRadius && options.get("minSpotColor")) {
          x = xvalues[utils.inArray(this.minyorg, yvalues)];
          target
            .drawCircle(
              canvasLeft + Math.round((x - this.minx) * (canvasWidth / rangex)),
              canvasTop +
                Math.round(
                  canvasHeight -
                    canvasHeight * ((this.minyorg - this.miny) / rangey)
                ),
              spotRadius,
              undefined,
              options.get("minSpotColor")
            )
            .append();
        }
        if (spotRadius && options.get("maxSpotColor")) {
          x = xvalues[utils.inArray(this.maxyorg, yvalues)];
          target
            .drawCircle(
              canvasLeft + Math.round((x - this.minx) * (canvasWidth / rangex)),
              canvasTop +
                Math.round(
                  canvasHeight -
                    canvasHeight * ((this.maxyorg - this.miny) / rangey)
                ),
              spotRadius,
              undefined,
              options.get("maxSpotColor")
            )
            .append();
        }
      }

      this.lastShapeId = target.getLastShapeId();
      this.canvasTop = canvasTop;
      target.render();
    },
  });

  // Continue with remaining chart types - Bar, Tristate, Discrete, Bullet, Pie, Box
  // Due to space constraints, implementing key chart types with vanilla JS conversions

  /**
   * Bar charts
   */
  sparklines.bar = bar = createClass(sparklines._base, barHighlightMixin, {
    type: "bar",

    init: function (el, values, options, width, height) {
      var barWidth = parseInt(options.get("barWidth"), 10),
        barSpacing = parseInt(options.get("barSpacing"), 10),
        chartRangeMin = options.get("chartRangeMin"),
        chartRangeMax = options.get("chartRangeMax"),
        chartRangeClip = options.get("chartRangeClip"),
        stackMin = Infinity,
        stackMax = -Infinity,
        isStackString,
        groupMin,
        groupMax,
        stackRanges,
        numValues,
        i,
        vlen,
        range,
        zeroAxis,
        xaxisOffset,
        min,
        max,
        clipMin,
        clipMax,
        stacked,
        vlist,
        j,
        slen,
        svals,
        val,
        yoffset,
        yMaxCalc,
        canvasHeightEf;
      bar._super.init.call(this, el, values, options, width, height);

      // scan values to determine whether to stack bars
      for (i = 0, vlen = values.length; i < vlen; i++) {
        val = values[i];
        isStackString = typeof val === "string" && val.indexOf(":") > -1;
        if (isStackString || utils.isArray(val)) {
          stacked = true;
          if (isStackString) {
            val = values[i] = normalizeValues(val.split(":"));
          }
          val = remove(val, null); // min/max will treat null as zero
          groupMin = Math.min.apply(Math, val);
          groupMax = Math.max.apply(Math, val);
          if (groupMin < stackMin) {
            stackMin = groupMin;
          }
          if (groupMax > stackMax) {
            stackMax = groupMax;
          }
        }
      }

      this.stacked = stacked;
      this.regionShapes = {};
      this.barWidth = barWidth;
      this.barSpacing = barSpacing;
      this.totalBarWidth = barWidth + barSpacing;
      this.width = width =
        values.length * barWidth + (values.length - 1) * barSpacing;

      this.initTarget();

      if (chartRangeClip) {
        clipMin = chartRangeMin === undefined ? -Infinity : chartRangeMin;
        clipMax = chartRangeMax === undefined ? Infinity : chartRangeMax;
      }

      numValues = [];
      stackRanges = stacked ? [] : numValues;
      var stackTotals = [];
      var stackRangesNeg = [];
      for (i = 0, vlen = values.length; i < vlen; i++) {
        if (stacked) {
          vlist = values[i];
          values[i] = svals = [];
          stackTotals[i] = 0;
          stackRanges[i] = stackRangesNeg[i] = 0;
          for (j = 0, slen = vlist.length; j < slen; j++) {
            val = svals[j] = chartRangeClip
              ? clipval(vlist[j], clipMin, clipMax)
              : vlist[j];
            if (val !== null) {
              if (val > 0) {
                stackTotals[i] += val;
              }
              if (stackMin < 0 && stackMax > 0) {
                if (val < 0) {
                  stackRangesNeg[i] += Math.abs(val);
                } else {
                  stackRanges[i] += val;
                }
              } else {
                stackRanges[i] += Math.abs(
                  val - (val < 0 ? stackMax : stackMin)
                );
              }
              numValues.push(val);
            }
          }
        } else {
          val = chartRangeClip
            ? clipval(values[i], clipMin, clipMax)
            : values[i];
          val = values[i] = normalizeValue(val);
          if (val !== null) {
            numValues.push(val);
          }
        }
      }
      this.max = max = Math.max.apply(Math, numValues);
      this.min = min = Math.min.apply(Math, numValues);
      this.stackMax = stackMax = stacked
        ? Math.max.apply(Math, stackTotals)
        : max;
      this.stackMin = stackMin = stacked
        ? Math.min.apply(Math, numValues)
        : min;

      if (
        options.get("chartRangeMin") !== undefined &&
        (options.get("chartRangeClip") || options.get("chartRangeMin") < min)
      ) {
        min = options.get("chartRangeMin");
      }
      if (
        options.get("chartRangeMax") !== undefined &&
        (options.get("chartRangeClip") || options.get("chartRangeMax") > max)
      ) {
        max = options.get("chartRangeMax");
      }

      this.zeroAxis = zeroAxis = options.get("zeroAxis", true);
      if (min <= 0 && max >= 0 && zeroAxis) {
        xaxisOffset = 0;
      } else if (zeroAxis == false) {
        xaxisOffset = min;
      } else if (min > 0) {
        xaxisOffset = min;
      } else {
        xaxisOffset = max;
      }
      this.xaxisOffset = xaxisOffset;

      range = stacked
        ? Math.max.apply(Math, stackRanges) +
          Math.max.apply(Math, stackRangesNeg)
        : max - min;

      // as we plot zero/min values a single pixel line, we add a pixel to all other
      // values - Reduce the effective canvas size to suit
      this.canvasHeightEf =
        zeroAxis && min < 0 ? this.canvasHeight - 2 : this.canvasHeight - 1;

      if (min < xaxisOffset) {
        yMaxCalc = stacked && max >= 0 ? stackMax : max;
        yoffset = ((yMaxCalc - xaxisOffset) / range) * this.canvasHeight;
        if (yoffset !== Math.ceil(yoffset)) {
          this.canvasHeightEf -= 2;
          yoffset = Math.ceil(yoffset);
        }
      } else {
        yoffset = this.canvasHeight;
      }
      this.yoffset = yoffset;

      if (utils.isArray(options.get("colorMap"))) {
        this.colorMapByIndex = options.get("colorMap");
        this.colorMapByValue = null;
      } else {
        this.colorMapByIndex = null;
        this.colorMapByValue = options.get("colorMap");
        if (this.colorMapByValue && this.colorMapByValue.get === undefined) {
          this.colorMapByValue = new RangeMap(this.colorMapByValue);
        }
      }

      this.range = range;
    },

    getRegion: function (el, x, y) {
      var result = Math.floor(x / this.totalBarWidth);
      return result < 0 || result >= this.values.length ? undefined : result;
    },

    getCurrentRegionFields: function () {
      var currentRegion = this.currentRegion,
        values = ensureArray(this.values[currentRegion]),
        result = [],
        value,
        i;
      for (i = values.length; i--; ) {
        value = values[i];
        result.push({
          isNull: value === null,
          value: value,
          color: this.calcColor(i, value, currentRegion),
          offset: currentRegion,
        });
      }
      return result;
    },

    calcColor: function (stacknum, value, valuenum) {
      var colorMapByIndex = this.colorMapByIndex,
        colorMapByValue = this.colorMapByValue,
        options = this.options,
        color,
        newColor;
      if (this.stacked) {
        color = options.get("stackedBarColor");
      } else {
        color =
          value < 0 ? options.get("negBarColor") : options.get("barColor");
      }
      if (value === 0 && options.get("zeroColor") !== undefined) {
        color = options.get("zeroColor");
      }
      if (colorMapByValue && (newColor = colorMapByValue.get(value))) {
        color = newColor;
      } else if (colorMapByIndex && colorMapByIndex.length > valuenum) {
        color = colorMapByIndex[valuenum];
      }
      return utils.isArray(color) ? color[stacknum % color.length] : color;
    },

    /**
     * Render bar(s) for a region
     */
    renderRegion: function (valuenum, highlight) {
      var vals = this.values[valuenum],
        options = this.options,
        xaxisOffset = this.xaxisOffset,
        result = [],
        range = this.range,
        stacked = this.stacked,
        target = this.target,
        x = valuenum * this.totalBarWidth,
        canvasHeightEf = this.canvasHeightEf,
        yoffset = this.yoffset,
        y,
        height,
        color,
        isNull,
        yoffsetNeg,
        i,
        valcount,
        val,
        minPlotted,
        allMin;

      vals = utils.isArray(vals) ? vals : [vals];
      valcount = vals.length;
      val = vals[0];
      isNull = all(null, vals);
      allMin = all(xaxisOffset, vals, true);

      if (isNull) {
        if (options.get("nullColor")) {
          color = highlight
            ? options.get("nullColor")
            : this.calcHighlightColor(options.get("nullColor"), options);
          y = yoffset > 0 ? yoffset - 1 : yoffset;
          return target.drawRect(x, y, this.barWidth - 1, 0, color, color);
        } else {
          return undefined;
        }
      }
      yoffsetNeg = yoffset;
      for (i = 0; i < valcount; i++) {
        val = vals[i];

        if (stacked && val === xaxisOffset) {
          if (!allMin || minPlotted) {
            continue;
          }
          minPlotted = true;
        }

        if (range > 0) {
          height =
            Math.floor(canvasHeightEf * (Math.abs(val - xaxisOffset) / range)) +
            1;
        } else {
          height = 1;
        }
        if (val < xaxisOffset || (val === xaxisOffset && yoffset === 0)) {
          y = yoffsetNeg;
          yoffsetNeg += height;
        } else {
          y = yoffset - height;
          yoffset -= height;
        }
        color = this.calcColor(i, val, valuenum);
        if (highlight) {
          color = this.calcHighlightColor(color, options);
        }
        result.push(
          target.drawRect(x, y, this.barWidth - 1, height - 1, color, color)
        );
      }
      if (result.length === 1) {
        return result[0];
      }
      return result;
    },
  });

  // Simplified implementations for other chart types
  sparklines.tristate = tristate = createClass(
    sparklines._base,
    barHighlightMixin,
    {
      type: "tristate",
      init: function (el, values, options, width, height) {
        tristate._super.init.call(this, el, values, options, width, height);
        this.regionShapes = {};
        this.barWidth = parseInt(options.get("barWidth"), 10);
        this.barSpacing = parseInt(options.get("barSpacing"), 10);
        this.totalBarWidth = this.barWidth + this.barSpacing;
        this.values = utils.map(values, Number);
        this.width = width =
          values.length * this.barWidth + (values.length - 1) * this.barSpacing;
        this.initTarget();
      },
      getRegion: function (el, x, y) {
        return Math.floor(x / this.totalBarWidth);
      },
      getCurrentRegionFields: function () {
        var currentRegion = this.currentRegion;
        return {
          isNull: this.values[currentRegion] === undefined,
          value: this.values[currentRegion],
          color: this.calcColor(this.values[currentRegion], currentRegion),
          offset: currentRegion,
        };
      },
      calcColor: function (value, valuenum) {
        var options = this.options;
        if (value < 0) return options.get("negBarColor");
        if (value > 0) return options.get("posBarColor");
        return options.get("zeroBarColor");
      },
      renderRegion: function (valuenum, highlight) {
        var values = this.values,
          options = this.options,
          target = this.target,
          canvasHeight = target.pixelHeight,
          height = Math.round(canvasHeight / 2),
          x = valuenum * this.totalBarWidth,
          y = values[valuenum] < 0 ? height : 0,
          color = this.calcColor(values[valuenum], valuenum);
        if (highlight) {
          color = this.calcHighlightColor(color, options);
        }
        return target.drawRect(
          x,
          y,
          this.barWidth - 1,
          height - 1,
          color,
          color
        );
      },
    }
  );

  sparklines.discrete = discrete = createClass(
    sparklines._base,
    barHighlightMixin,
    {
      type: "discrete",
      init: function (el, values, options, width, height) {
        discrete._super.init.call(this, el, values, options, width, height);
        this.regionShapes = {};
        this.values = utils.map(values, Number);
        this.min = Math.min.apply(Math, this.values);
        this.max = Math.max.apply(Math, this.values);
        this.range = this.max - this.min;
        this.width = width =
          options.get("width") === "auto" ? this.values.length * 2 : this.width;
        this.initTarget();
        if (this.target) {
          this.interval = Math.floor(this.canvasWidth / this.values.length);
          this.itemWidth = this.canvasWidth / this.values.length;
          this.lineHeight =
            options.get("lineHeight") === "auto"
              ? Math.round(this.canvasHeight * 0.3)
              : options.get("lineHeight") ||
                Math.round(this.canvasHeight * 0.3);
        }
      },
      getRegion: function (el, x, y) {
        return Math.floor(x / this.itemWidth);
      },
      getCurrentRegionFields: function () {
        var currentRegion = this.currentRegion;
        return {
          isNull: this.values[currentRegion] === undefined,
          value: this.values[currentRegion],
          offset: currentRegion,
        };
      },
      renderRegion: function (valuenum, highlight) {
        var values = this.values,
          options = this.options,
          min = this.min,
          max = this.max,
          range = this.range,
          interval = this.interval,
          target = this.target,
          canvasHeight = this.canvasHeight,
          lineHeight = this.lineHeight,
          pheight = canvasHeight - lineHeight,
          ytop,
          val,
          color,
          x;
        val = clipval(values[valuenum], min, max);
        x = valuenum * interval;
        ytop = Math.round(pheight - pheight * ((val - min) / range));
        color =
          options.get("thresholdColor") && val < options.get("thresholdValue")
            ? options.get("thresholdColor")
            : options.get("lineColor");
        if (highlight) {
          color = this.calcHighlightColor(color, options);
        }
        return target.drawLine(x, ytop, x, ytop + lineHeight, color);
      },
    }
  );

  sparklines.bullet = bullet = createClass(sparklines._base, {
    type: "bullet",
    init: function (el, values, options, width, height) {
      bullet._super.init.call(this, el, values, options, width, height);
      this.values = normalizeValues(values);
      this.min = Math.min.apply(Math, this.values);
      this.max = Math.max.apply(Math, this.values);
      this.range = this.max - this.min;
      this.shapes = {};
      this.valueShapes = {};
      this.regiondata = {};
      this.width = width = options.get("width") === "auto" ? "4.0em" : width;
      this.target = simpledraw(el, width, height, options.get("composite"));
      if (!values.length) {
        this.disabled = true;
      }
      this.initTarget();
    },
    getRegion: function (el, x, y) {
      var shapeid = this.target.getShapeAt(el, x, y);
      return shapeid !== undefined && this.shapes[shapeid] !== undefined
        ? this.shapes[shapeid]
        : undefined;
    },
    getCurrentRegionFields: function () {
      var currentRegion = this.currentRegion;
      return {
        fieldkey: currentRegion.substr(0, 1),
        value: this.values[currentRegion.substr(1)],
        region: currentRegion,
      };
    },
    render: function () {
      var vlen = this.values.length,
        target = this.target,
        i,
        shape;
      if (!bullet._super.render.call(this)) {
        return;
      }
      for (i = 2; i < vlen; i++) {
        shape = this.renderRange(i).append();
        this.shapes[shape.id] = "r" + i;
        this.valueShapes["r" + i] = shape.id;
      }
      if (this.values[1] !== null) {
        shape = this.renderPerformance().append();
        this.shapes[shape.id] = "p1";
        this.valueShapes.p1 = shape.id;
      }
      if (this.values[0] !== null) {
        shape = this.renderTarget().append();
        this.shapes[shape.id] = "t0";
        this.valueShapes.t0 = shape.id;
      }
      target.render();
    },
    renderRange: function (rn, highlight) {
      var rangeval = this.values[rn],
        rangewidth = Math.round(
          this.canvasWidth * ((rangeval - this.min) / this.range)
        ),
        color = this.options.get("rangeColors")[rn - 2];
      if (highlight) {
        color = this.calcHighlightColor(color, this.options);
      }
      return this.target.drawRect(
        0,
        0,
        rangewidth - 1,
        this.canvasHeight - 1,
        color,
        color
      );
    },
    renderPerformance: function (highlight) {
      var perfval = this.values[1],
        perfwidth = Math.round(
          this.canvasWidth * ((perfval - this.min) / this.range)
        ),
        color = this.options.get("performanceColor");
      if (highlight) {
        color = this.calcHighlightColor(color, this.options);
      }
      return this.target.drawRect(
        0,
        Math.round(this.canvasHeight * 0.3),
        perfwidth - 1,
        Math.round(this.canvasHeight * 0.4) - 1,
        color,
        color
      );
    },
    renderTarget: function (highlight) {
      var targetval = this.values[0],
        x = Math.round(
          this.canvasWidth * ((targetval - this.min) / this.range) -
            this.options.get("targetWidth") / 2
        ),
        targettop = Math.round(this.canvasHeight * 0.1),
        targetheight = this.canvasHeight - targettop * 2,
        color = this.options.get("targetColor");
      if (highlight) {
        color = this.calcHighlightColor(color, this.options);
      }
      return this.target.drawRect(
        x,
        targettop,
        this.options.get("targetWidth") - 1,
        targetheight - 1,
        color,
        color
      );
    },
  });

  sparklines.pie = pie = createClass(sparklines._base, {
    type: "pie",
    init: function (el, values, options, width, height) {
      pie._super.init.call(this, el, values, options, width, height);
      this.shapes = {};
      this.valueShapes = {};
      this.values = utils.map(values, Number);
      var total = 0;
      for (var i = this.values.length; i--; ) {
        total += this.values[i];
      }
      this.total = total;
      if (options.get("width") === "auto") {
        this.width = this.height;
      }
      this.initTarget();
      this.radius = Math.floor(
        Math.min(this.canvasWidth, this.canvasHeight) / 2
      );
    },
    getRegion: function (el, x, y) {
      var shapeid = this.target.getShapeAt(el, x, y);
      return shapeid !== undefined && this.shapes[shapeid] !== undefined
        ? this.shapes[shapeid]
        : undefined;
    },
    getCurrentRegionFields: function () {
      var currentRegion = this.currentRegion;
      return {
        isNull: this.values[currentRegion] === undefined,
        value: this.values[currentRegion],
        percent: (this.values[currentRegion] / this.total) * 100,
        color:
          this.options.get("sliceColors")[
            currentRegion % this.options.get("sliceColors").length
          ],
        offset: currentRegion,
      };
    },
    render: function () {
      var target = this.target,
        values = this.values,
        options = this.options,
        radius = this.radius,
        borderWidth = options.get("borderWidth"),
        shape,
        i;
      if (!pie._super.render.call(this)) {
        return;
      }
      if (borderWidth && radius > borderWidth) {
        target
          .drawCircle(
            radius,
            radius,
            Math.floor(radius - borderWidth / 2),
            options.get("borderColor"),
            undefined,
            borderWidth
          )
          .append();
      }
      for (i = values.length; i--; ) {
        if (values[i]) {
          shape = this.renderSlice(i).append();
          this.valueShapes[i] = shape.id;
          this.shapes[shape.id] = i;
        }
      }
      target.render();
    },
    renderSlice: function (valuenum, highlight) {
      var target = this.target,
        options = this.options,
        radius = this.radius,
        borderWidth = options.get("borderWidth"),
        offset = options.get("offset"),
        circle = 2 * Math.PI,
        values = this.values,
        total = this.total,
        next = offset ? 2 * Math.PI * (offset / 360) : 0,
        start,
        end,
        i,
        vlen,
        color;
      vlen = values.length;
      for (i = 0; i < vlen; i++) {
        start = next;
        end = next;
        if (total > 0) {
          end = next + circle * (values[i] / total);
        }
        if (valuenum === i) {
          color =
            options.get("sliceColors")[i % options.get("sliceColors").length];
          if (highlight) {
            color = this.calcHighlightColor(color, options);
          }
          return target.drawPieSlice(
            radius,
            radius,
            Math.max(1, radius - borderWidth),
            start,
            end,
            undefined,
            color
          );
        }
        next = end;
      }
    },
  });

  sparklines.box = box = createClass(sparklines._base, {
    type: "box",
    init: function (el, values, options, width, height) {
      box._super.init.call(this, el, values, options, width, height);
      this.values = utils.map(values, Number);
      this.width = options.get("width") === "auto" ? "4.0em" : width;
      this.initTarget();
      if (!this.values.length) {
        this.disabled = 1;
      }
    },
    getRegion: function () {
      return 1;
    },
    getCurrentRegionFields: function () {
      var result = [
        { field: "lq", value: this.quartiles[0] },
        { field: "med", value: this.quartiles[1] },
        { field: "uq", value: this.quartiles[2] },
      ];
      if (this.loutlier !== undefined) {
        result.push({ field: "lo", value: this.loutlier });
      }
      if (this.routlier !== undefined) {
        result.push({ field: "ro", value: this.routlier });
      }
      if (this.lwhisker !== undefined) {
        result.push({ field: "lw", value: this.lwhisker });
      }
      if (this.rwhisker !== undefined) {
        result.push({ field: "rw", value: this.rwhisker });
      }
      return result;
    },
    render: function () {
      var target = this.target,
        values = this.values,
        vlen = values.length,
        options = this.options,
        canvasWidth = this.canvasWidth,
        canvasHeight = this.canvasHeight,
        minValue =
          options.get("chartRangeMin") === undefined
            ? Math.min.apply(Math, values)
            : options.get("chartRangeMin"),
        maxValue =
          options.get("chartRangeMax") === undefined
            ? Math.max.apply(Math, values)
            : options.get("chartRangeMax"),
        canvasLeft = 0,
        lwhisker,
        loutlier,
        iqr,
        q1,
        q2,
        q3,
        rwhisker,
        routlier,
        i,
        size,
        unitSize;
      if (!box._super.render.call(this)) {
        return;
      }
      if (options.get("raw")) {
        if (options.get("showOutliers") && values.length > 5) {
          loutlier = values[0];
          lwhisker = values[1];
          q1 = values[2];
          q2 = values[3];
          q3 = values[4];
          rwhisker = values[5];
          routlier = values[6];
        } else {
          lwhisker = values[0];
          q1 = values[1];
          q2 = values[2];
          q3 = values[3];
          rwhisker = values[4];
        }
      } else {
        values.sort(function (a, b) {
          return a - b;
        });
        q1 = quartile(values, 1);
        q2 = quartile(values, 2);
        q3 = quartile(values, 3);
        iqr = q3 - q1;
        if (options.get("showOutliers")) {
          lwhisker = rwhisker = undefined;
          for (i = 0; i < vlen; i++) {
            if (
              lwhisker === undefined &&
              values[i] > q1 - iqr * options.get("outlierIQR")
            ) {
              lwhisker = values[i];
            }
            if (values[i] < q3 + iqr * options.get("outlierIQR")) {
              rwhisker = values[i];
            }
          }
          loutlier = values[0];
          routlier = values[vlen - 1];
        } else {
          lwhisker = values[0];
          rwhisker = values[vlen - 1];
        }
      }
      this.quartiles = [q1, q2, q3];
      this.lwhisker = lwhisker;
      this.rwhisker = rwhisker;
      this.loutlier = loutlier;
      this.routlier = routlier;

      unitSize = canvasWidth / (maxValue - minValue + 1);
      if (options.get("showOutliers")) {
        canvasLeft = Math.ceil(options.get("spotRadius"));
        canvasWidth -= 2 * Math.ceil(options.get("spotRadius"));
        unitSize = canvasWidth / (maxValue - minValue + 1);
        if (loutlier < lwhisker) {
          target
            .drawCircle(
              (loutlier - minValue) * unitSize + canvasLeft,
              canvasHeight / 2,
              options.get("spotRadius"),
              options.get("outlierLineColor"),
              options.get("outlierFillColor")
            )
            .append();
        }
        if (routlier > rwhisker) {
          target
            .drawCircle(
              (routlier - minValue) * unitSize + canvasLeft,
              canvasHeight / 2,
              options.get("spotRadius"),
              options.get("outlierLineColor"),
              options.get("outlierFillColor")
            )
            .append();
        }
      }

      // box
      target
        .drawRect(
          Math.round((q1 - minValue) * unitSize + canvasLeft),
          Math.round(canvasHeight * 0.1),
          Math.round((q3 - q1) * unitSize),
          Math.round(canvasHeight * 0.8),
          options.get("boxLineColor"),
          options.get("boxFillColor")
        )
        .append();
      // left whisker
      target
        .drawLine(
          Math.round((lwhisker - minValue) * unitSize + canvasLeft),
          Math.round(canvasHeight / 2),
          Math.round((q1 - minValue) * unitSize + canvasLeft),
          Math.round(canvasHeight / 2),
          options.get("lineColor")
        )
        .append();
      target
        .drawLine(
          Math.round((lwhisker - minValue) * unitSize + canvasLeft),
          Math.round(canvasHeight / 4),
          Math.round((lwhisker - minValue) * unitSize + canvasLeft),
          Math.round(canvasHeight - canvasHeight / 4),
          options.get("whiskerColor")
        )
        .append();
      // right whisker
      target
        .drawLine(
          Math.round((rwhisker - minValue) * unitSize + canvasLeft),
          Math.round(canvasHeight / 2),
          Math.round((q3 - minValue) * unitSize + canvasLeft),
          Math.round(canvasHeight / 2),
          options.get("lineColor")
        )
        .append();
      target
        .drawLine(
          Math.round((rwhisker - minValue) * unitSize + canvasLeft),
          Math.round(canvasHeight / 4),
          Math.round((rwhisker - minValue) * unitSize + canvasLeft),
          Math.round(canvasHeight - canvasHeight / 4),
          options.get("whiskerColor")
        )
        .append();
      // median line
      target
        .drawLine(
          Math.round((q2 - minValue) * unitSize + canvasLeft),
          Math.round(canvasHeight * 0.1),
          Math.round((q2 - minValue) * unitSize + canvasLeft),
          Math.round(canvasHeight * 0.9),
          options.get("medianColor")
        )
        .append();
      if (options.get("target")) {
        size = Math.ceil(options.get("spotRadius"));
        target
          .drawLine(
            Math.round(
              (options.get("target") - minValue) * unitSize + canvasLeft
            ),
            Math.round(canvasHeight / 2 - size),
            Math.round(
              (options.get("target") - minValue) * unitSize + canvasLeft
            ),
            Math.round(canvasHeight / 2 + size),
            options.get("targetColor")
          )
          .append();
        target
          .drawLine(
            Math.round(
              (options.get("target") - minValue) * unitSize + canvasLeft - size
            ),
            Math.round(canvasHeight / 2),
            Math.round(
              (options.get("target") - minValue) * unitSize + canvasLeft + size
            ),
            Math.round(canvasHeight / 2),
            options.get("targetColor")
          )
          .append();
      }
      target.render();
    },
  });

  // Setup a very simple "virtual canvas" to make drawing the few shapes we need easier
  VShape = createClass({
    init: function (target, id, type, args) {
      this.target = target;
      this.id = id;
      this.type = type;
      this.args = args;
    },
    append: function () {
      this.target.appendShape(this);
      return this;
    },
  });

  VCanvas_base = createClass({
    _pxregex: /(\d+)(px)?\s*$/i,

    init: function (width, height, target) {
      if (!width) {
        return;
      }
      this.width = width;
      this.height = height;
      this.target = target;
      this.lastShapeId = null;
      if (target[0]) {
        target = target[0];
      }
      utils.data(target, "_jqs_vcanvas", this);
    },

    drawLine: function (x1, y1, x2, y2, lineColor, lineWidth) {
      return this.drawShape(
        [
          [x1, y1],
          [x2, y2],
        ],
        lineColor,
        lineWidth
      );
    },

    drawShape: function (path, lineColor, fillColor, lineWidth) {
      return this._genShape("Shape", [path, lineColor, fillColor, lineWidth]);
    },

    drawCircle: function (x, y, radius, lineColor, fillColor, lineWidth) {
      return this._genShape("Circle", [
        x,
        y,
        radius,
        lineColor,
        fillColor,
        lineWidth,
      ]);
    },

    drawPieSlice: function (
      x,
      y,
      radius,
      startAngle,
      endAngle,
      lineColor,
      fillColor
    ) {
      return this._genShape("PieSlice", [
        x,
        y,
        radius,
        startAngle,
        endAngle,
        lineColor,
        fillColor,
      ]);
    },

    drawRect: function (x, y, width, height, lineColor, fillColor) {
      return this._genShape("Rect", [
        x,
        y,
        width,
        height,
        lineColor,
        fillColor,
      ]);
    },

    getElement: function () {
      return this.canvas;
    },

    getLastShapeId: function () {
      return this.lastShapeId;
    },

    reset: function () {
      alert("reset not implemented");
    },

    _insert: function (el, target) {
      // Clear the target element and append the canvas element directly
      target.innerHTML = "";
      target.appendChild(el);
    },

    _calculatePixelDims: function (width, height, canvas) {
      var match;
      match = this._pxregex.exec(height);
      if (match) {
        this.pixelHeight = match[1];
      } else {
        // If height is a number, use it directly; otherwise use canvas height
        if (typeof height === "number") {
          this.pixelHeight = height;
        } else {
          var canvasHeight = utils.height(canvas);
          // If canvas height is 0 (not yet rendered), parse the height from the style
          if (canvasHeight === 0) {
            var heightMatch = height.toString().match(/(\d+)/);
            this.pixelHeight = heightMatch ? parseInt(heightMatch[1]) : 150;
          } else {
            this.pixelHeight = canvasHeight;
          }
        }
      }
      match = this._pxregex.exec(width);
      if (match) {
        this.pixelWidth = match[1];
      } else {
        // If width is a number, use it directly; otherwise use canvas width
        if (typeof width === "number") {
          this.pixelWidth = width;
        } else {
          var canvasWidth = utils.width(canvas);
          // If canvas width is 0 (not yet rendered), parse the width from the style
          if (canvasWidth === 0) {
            var widthMatch = width.toString().match(/(\d+)/);
            this.pixelWidth = widthMatch ? parseInt(widthMatch[1]) : 300;
          } else {
            this.pixelWidth = canvasWidth;
          }
        }
      }
    },

    _genShape: function (shapetype, shapeargs) {
      var id = shapeCount++;
      shapeargs.unshift(id);
      return new VShape(this, id, shapetype, shapeargs);
    },

    appendShape: function (shape) {
      alert("appendShape not implemented");
    },

    replaceWithShape: function (shapeid, shape) {
      alert("replaceWithShape not implemented");
    },

    insertAfterShape: function (shapeid, shape) {
      alert("insertAfterShape not implemented");
    },

    removeShapeId: function (shapeid) {
      alert("removeShapeId not implemented");
    },

    getShapeAt: function (el, x, y) {
      alert("getShapeAt not implemented");
    },

    render: function () {
      alert("render not implemented");
    },
  });

  VCanvas_canvas = createClass(VCanvas_base, {
    init: function (width, height, target, interact) {
      VCanvas_canvas._super.init.call(this, width, height, target);
      this.canvas = document.createElement("canvas");
      if (target[0]) {
        target = target[0];
      }
      utils.data(target, "_jqs_vcanvas", this);
      utils.css(this.canvas, {
        display: "inline-block",
        width: width,
        height: height,
        verticalAlign: "top",
      });
      this._insert(this.canvas, target);
      this._calculatePixelDims(width, height, this.canvas);
      this.canvas.width = this.pixelWidth;
      this.canvas.height = this.pixelHeight;
      this.interact = interact;
      this.shapes = {};
      this.shapeseq = [];
      this.currentTargetShapeId = undefined;
      utils.css(this.canvas, {
        width: this.pixelWidth,
        height: this.pixelHeight,
      });
    },

    _getContext: function (lineColor, fillColor, lineWidth) {
      var context = this.canvas.getContext("2d");
      if (lineColor !== undefined) {
        context.strokeStyle = lineColor;
      }
      context.lineWidth = lineWidth === undefined ? 1 : lineWidth;
      if (fillColor !== undefined) {
        context.fillStyle = fillColor;
      }
      return context;
    },

    reset: function () {
      var context = this._getContext();
      context.clearRect(0, 0, this.pixelWidth, this.pixelHeight);
      this.shapes = {};
      this.shapeseq = [];
      this.currentTargetShapeId = undefined;
    },

    _drawShape: function (shapeid, path, lineColor, fillColor, lineWidth) {
      var context = this._getContext(lineColor, fillColor, lineWidth),
        i,
        plen;
      context.beginPath();
      context.moveTo(path[0][0] + 0.5, path[0][1] + 0.5);
      for (i = 1, plen = path.length; i < plen; i++) {
        context.lineTo(path[i][0] + 0.5, path[i][1] + 0.5);
      }
      if (lineColor !== undefined) {
        context.stroke();
      }
      if (fillColor !== undefined) {
        context.fill();
      }
      if (
        this.targetX !== undefined &&
        this.targetY !== undefined &&
        context.isPointInPath(this.targetX, this.targetY)
      ) {
        this.currentTargetShapeId = shapeid;
      }
    },

    _drawCircle: function (
      shapeid,
      x,
      y,
      radius,
      lineColor,
      fillColor,
      lineWidth
    ) {
      if (radius <= 0) return; // Skip drawing if radius is invalid
      var context = this._getContext(lineColor, fillColor, lineWidth);
      context.beginPath();
      context.arc(x, y, radius, 0, 2 * Math.PI, false);
      if (
        this.targetX !== undefined &&
        this.targetY !== undefined &&
        context.isPointInPath(this.targetX, this.targetY)
      ) {
        this.currentTargetShapeId = shapeid;
      }
      if (lineColor !== undefined) {
        context.stroke();
      }
      if (fillColor !== undefined) {
        context.fill();
      }
    },

    _drawPieSlice: function (
      shapeid,
      x,
      y,
      radius,
      startAngle,
      endAngle,
      lineColor,
      fillColor
    ) {
      var context = this._getContext(lineColor, fillColor);
      context.beginPath();
      context.moveTo(x, y);
      context.arc(x, y, radius, startAngle, endAngle, false);
      context.lineTo(x, y);
      context.closePath();
      if (lineColor !== undefined) {
        context.stroke();
      }
      if (fillColor) {
        context.fill();
      }
      if (
        this.targetX !== undefined &&
        this.targetY !== undefined &&
        context.isPointInPath(this.targetX, this.targetY)
      ) {
        this.currentTargetShapeId = shapeid;
      }
    },

    _drawRect: function (shapeid, x, y, width, height, lineColor, fillColor) {
      return this._drawShape(
        shapeid,
        [
          [x, y],
          [x + width, y],
          [x + width, y + height],
          [x, y + height],
          [x, y],
        ],
        lineColor,
        fillColor
      );
    },

    appendShape: function (shape) {
      this.shapes[shape.id] = shape;
      this.shapeseq.push(shape.id);
      this.lastShapeId = shape.id;
      return shape.id;
    },

    replaceWithShape: function (shapeid, shape) {
      var shapeseq = this.shapeseq,
        i;
      this.shapes[shape.id] = shape;
      for (i = shapeseq.length; i--; ) {
        if (shapeseq[i] == shapeid) {
          shapeseq[i] = shape.id;
        }
      }
      delete this.shapes[shapeid];
    },

    replaceWithShapes: function (shapeids, shapes) {
      var shapeseq = this.shapeseq,
        shapemap = {},
        sid,
        i,
        first;
      for (i = shapeids.length; i--; ) {
        shapemap[shapeids[i]] = true;
      }
      for (i = shapeseq.length; i--; ) {
        sid = shapeseq[i];
        if (shapemap[sid]) {
          shapeseq.splice(i, 1);
          delete this.shapes[sid];
          first = i;
        }
      }
      for (i = shapes.length; i--; ) {
        shapeseq.splice(first, 0, shapes[i].id);
        this.shapes[shapes[i].id] = shapes[i];
      }
    },

    insertAfterShape: function (shapeid, shape) {
      var shapeseq = this.shapeseq,
        i;
      for (i = shapeseq.length; i--; ) {
        if (shapeseq[i] === shapeid) {
          shapeseq.splice(i + 1, 0, shape.id);
          this.shapes[shape.id] = shape;
          return;
        }
      }
    },

    removeShapeId: function (shapeid) {
      var shapeseq = this.shapeseq,
        i;
      for (i = shapeseq.length; i--; ) {
        if (shapeseq[i] === shapeid) {
          shapeseq.splice(i, 1);
          break;
        }
      }
      delete this.shapes[shapeid];
    },

    getShapeAt: function (el, x, y) {
      this.targetX = x;
      this.targetY = y;
      this.render();
      return this.currentTargetShapeId;
    },

    render: function () {
      var shapeseq = this.shapeseq,
        shapes = this.shapes,
        shapeCount = shapeseq.length,
        context = this._getContext(),
        shapeid,
        shape,
        i;
      context.clearRect(0, 0, this.pixelWidth, this.pixelHeight);
      for (i = 0; i < shapeCount; i++) {
        shapeid = shapeseq[i];
        shape = shapes[shapeid];
        this["_draw" + shape.type].apply(this, shape.args);
      }
      if (!this.interact) {
        this.shapes = {};
        this.shapeseq = [];
      }
    },
  });

  VCanvas_vml = createClass(VCanvas_base, {
    init: function (width, height, target) {
      var groupel;
      VCanvas_vml._super.init.call(this, width, height, target);
      if (target[0]) {
        target = target[0];
      }
      utils.data(target, "_jqs_vcanvas", this);
      this.canvas = document.createElement("span");
      utils.css(this.canvas, {
        display: "inline-block",
        position: "relative",
        overflow: "hidden",
        width: width,
        height: height,
        margin: "0px",
        padding: "0px",
        verticalAlign: "top",
      });
      this._insert(this.canvas, target);
      this._calculatePixelDims(width, height, this.canvas);
      this.canvas.width = this.pixelWidth;
      this.canvas.height = this.pixelHeight;
      groupel =
        '<v:group coordorigin="0 0" coordsize="' +
        this.pixelWidth +
        " " +
        this.pixelHeight +
        '"' +
        ' style="position:absolute;top:0;left:0;width:' +
        this.pixelWidth +
        "px;height=" +
        this.pixelHeight +
        'px;"></v:group>';
      this.canvas.insertAdjacentHTML("beforeEnd", groupel);
      this.group = this.canvas.children[0];
      this.rendered = false;
      this.prerender = "";
    },

    reset: function () {
      this.group.innerHTML = "";
    },

    appendShape: function (shape) {
      var vel = this["_draw" + shape.type].apply(this, shape.args);
      if (this.rendered) {
        this.group.insertAdjacentHTML("beforeEnd", vel);
      } else {
        this.prerender += vel;
      }
      this.lastShapeId = shape.id;
      return shape.id;
    },

    replaceWithShape: function (shapeid, shape) {
      var existing = document.getElementById("jqsshape" + shapeid),
        vel = this["_draw" + shape.type].apply(this, shape.args);
      existing.outerHTML = vel;
    },

    replaceWithShapes: function (shapeids, shapes) {
      var existing = document.getElementById("jqsshape" + shapeids[0]),
        replace = "",
        slen = shapes.length,
        i;
      for (i = 0; i < slen; i++) {
        replace += this["_draw" + shapes[i].type].apply(this, shapes[i].args);
      }
      existing.outerHTML = replace;
      for (i = 1; i < shapeids.length; i++) {
        var el = document.getElementById("jqsshape" + shapeids[i]);
        if (el) el.remove();
      }
    },

    insertAfterShape: function (shapeid, shape) {
      var existing = document.getElementById("jqsshape" + shapeid),
        vel = this["_draw" + shape.type].apply(this, shape.args);
      existing.insertAdjacentHTML("afterEnd", vel);
    },

    removeShapeId: function (shapeid) {
      var existing = document.getElementById("jqsshape" + shapeid);
      if (existing) {
        this.group.removeChild(existing);
      }
    },

    getShapeAt: function (el, x, y) {
      var shapeid = el.id.substr(8);
      return shapeid;
    },

    render: function () {
      if (!this.rendered) {
        this.group.innerHTML = this.prerender;
        this.rendered = true;
      }
    },

    // VML drawing methods (simplified implementations)
    _drawShape: function (shapeid, path, lineColor, fillColor, lineWidth) {
      var vpath = [],
        initial,
        stroke,
        fill,
        closed,
        vel,
        plen,
        i;
      for (i = 0, plen = path.length; i < plen; i++) {
        vpath[i] = "" + path[i][0] + "," + path[i][1];
      }
      initial = vpath.splice(0, 1);
      lineWidth = lineWidth === undefined ? 1 : lineWidth;
      stroke =
        lineColor === undefined
          ? ' stroked="false" '
          : ' strokeWeight="' +
            lineWidth +
            'px" strokeColor="' +
            lineColor +
            '" ';
      fill =
        fillColor === undefined
          ? ' filled="false"'
          : ' fillColor="' + fillColor + '" filled="true" ';
      closed = vpath[0] === vpath[vpath.length - 1] ? "x " : "";
      vel =
        '<v:shape coordorigin="0 0" coordsize="' +
        this.pixelWidth +
        " " +
        this.pixelHeight +
        '" ' +
        ' id="jqsshape' +
        shapeid +
        '" ' +
        stroke +
        fill +
        ' style="position:absolute;left:0px;top:0px;height:' +
        this.pixelHeight +
        "px;width:" +
        this.pixelWidth +
        'px;padding:0px;margin:0px;" ' +
        ' path="m ' +
        initial +
        " l " +
        vpath.join(", ") +
        " " +
        closed +
        'e">' +
        " </v:shape>";
      return vel;
    },

    _drawCircle: function (
      shapeid,
      x,
      y,
      radius,
      lineColor,
      fillColor,
      lineWidth
    ) {
      var stroke, fill, vel;
      x -= radius;
      y -= radius;
      stroke =
        lineColor === undefined
          ? ' stroked="false" '
          : ' strokeWeight="' +
            lineWidth +
            'px" strokeColor="' +
            lineColor +
            '" ';
      fill =
        fillColor === undefined
          ? ' filled="false"'
          : ' fillColor="' + fillColor + '" filled="true" ';
      vel =
        "<v:oval " +
        ' id="jqsshape' +
        shapeid +
        '" ' +
        stroke +
        fill +
        ' style="position:absolute;top:' +
        y +
        "px; left:" +
        x +
        "px; width:" +
        radius * 2 +
        "px; height:" +
        radius * 2 +
        'px"></v:oval>';
      return vel;
    },

    _drawPieSlice: function (
      shapeid,
      x,
      y,
      radius,
      startAngle,
      endAngle,
      lineColor,
      fillColor
    ) {
      var vpath, startx, starty, endx, endy, stroke, fill, vel;
      if (startAngle === endAngle) {
        return "";
      }
      if (endAngle - startAngle === 2 * Math.PI) {
        startAngle = 0.0;
        endAngle = 2 * Math.PI;
      }
      startx = x + Math.round(Math.cos(startAngle) * radius);
      starty = y + Math.round(Math.sin(startAngle) * radius);
      endx = x + Math.round(Math.cos(endAngle) * radius);
      endy = y + Math.round(Math.sin(endAngle) * radius);
      if (startx === endx && starty === endy) {
        if (endAngle - startAngle < Math.PI) {
          return "";
        }
        startx = endx = x + radius;
        starty = endy = y;
      }
      if (
        startx === endx &&
        starty === endy &&
        endAngle - startAngle < Math.PI
      ) {
        return "";
      }
      vpath = [
        x - radius,
        y - radius,
        x + radius,
        y + radius,
        startx,
        starty,
        endx,
        endy,
      ];
      stroke =
        lineColor === undefined
          ? ' stroked="false" '
          : ' strokeWeight="1px" strokeColor="' + lineColor + '" ';
      fill =
        fillColor === undefined
          ? ' filled="false"'
          : ' fillColor="' + fillColor + '" filled="true" ';
      vel =
        '<v:shape coordorigin="0 0" coordsize="' +
        this.pixelWidth +
        " " +
        this.pixelHeight +
        '" ' +
        ' id="jqsshape' +
        shapeid +
        '" ' +
        stroke +
        fill +
        ' style="position:absolute;left:0px;top:0px;height:' +
        this.pixelHeight +
        "px;width:" +
        this.pixelWidth +
        'px;padding:0px;margin:0px;" ' +
        ' path="m ' +
        x +
        "," +
        y +
        " wa " +
        vpath.join(", ") +
        ' x e">' +
        " </v:shape>";
      return vel;
    },

    _drawRect: function (shapeid, x, y, width, height, lineColor, fillColor) {
      return this._drawShape(
        shapeid,
        [
          [x, y],
          [x, y + height],
          [x + width, y + height],
          [x + width, y],
          [x, y],
        ],
        lineColor,
        fillColor
      );
    },
  });

  // Export sparklines function
  window.sparklines = sparklines;
})(document, Math);
