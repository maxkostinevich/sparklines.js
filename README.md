![sparklines.js](https://github.com/user-attachments/assets/a30be04c-2983-4d32-adab-565b2d911a31)

# Sparklines.js

A lightweight, pure vanilla JavaScript library for creating beautiful sparkline charts. No jQuery dependency required!

---

## Features

- ✅ **No jQuery dependency** - Pure vanilla JavaScript
- ✅ **7 Chart Types**: Line, Bar, Tristate, Discrete, Bullet, Pie, Box
- ✅ **Interactive tooltips** and hover effects
- ✅ **Canvas and VML rendering** support for cross-browser compatibility
- ✅ **Composite charts** - multiple sparklines layered together
- ✅ **Flexible data sources** - arrays, HTML content, attributes, and comments
- ✅ **Customizable styling** - colors, sizes, formatting
- ✅ **Range maps** and value lookups
- ✅ **Custom events** - sparklineClick, sparklineRegionChange
- ✅ **Web Components** - declarative custom elements for all chart types (`<spark-line>`, `<spark-bar>`, etc.)
- ✅ **Performance optimized** - handles large datasets efficiently

## Installation

Include the sparklines library in your HTML:

```html
<script src="sparklines.js"></script>
```

## Basic Usage

```javascript
// Basic line chart
sparklines("#element", [1, 2, 3, 4, 5], { width: "80px", height: "30px" });

// Bar chart
sparklines("#element", [1, 2, 3, 4, 5], {
  type: "bar",
  barColor: "#3366cc",
  width: "80px",
  height: "30px",
});

// Multiple elements
sparklines(".sparkline", [1, 2, 3, 4, 5], { width: "80px", height: "30px" });

// Read data from HTML content
sparklines(".sparkline", null, { width: "80px", height: "30px" });
```

## Web Components

All chart types are available as custom elements. Include the same script and use declarative HTML. Options are set via kebab-case attributes.

| Chart Type | Custom Element     |
| ---------- | ------------------ |
| Line       | `<spark-line>`     |
| Bar        | `<spark-bar>`      |
| Tristate   | `<spark-tristate>` |
| Discrete   | `<spark-discrete>` |
| Bullet     | `<spark-bullet>`   |
| Pie        | `<spark-pie>`      |
| Box        | `<spark-box>`      |

**Declarative usage:**

```html
<!-- Line chart -->
<spark-line values="1,4,6,6,8,5,3,5" width="80" height="30" line-color="#00f"></spark-line>

<!-- Bar chart -->
<spark-bar values="3,5,2,8,1" width="80" height="30" bar-color="#3366cc" bar-width="6" bar-spacing="2"></spark-bar>

<!-- Pie chart -->
<spark-pie values="30,20,50" width="60" height="60" slice-colors="#f00,#0f0,#00f" border-width="1"></spark-pie>
```

**Programmatic usage:**

```html
<spark-line id="mychart" width="160" height="40"></spark-line>
<script>
  var el = document.getElementById("mychart");
  el.values = [1, 4, 6, 6, 8, 5, 3, 5];
  el.options = { spotRadius: 3, lineWidth: 2 };
</script>
```

- **`values`** – Comma-separated numbers or set via the `values` property (array or string).
- **`options`** – Set via the `options` property for complex options; attributes override for simple options.
- Attribute names use **kebab-case** and map to option keys (e.g. `line-color` → `lineColor`, `spot-radius` → `spotRadius`).
- Re-renders when attributes or the `values`/`options` properties change.

Programmatic access to the element classes: `sparklines.SparklineElement`, `sparklines.elements.line`, `sparklines.elements.bar`, etc.

## Chart Types

### 1. Line Charts

Line charts display data as connected points with optional fill areas, spots, and normal ranges.

```javascript
// Basic line chart
sparklines("#line1", [1, 4, 6, 6, 8, 5, 3, 5], {
  width: "80px",
  height: "30px",
});

// Filled line chart with spots
sparklines("#line2", [2, 4, 3, 1, 5, 4, 6, 8], {
  fillColor: "#cdf",
  lineColor: "#00f",
  spotColor: "#f80",
  spotRadius: 3,
  lineWidth: 2,
  width: "80px",
  height: "30px",
});

// Line chart with normal range
sparklines("#line3", [3, 7, 2, 9, 1, 4, 6, 8, 2, 5], {
  normalRangeMin: 2,
  normalRangeMax: 7,
  normalRangeColor: "#ccc",
  fillColor: "#e8f4fd",
  width: "80px",
  height: "30px",
});
```

**Line Chart Options:**

- `lineColor` - Color of the line (default: "#00f")
- `fillColor` - Color of the filled area (default: "#cdf")
- `spotColor` - Color of data point spots (default: "#f80")
- `highlightSpotColor` - Color when hovering over spots (default: "#5f5")
- `highlightLineColor` - Color when hovering over line (default: "#f22")
- `spotRadius` - Radius of data point spots (default: 1.5)
- `minSpotColor` - Color for minimum value spot (default: "#f80")
- `maxSpotColor` - Color for maximum value spot (default: "#f80")
- `lineWidth` - Width of the line (default: 1)
- `normalRangeMin` - Minimum value for normal range
- `normalRangeMax` - Maximum value for normal range
- `normalRangeColor` - Color of normal range area (default: "#ccc")
- `drawNormalOnTop` - Draw normal range on top of line (default: false)

### 2. Bar Charts

Bar charts display data as vertical bars, supporting positive/negative values, stacking, and custom colors.

```javascript
// Basic bar chart
sparklines("#bar1", [3, 6, 2, 8, 4, 7, 1, 9], {
  type: "bar",
  barColor: "#3366cc",
  barWidth: 6,
  barSpacing: 2,
  width: "80px",
  height: "30px",
});

// Bar chart with negative values
sparklines("#bar2", [5, -2, 3, -1, 4, -3, 2, -4], {
  type: "bar",
  barColor: "#3366cc",
  negBarColor: "#f44",
  zeroAxis: true,
  width: "80px",
  height: "30px",
});

// Stacked bar chart
sparklines("#bar3", ["2:3:1", "1:2:2", "3:1:1", "2:2:3"], {
  type: "bar",
  stackedBarColor: ["#3366cc", "#dc3912", "#ff9900"],
  width: "80px",
  height: "30px",
});
```

**Bar Chart Options:**

- `barColor` - Color of positive bars (default: "#3366cc")
- `negBarColor` - Color of negative bars (default: "#f44")
- `stackedBarColor` - Array of colors for stacked bars
- `zeroColor` - Color for zero values
- `nullColor` - Color for null values
- `zeroAxis` - Show zero axis line (default: true)
- `barWidth` - Width of bars (default: 4)
- `barSpacing` - Spacing between bars (default: 1)
- `colorMap` - Custom color mapping function

### 3. Tristate Charts

Tristate charts display win/loss/draw data with different colors for positive, negative, and zero values.

```javascript
sparklines("#tristate1", [1, 1, -1, 1, 0, 0, -1, 1, -1, 0], {
  type: "tristate",
  posBarColor: "#6f6",
  negBarColor: "#f44",
  zeroBarColor: "#999",
  width: "80px",
  height: "30px",
});
```

**Tristate Chart Options:**

- `posBarColor` - Color for positive values (default: "#6f6")
- `negBarColor` - Color for negative values (default: "#f44")
- `zeroBarColor` - Color for zero values (default: "#999")
- `barWidth` - Width of bars (default: 4)
- `barSpacing` - Spacing between bars (default: 1)
- `colorMap` - Custom color mapping

### 4. Discrete Charts

Discrete charts display data as vertical lines of varying heights, useful for showing discrete values.

```javascript
sparklines("#discrete1", [1, 3, 4, 5, 5, 3, 4, 5, 2, 6], {
  type: "discrete",
  lineColor: "#00f",
  thresholdColor: "#f44",
  thresholdValue: 3,
  width: "80px",
  height: "30px",
});
```

**Discrete Chart Options:**

- `lineColor` - Color of the lines (default: "#00f")
- `lineHeight` - Height of lines (default: "auto")
- `thresholdColor` - Color for threshold line
- `thresholdValue` - Value for threshold line (default: 0)

### 5. Bullet Charts

Bullet charts display performance against targets with qualitative ranges. Data format: `[target, performance, range1, range2, range3]`.

```javascript
sparklines("#bullet1", [10, 12, 12, 9, 7], {
  type: "bullet",
  targetColor: "#f33",
  performanceColor: "#33f",
  rangeColors: ["#d3dafe", "#a8b6ff", "#7f94ff"],
  width: "80px",
  height: "30px",
});
```

**Bullet Chart Options:**

- `targetColor` - Color of target bar (default: "#f33")
- `targetWidth` - Width of target bar in pixels (default: 3)
- `performanceColor` - Color of performance bar (default: "#33f")
- `rangeColors` - Array of colors for ranges
- `base` - Base start number for ranges

### 6. Pie Charts

Pie charts display data as slices of a circle, showing proportions of a whole.

```javascript
sparklines("#pie1", [3, 2, 4, 1], {
  type: "pie",
  sliceColors: ["#3366cc", "#dc3912", "#ff9900", "#109618"],
  borderWidth: 2,
  borderColor: "#000",
  width: "30px",
  height: "30px",
});
```

**Pie Chart Options:**

- `sliceColors` - Array of colors for slices
- `offset` - Rotation offset in degrees (default: 0)
- `borderWidth` - Width of slice borders (default: 0)
- `borderColor` - Color of slice borders (default: "#000")

### 7. Box Charts

Box charts display statistical data showing quartiles, median, outliers, and whiskers.

```javascript
sparklines(
  "#box1",
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
  {
    type: "box",
    boxLineColor: "#000",
    boxFillColor: "#cdf",
    whiskerColor: "#000",
    outlierLineColor: "#333",
    outlierFillColor: "#fff",
    medianColor: "#f00",
    width: "80px",
    height: "30px",
  }
);
```

**Box Chart Options:**

- `boxLineColor` - Color of box outline (default: "#000")
- `boxFillColor` - Color of box fill (default: "#cdf")
- `whiskerColor` - Color of whiskers (default: "#000")
- `outlierLineColor` - Color of outlier outlines (default: "#333")
- `outlierFillColor` - Color of outlier fills (default: "#fff")
- `medianColor` - Color of median line (default: "#f00")
- `showOutliers` - Show outliers (default: true)
- `outlierIQR` - IQR multiplier for outlier detection (default: 1.5)
- `spotRadius` - Radius of outlier spots (default: 1.5)
- `target` - Target value to highlight
- `targetColor` - Color of target line (default: "#4a2")

## Common Options

These options apply to all chart types:

### Size and Layout

- `width` - Chart width (default: "auto")
- `height` - Chart height (default: "auto")
- `defaultPixelsPerValue` - Pixels per data value (default: 3)

### Interaction

- `enableHighlight` - Enable hover highlighting (default: true)
- `highlightLighten` - Lighten factor for highlights (default: 1.4)
- `disableInteraction` - Disable all interactions (default: false)

### Tooltips

- `disableTooltips` - Disable tooltips (default: false)
- `tooltipSkipNull` - Skip null values in tooltips (default: true)
- `tooltipPrefix` - Prefix for tooltip text (default: "")
- `tooltipSuffix` - Suffix for tooltip text (default: "")
- `tooltipChartTitle` - Title for tooltip
- `tooltipClassname` - CSS class for tooltip (default: "jqstooltip")

### Data Handling

- `composite` - Enable composite mode (default: false)
- `tagValuesAttribute` - HTML attribute for data values (default: "values")
- `tagOptionsPrefix` - Prefix for HTML tag options (default: "spark")
- `enableTagOptions` - Enable HTML tag options (default: false)
- `disableHiddenCheck` - Disable hidden element check (default: false)

### Number Formatting

- `numberFormatter` - Custom number formatter function (default: false)
- `numberDigitGroupCount` - Digits per group (default: 3)
- `numberDigitGroupSep` - Group separator (default: ",")
- `numberDecimalMark` - Decimal mark (default: ".")

### Range Control

- `chartRangeMin` - Minimum chart range
- `chartRangeMax` - Maximum chart range
- `chartRangeMinX` - Minimum X-axis range
- `chartRangeMaxX` - Maximum X-axis range
- `chartRangeClip` - Clip values to range (default: false)
- `chartRangeClipX` - Clip X values to range (default: false)

## Data Sources

Sparklines can read data from multiple sources:

### 1. JavaScript Arrays

```javascript
sparklines("#element", [1, 2, 3, 4, 5], options);
```

### 2. HTML Content

```html
<span class="sparkline">4,6,2,8,5,3,7,1</span>
```

```javascript
sparklines(".sparkline", null, options);
```

### 3. HTML Comments

```html
<span class="sparkline-comment"><!--2,5,8,3,6,9,1,4--></span>
```

```javascript
sparklines(".sparkline-comment", null, options);
```

### 4. HTML Attributes

```html
<span class="sparkline-attr" values="7,3,9,2,5,8,1,6"></span>
```

```javascript
sparklines(".sparkline-attr", null, options);
```

### 5. HTML Tag Options

```html
<span class="sparkline" sparkType="bar" sparkBarColor="red">1,2,3,4,5</span>
```

```javascript
sparklines(".sparkline", [1, 2, 3, 4, 5], { enableTagOptions: true });
```

## Interactive Features

### Tooltips

All charts support customizable tooltips:

```javascript
sparklines("#element", [5, 8, 3, 9, 2, 7, 4, 6, 8, 1], {
  tooltipChartTitle: "Sales Data",
  tooltipPrefix: "Value: ",
  tooltipSuffix: " units",
  spotColor: "#f80",
  spotRadius: 3,
  highlightSpotColor: "#5f5",
  highlightLineColor: "#f22",
  width: "80px",
  height: "30px",
});
```

### Events

Listen for chart interactions:

```javascript
// Click events
document
  .getElementById("element")
  .addEventListener("sparklineClick", function (e) {
    console.log("Chart clicked!", e.sparklines);
  });

// Region change events
document
  .getElementById("element")
  .addEventListener("sparklineRegionChange", function (e) {
    console.log("Region changed!", e.sparklines);
  });
```

## Advanced Usage

### Composite Charts

Layer multiple sparklines on the same element:

```javascript
sparklines("#composite", [1, 2, 3, 4, 5], {
  composite: true,
  fillColor: false,
  lineColor: "#ff0000",
  width: "80px",
  height: "30px",
});

sparklines("#composite", [2, 3, 4, 5, 6], {
  composite: true,
  fillColor: false,
  lineColor: "#0000ff",
  width: "80px",
  height: "30px",
});
```

### Range Maps

Use range maps for value lookups:

```javascript
sparklines("#element", [1, 2, 3, 4, 5], {
  type: "tristate",
  tooltipValueLookups: {
    map: { "-1": "Loss", 0: "Draw", 1: "Win" },
  },
});
```

### Custom Number Formatting

```javascript
sparklines("#element", [1000, 2000, 3000], {
  numberFormatter: function (n) {
    return "$" + n.toLocaleString();
  },
});
```

## Credits

sparklines.js is a lightweight, dependency-free library for generating inline
charts directly in the browser. It is a derivative work based on the original
[jquery.sparkline.js v2.1.2](http://omnipotent.net/jquery.sparkline/) by Gareth
Watts (Splunk, Inc).

The original plugin was licensed under the New BSD License. This project has
been systematically converted to vanilla JavaScript with updated utilities,
APIs, and modern browser support, while preserving the rendering logic and
appearance of the original charts.

## License:

- This project: MIT License
- Original jquery.sparkline.js: BSD 3-Clause License (included in LICENSE)

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

---

(c) [maxico.dev](https://maxico.dev/) - All rights reserved
