/**
 * utils.js - Shared utility functions
 * Common utilities used across multiple pages (formatNumber, generateId, debounce, color functions, etc.)
 */
(function() {
'use strict';

// ========== STATUS/UI ==========
function showStatus(message, isSuccess = true) {
  const el = document.getElementById('statusMessage');
  if (!el) return;
  el.textContent = message;
  el.style.display = 'block';
  el.style.background = isSuccess ? '#dcfce7' : '#fee2e2';
  el.style.color = isSuccess ? '#166534' : '#991b1b';
  setTimeout(() => el.style.display = 'none', 4000);
}

// ========== FORMATTING ==========
function formatNumber(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) return '-';
  return Number(value).toFixed(decimals);
}

// Get decimal places for an attribute (checks user settings, then defaults)
function getDecimals(attr, defaultDecimals = {}) {
  // Check for user-customized settings first
  const customDecimals = JSON.parse(localStorage.getItem('decimalPlaces') || '{}');
  if (customDecimals[attr] !== undefined) {
    return customDecimals[attr];
  }
  // Fall back to provided defaults
  if (defaultDecimals[attr] !== undefined) {
    return defaultDecimals[attr];
  }
  // Default to 1 decimal for unknown attributes
  return 1;
}

// Format a value using the configured decimal places for an attribute
function formatValue(value, attr, defaultDecimals = {}) {
  if (value === null || value === undefined || isNaN(value)) return '-';
  const decimals = getDecimals(attr, defaultDecimals);
  return Number(value).toFixed(decimals);
}

// ========== COLOR UTILITIES ==========

// Interpolate between two hex colors
function interpolateColor(color1, color2, factor) {
  const hex = c => parseInt(c, 16);
  const r1 = hex(color1.slice(1,3)), g1 = hex(color1.slice(3,5)), b1 = hex(color1.slice(5,7));
  const r2 = hex(color2.slice(1,3)), g2 = hex(color2.slice(3,5)), b2 = hex(color2.slice(5,7));
  const r = Math.round(r1 + (r2 - r1) * factor);
  const g = Math.round(g1 + (g2 - g1) * factor);
  const b = Math.round(b1 + (b2 - b1) * factor);
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

// Get gradient color from red->yellow->green based on position (0-1)
function getGradientColor(position, isLowerBetter = false) {
  // Clamp position to 0-1
  const p = Math.max(0, Math.min(1, isLowerBetter ? 1 - position : position));
  // Color stops: red (#dc2626) -> orange (#f97316) -> yellow (#eab308) -> lime (#84cc16) -> green (#16a34a)
  const stops = [
    { pos: 0.0, color: '#dc2626' },  // red
    { pos: 0.25, color: '#f97316' }, // orange
    { pos: 0.5, color: '#eab308' },  // yellow
    { pos: 0.75, color: '#84cc16' }, // lime
    { pos: 1.0, color: '#16a34a' }   // green
  ];
  // Find the two stops to interpolate between
  for (let i = 0; i < stops.length - 1; i++) {
    if (p >= stops[i].pos && p <= stops[i+1].pos) {
      const range = stops[i+1].pos - stops[i].pos;
      const factor = (p - stops[i].pos) / range;
      return interpolateColor(stops[i].color, stops[i+1].color, factor);
    }
  }
  return stops[stops.length - 1].color;
}

// Get gradient color for change values (negative->neutral->positive)
function getChangeGradientColor(percentChange) {
  // Clamp to -30% to +30% range for color scaling
  const clampedPct = Math.max(-30, Math.min(30, percentChange));
  // Map to 0-1 where 0 = -30%, 0.5 = 0%, 1 = +30%
  const position = (clampedPct + 30) / 60;
  // Color stops: dark red -> light red -> gray -> light green -> dark green
  const stops = [
    { pos: 0.0, color: '#b91c1c' },  // dark red (-30%+)
    { pos: 0.25, color: '#f87171' }, // light red
    { pos: 0.45, color: '#d1d5db' }, // light gray
    { pos: 0.55, color: '#d1d5db' }, // light gray (neutral zone)
    { pos: 0.75, color: '#86efac' }, // light green
    { pos: 1.0, color: '#15803d' }   // dark green (+30%+)
  ];
  for (let i = 0; i < stops.length - 1; i++) {
    if (position >= stops[i].pos && position <= stops[i+1].pos) {
      const range = stops[i+1].pos - stops[i].pos;
      const factor = (position - stops[i].pos) / range;
      return interpolateColor(stops[i].color, stops[i+1].color, factor);
    }
  }
  return stops[stops.length - 1].color;
}

// Get median-based color using IQR to handle outliers
// isLowerBetter: if true, lower values get green, higher get red (for Mg_sat, H_Sat, etc.)
function getMedianBasedColor(value, values, isLowerBetter = false) {
  if (!values || values.length === 0) return '#94a3b8';
  const sorted = [...values].sort((a, b) => a - b);
  const len = sorted.length;

  // Calculate quartiles
  const q1 = sorted[Math.floor(len * 0.25)];
  const q3 = sorted[Math.floor(len * 0.75)];
  const iqr = q3 - q1;

  // Use IQR-based bounds (ignore outliers beyond 1.5*IQR)
  const lowerBound = Math.max(sorted[0], q1 - 1.5 * iqr);
  const upperBound = Math.min(sorted[len - 1], q3 + 1.5 * iqr);
  const range = upperBound - lowerBound;

  if (range === 0) return '#eab308'; // All same value = yellow

  // Clamp value to bounds for color calculation
  const clampedValue = Math.max(lowerBound, Math.min(upperBound, value));
  const position = (clampedValue - lowerBound) / range; // 0 to 1

  // Use smooth gradient
  return getGradientColor(position, isLowerBetter);
}

// Get color for year-over-year change
function getChangeColor(change, percentChange) {
  return getChangeGradientColor(percentChange);
}

// Get color for a value based on thresholds
// config: { LOWER_IS_BETTER: [...] }
function getColor(value, attribute, settings = {}, bufferPercent = 25, allValues = null, lowerIsBetterAttrs = []) {
  // Sample ID gets neutral blue color
  if (attribute === 'sampleId') return '#3b82f6';

  // CEC and micronutrients use median-based coloring if allValues provided
  const medianBasedAttrs = ['CEC', 'Zn', 'Cu', 'Mn', 'Fe', 'Boron', 'S'];
  if (medianBasedAttrs.includes(attribute) && allValues && allValues.length > 0) {
    return getMedianBasedColor(value, allValues);
  }

  // Default thresholds if none provided
  const defaultThresholds = {
    pH: { min: 6.3, max: 6.9 },
    P: { min: 20, max: null },
    K: { min: 150, max: null },
    OM: { min: 3.0, max: null },
    Ca_sat: { min: 65, max: 75 },
    Mg_sat: { min: null, max: 15 },
    K_Sat: { min: 3.0, max: null },
    H_Sat: { min: null, max: 5.0 }
  };

  const threshold = settings[attribute] || defaultThresholds[attribute];
  const isLowerBetter = lowerIsBetterAttrs.includes(attribute);

  if (!threshold) {
    return '#94a3b8';
  }

  // Calculate position for smooth gradient (0 = worst, 1 = best)
  if (threshold.min !== null && threshold.max !== null) {
    // Range threshold (pH, Ca_sat) - optimal is in the middle
    const buffer = (threshold.max - threshold.min) * (bufferPercent / 100);
    const lowerBound = threshold.min - buffer;
    const upperBound = threshold.max + buffer;

    if (value >= threshold.min && value <= threshold.max) {
      return '#16a34a'; // In optimal range = green
    } else if (value < threshold.min) {
      // Below optimal - calculate position from lowerBound to min
      const pos = Math.max(0, (value - lowerBound) / (threshold.min - lowerBound));
      return getGradientColor(pos * 0.5, false); // 0-0.5 range (red to yellow)
    } else {
      // Above optimal - calculate position from max to upperBound
      const pos = Math.max(0, 1 - (value - threshold.max) / (upperBound - threshold.max));
      return getGradientColor(pos * 0.5, false); // 0-0.5 range (red to yellow)
    }
  } else if (threshold.min !== null) {
    // Minimum threshold (P, K, OM, K_Sat) - higher is better
    const buffer = threshold.min * (bufferPercent / 100);
    const lowerBound = threshold.min - buffer;
    // Calculate position: 0 at lowerBound, 1 at min (optimal)
    if (value >= threshold.min) {
      // Above optimal - calculate gradient up to 2x min
      const pos = Math.min(1, 0.5 + (value - threshold.min) / (threshold.min * 2) * 0.5);
      return getGradientColor(pos, false);
    } else {
      // Below optimal
      const pos = Math.max(0, (value - lowerBound) / (threshold.min - lowerBound)) * 0.5;
      return getGradientColor(pos, false);
    }
  } else if (threshold.max !== null) {
    // Maximum threshold (Mg_sat, H_Sat) - lower is better
    const buffer = threshold.max * (bufferPercent / 100);
    const upperBound = threshold.max + buffer;
    if (value <= threshold.max) {
      // Below max (good) - calculate gradient
      const pos = 0.5 + (1 - value / threshold.max) * 0.5;
      return getGradientColor(Math.min(1, pos), false);
    } else {
      // Above max (bad)
      const pos = Math.max(0, 1 - (value - threshold.max) / (upperBound - threshold.max)) * 0.5;
      return getGradientColor(pos, false);
    }
  }
  return '#94a3b8';
}

// ========== DATA HELPERS ==========

function getUniqueYears(samples) {
  return [...new Set(samples.map(s => s.year).filter(y => y))].sort();
}

function getUniqueFields(samples) {
  return [...new Set(samples.map(s => s.field).filter(f => f))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function groupByField(samples) {
  const groups = {};
  samples.forEach(s => {
    const f = s.field || 'Unknown';
    if (!groups[f]) groups[f] = [];
    groups[f].push(s);
  });
  return groups;
}

function calculateFieldAverage(samples, nutrient, zeroMeansNoData = []) {
  const values = samples.map(s => s[nutrient]).filter(v => isValidValue(v, nutrient, zeroMeansNoData));
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// Check if a value represents actual data (not missing/placeholder)
// For certain attributes, 0 typically means "not tested" rather than actual zero
function isValidValue(value, attribute, zeroMeansNoData = []) {
  if (value === undefined || value === null || value === '') return false;
  const num = parseFloat(value);
  if (isNaN(num) || !isFinite(num)) return false;
  // For attributes where 0 means "no data", filter out zeros
  if (num === 0 && zeroMeansNoData.includes(attribute)) {
    return false;
  }
  return true;
}

// Get numeric value or null if invalid
function getNumericValue(value, attribute, zeroMeansNoData = []) {
  if (!isValidValue(value, attribute, zeroMeansNoData)) return null;
  return parseFloat(value);
}

// ========== GENERAL UTILITIES ==========

function debounce(fn, delay) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), delay);
  };
}

function throttle(fn, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// ========== P:Zn RATIO COLOR ==========
// Get color for P:Zn ratio based on optimal range (target 10:1, optimal 8-12)
function getPZnRatioColor(value) {
  if (value === null || value === undefined || isNaN(value)) return '#94a3b8'; // grey
  if (value >= 8 && value <= 12) return '#16a34a';  // Green (optimal 8-12, target 10:1)
  if ((value >= 5 && value < 8) || (value > 12 && value <= 15)) return '#eab308'; // Yellow (acceptable)
  return '#ef4444'; // Red (problematic <5 or >15)
}

// ========== STABILITY ANALYSIS ==========

// Generate location hash for grouping samples by position (~10m precision)
function getLocationHash(lat, lon, precision = 4) {
  return `${Number(lat).toFixed(precision)}_${Number(lon).toFixed(precision)}`;
}

// Calculate distance between two points in feet
function getDistanceFeet(lat1, lon1, lat2, lon2) {
  const R = 20902231; // Earth radius in feet
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Calculate CV (Coefficient of Variation) = (StdDev / Mean) × 100
function calculateCV(values) {
  if (!values || values.length < 2) return null;
  const validValues = values.filter(v => v !== null && v !== undefined && !isNaN(v));
  if (validValues.length < 2) return null;
  const mean = validValues.reduce((a, b) => a + b, 0) / validValues.length;
  if (mean === 0) return null;
  const variance = validValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / validValues.length;
  const stdDev = Math.sqrt(variance);
  return (stdDev / Math.abs(mean)) * 100;
}

// Group samples by location and calculate CV for each nutrient
// Optimized with spatial hashing for O(n) instead of O(n²) performance
function calculateStabilityData(samples, proximityFeet = 50) {
  if (!samples || samples.length === 0) return {};

  const locationGroups = {};
  const nutrients = ['pH', 'P', 'K', 'OM', 'CEC', 'Ca_sat', 'Mg_sat', 'K_Sat', 'H_Sat', 'Zn', 'Cu', 'Mn', 'Fe', 'Boron', 'S'];

  // Spatial index: grid cells ~100ft to ensure we can find 50ft neighbors
  // 100ft ≈ 0.0003 degrees latitude (varies slightly with longitude)
  const CELL_SIZE = 0.0003;
  const spatialIndex = new Map(); // Map<gridKey, Set<locationHash>>

  function getGridKey(lat, lon) {
    const gridLat = Math.floor(lat / CELL_SIZE);
    const gridLon = Math.floor(lon / CELL_SIZE);
    return `${gridLat}_${gridLon}`;
  }

  function getNearbyCells(lat, lon) {
    const gridLat = Math.floor(lat / CELL_SIZE);
    const gridLon = Math.floor(lon / CELL_SIZE);
    const cells = [];
    // Check 3x3 grid of cells
    for (let dLat = -1; dLat <= 1; dLat++) {
      for (let dLon = -1; dLon <= 1; dLon++) {
        cells.push(`${gridLat + dLat}_${gridLon + dLon}`);
      }
    }
    return cells;
  }

  // Group samples by location using spatial index
  samples.forEach(sample => {
    if (!sample.lat || !sample.lon) return;

    // Find existing group within proximity using spatial index
    let foundGroup = null;
    const nearbyCells = getNearbyCells(sample.lat, sample.lon);

    for (const cellKey of nearbyCells) {
      const cellGroups = spatialIndex.get(cellKey);
      if (!cellGroups) continue;

      for (const hash of cellGroups) {
        const group = locationGroups[hash];
        const dist = getDistanceFeet(sample.lat, sample.lon, group.lat, group.lon);
        if (dist < proximityFeet) {
          foundGroup = hash;
          break;
        }
      }
      if (foundGroup) break;
    }

    const hash = foundGroup || getLocationHash(sample.lat, sample.lon);
    if (!locationGroups[hash]) {
      locationGroups[hash] = { lat: sample.lat, lon: sample.lon, field: sample.field, samples: [] };
      // Add to spatial index
      const gridKey = getGridKey(sample.lat, sample.lon);
      if (!spatialIndex.has(gridKey)) {
        spatialIndex.set(gridKey, new Set());
      }
      spatialIndex.get(gridKey).add(hash);
    }
    locationGroups[hash].samples.push(sample);
  });

  // Calculate CV for each location and nutrient
  const stabilityData = {};
  for (const [hash, group] of Object.entries(locationGroups)) {
    if (group.samples.length < 2) continue; // Need at least 2 samples for CV

    stabilityData[hash] = {
      lat: group.lat,
      lon: group.lon,
      field: group.field,
      yearCount: group.samples.length,
      years: [...new Set(group.samples.map(s => s.year))].sort(),
      cvByNutrient: {},
      highVariabilityNutrients: []
    };

    // Calculate CV for each nutrient
    nutrients.forEach(attr => {
      const values = group.samples
        .map(s => s[attr])
        .filter(v => v !== undefined && v !== null && !isNaN(v));
      if (values.length >= 2) {
        const cv = calculateCV(values);
        if (cv !== null) {
          stabilityData[hash].cvByNutrient[attr] = cv;
          if (cv > 30) {
            stabilityData[hash].highVariabilityNutrients.push({ attr, cv });
          }
        }
      }
    });

    // Flag if any nutrient has high CV (>30%)
    stabilityData[hash].hasHighVariability = stabilityData[hash].highVariabilityNutrients.length > 0;
  }

  return stabilityData;
}

// Get stability color based on CV value (or SD for pH)
// attr parameter determines which thresholds to use
function getStabilityColor(value, attr = null) {
  if (value === null || value === undefined) return '#94a3b8'; // grey

  // pH uses Standard Deviation thresholds
  if (attr === 'pH') {
    if (value < 0.20) return '#16a34a';  // Green (stable)
    if (value < 0.35) return '#eab308';  // Yellow (moderate)
    return '#ef4444';                     // Red (volatile)
  }

  // All other nutrients use CV thresholds
  if (value < 20) return '#16a34a';  // Green (stable)
  if (value < 30) return '#eab308';  // Yellow (moderate)
  return '#ef4444';                   // Red (volatile)
}

// Get stability label based on CV value (or SD for pH)
function getStabilityLabel(value, attr = null) {
  if (value === null || value === undefined) return 'Unknown';

  // pH uses Standard Deviation thresholds
  if (attr === 'pH') {
    if (value < 0.20) return 'Stable';
    if (value < 0.35) return 'Moderate';
    return 'Volatile';
  }

  // All other nutrients use CV thresholds
  if (value < 20) return 'Stable';
  if (value < 30) return 'Moderate';
  return 'Volatile';
}

// Get stability emoji based on CV value (or SD for pH)
function getStabilityEmoji(value, attr = null) {
  if (value === null || value === undefined) return '';

  // pH uses Standard Deviation thresholds
  if (attr === 'pH') {
    if (value < 0.20) return '🟢';
    if (value < 0.35) return '🟡';
    return '🔴';
  }

  // All other nutrients use CV thresholds
  if (value < 20) return '🟢';
  if (value < 30) return '🟡';
  return '🔴';
}

// Calculate Standard Deviation
function calculateSD(values) {
  if (!values || values.length < 2) return null;
  const validValues = values.filter(v => v !== null && v !== undefined && !isNaN(v));
  if (validValues.length < 2) return null;
  const mean = validValues.reduce((a, b) => a + b, 0) / validValues.length;
  const variance = validValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / validValues.length;
  return Math.sqrt(variance);
}

// Calculate linear regression slope and intercept
// Returns { slope, intercept, r2 } where slope is change per year
function calculateLinearRegression(data) {
  // data should be array of { x: year, y: value }
  if (!data || data.length < 2) return null;

  const n = data.length;
  const sumX = data.reduce((sum, d) => sum + d.x, 0);
  const sumY = data.reduce((sum, d) => sum + d.y, 0);
  const sumXY = data.reduce((sum, d) => sum + d.x * d.y, 0);
  const sumX2 = data.reduce((sum, d) => sum + d.x * d.x, 0);
  const sumY2 = data.reduce((sum, d) => sum + d.y * d.y, 0);

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) return null;

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R² (coefficient of determination)
  const meanY = sumY / n;
  const ssTotal = data.reduce((sum, d) => sum + Math.pow(d.y - meanY, 2), 0);
  const ssResidual = data.reduce((sum, d) => {
    const predicted = slope * d.x + intercept;
    return sum + Math.pow(d.y - predicted, 2);
  }, 0);
  const r2 = ssTotal > 0 ? 1 - (ssResidual / ssTotal) : 0;

  return { slope, intercept, r2 };
}

// Determine trend direction based on slope magnitude
// Returns 'up', 'down', or 'flat'
function getTrendDirection(slope, currentValue, attr = null) {
  if (slope === null || slope === undefined) return 'flat';

  // Define minimum meaningful slope as percentage of current value
  // This prevents tiny absolute changes from being flagged as trends
  const minMagnitude = attr === 'pH' ? 0.02 : Math.abs(currentValue) * 0.02;

  if (Math.abs(slope) < minMagnitude) return 'flat';
  return slope > 0 ? 'up' : 'down';
}

// Calculate field-level stability for a nutrient
function calculateFieldStability(samples, attr) {
  const stabilityData = calculateStabilityData(samples);

  // Get CVs for this attribute from all locations in the field
  const cvValues = Object.values(stabilityData)
    .map(d => d.cvByNutrient[attr])
    .filter(cv => cv !== null && cv !== undefined);

  if (cvValues.length === 0) return null;

  const avgCV = cvValues.reduce((a, b) => a + b, 0) / cvValues.length;

  // Use new thresholds: CV < 20% stable, 20-30% moderate, > 30% volatile
  const label = getStabilityLabel(avgCV, attr);
  const color = getStabilityColor(avgCV, attr);
  const emoji = getStabilityEmoji(avgCV, attr);

  // Calculate stability score (inverse of CV, capped at 100)
  const stabilityScore = Math.max(0, Math.min(100, 100 - avgCV));

  return {
    avgCV,
    stabilityScore,
    locationCount: cvValues.length,
    label,
    color,
    emoji
  };
}

// Calculate trend stability from year-over-year data
// Uses CV for most nutrients, SD for pH
// yearData should be array of { year, avg } objects
function calculateTrendStability(yearData, attr) {
  if (!yearData || yearData.length < 2) return null;

  const values = yearData.map(d => d.avg).filter(v => v !== null && v !== undefined && !isNaN(v));
  if (values.length < 2) return null;

  let stabilityValue, stabilityMetric;

  if (attr === 'pH') {
    // Use Standard Deviation for pH
    stabilityValue = calculateSD(values);
    stabilityMetric = 'SD';
  } else {
    // Use Coefficient of Variation for all other nutrients
    stabilityValue = calculateCV(values);
    stabilityMetric = 'CV';
  }

  if (stabilityValue === null) return null;

  const label = getStabilityLabel(stabilityValue, attr);
  const color = getStabilityColor(stabilityValue, attr);
  const emoji = getStabilityEmoji(stabilityValue, attr);

  return {
    value: stabilityValue,
    metric: stabilityMetric,
    label,
    color,
    emoji,
    yearCount: yearData.length
  };
}

// Get comprehensive trend insight based on stability, trend direction, and nutrient behavior
// Returns the full insight object with message, confidence, etc.
function getTrendInsight(yearData, attr, slope, criticalLevels = {}) {
  if (!yearData || yearData.length < 2) return null;

  const stability = calculateTrendStability(yearData, attr);
  if (!stability) return null;

  const lastYear = yearData[yearData.length - 1];
  const currentValue = lastYear.avg;
  const trendDirection = getTrendDirection(slope, currentValue, attr);

  // Get behavior type for this nutrient
  const behavior = getNutrientBehavior(attr);

  // Get ideal and optimal levels
  const idealLevels = getIdealLevels();
  const optimalLevels = getOptimalLevels();
  const ideal = idealLevels[attr];
  const optimal = optimalLevels[attr];
  const optimalMin = optimal ? (typeof optimal === 'object' ? optimal.min : optimal) : null;
  const optimalMax = optimal ? (typeof optimal === 'object' ? optimal.max : null) : null;
  const criticalLevel = criticalLevels[attr];

  // Format ideal for display
  const idealDisplay = ideal !== undefined ? (Number.isInteger(ideal) ? ideal : ideal.toFixed(1)) : '?';

  // Determine confidence based on stability + years
  let confidence;
  if (stability.label === 'Stable' && yearData.length >= 4 && trendDirection !== 'flat') {
    confidence = 'High';
  } else if (stability.label === 'Moderate' || yearData.length === 3) {
    confidence = 'Medium';
  } else {
    confidence = 'Low';
  }

  // Determine if trend is "good" based on behavior and current position
  let trendIsGood = false;
  let message, background;
  const nearIdeal = ideal !== undefined && Math.abs(currentValue - ideal) / ideal < 0.05; // Within 5% of ideal
  const atOrAboveIdeal = ideal !== undefined && currentValue >= ideal;
  const belowIdeal = ideal !== undefined && currentValue < ideal;
  const inOptimalRange = optimalMin !== null && optimalMax !== null &&
                         currentValue >= optimalMin && currentValue <= optimalMax;

  if (behavior === 'more_is_ok') {
    // Above ideal is fine, only worry if below
    if (atOrAboveIdeal) {
      trendIsGood = true;
      if (trendDirection === 'down') {
        // Declining but still above ideal - that's OK
        message = `✓ Declining but still above target (${idealDisplay})`;
        background = '#dcfce7';
      } else if (trendDirection === 'up') {
        message = `✓ Above target (${idealDisplay}) and building`;
        background = '#dcfce7';
      } else {
        message = `✓ Stable above target (${idealDisplay})`;
        background = '#dcfce7';
      }
    } else {
      // Below ideal - behavior depends on trend
      if (trendDirection === 'up') {
        trendIsGood = true;
        message = `✓ Improving toward target (${idealDisplay})`;
        background = '#dcfce7';
      } else if (trendDirection === 'down') {
        trendIsGood = false;
        message = `🔴 Declining away from target (${idealDisplay}) - action recommended`;
        background = '#fee2e2';
      } else {
        trendIsGood = inOptimalRange;
        if (inOptimalRange) {
          message = `→ Stable in optimal range - target is ${idealDisplay}`;
          background = '#f1f5f9';
        } else {
          message = `→ Stable but below target (${idealDisplay}) - consider building`;
          background = '#f1f5f9';
        }
      }
    }

  } else if (behavior === 'target_specific') {
    // Want to hit ideal - too high OR too low is concerning
    const movingTowardIdeal = ideal !== undefined &&
      ((trendDirection === 'up' && currentValue < ideal) ||
       (trendDirection === 'down' && currentValue > ideal));
    const movingAwayFromIdeal = ideal !== undefined &&
      ((trendDirection === 'up' && currentValue > ideal) ||
       (trendDirection === 'down' && currentValue < ideal));

    if (nearIdeal || inOptimalRange) {
      trendIsGood = !movingAwayFromIdeal;
      if (trendDirection === 'flat') {
        message = `✓ Stable at target (${idealDisplay})`;
        background = '#dcfce7';
      } else if (movingAwayFromIdeal) {
        const dirText = currentValue > ideal ? 'Rising above' : 'Dropping below';
        message = `⚠️ ${dirText} target (${idealDisplay})`;
        background = '#fed7aa';
      } else {
        message = `✓ Near target (${idealDisplay})`;
        background = '#dcfce7';
      }
    } else if (movingTowardIdeal) {
      trendIsGood = true;
      message = `✓ Moving toward target (${idealDisplay})`;
      background = '#dcfce7';
    } else if (movingAwayFromIdeal) {
      trendIsGood = false;
      const dirText = currentValue > ideal ? 'High' : 'Low';
      message = `⚠️ ${dirText} and moving away from target (${idealDisplay})`;
      background = '#fed7aa';
    } else {
      // Flat but not at ideal
      trendIsGood = false;
      if (currentValue > ideal) {
        message = `→ Stable but above target (${idealDisplay})`;
      } else {
        message = `→ Stable but below target (${idealDisplay})`;
      }
      background = '#f1f5f9';
    }

  } else if (behavior === 'lower_is_better') {
    // Lower is always better (H_Sat)
    if (trendDirection === 'down') {
      trendIsGood = true;
      message = `✓ Declining (lower is better)`;
      background = '#dcfce7';
    } else if (trendDirection === 'up') {
      trendIsGood = false;
      message = `⚠️ Rising (lower is better)`;
      background = '#fed7aa';
    } else {
      trendIsGood = optimalMax ? currentValue <= optimalMax : true;
      message = optimalMax && currentValue > optimalMax
        ? `→ Stable but above max (${optimalMax})`
        : `✓ Stable`;
      background = trendIsGood ? '#dcfce7' : '#f1f5f9';
    }
  }

  // Add stability context to message - be specific about what kind of variability
  let hasVariabilityWarning = false;
  if (stability.label === 'Volatile') {
    hasVariabilityWarning = true;
    const metricNote = attr === 'pH' ? `SD ${stability.value.toFixed(2)} > 0.35` : `CV ${stability.value.toFixed(0)}% > 30%`;
    message += `. Field samples vary widely year-to-year (${metricNote}) - trend may not be reliable`;
    // Change background to warning if it was green
    if (background === '#dcfce7') {
      background = '#fef9c3'; // Light yellow warning
    }
  } else if (stability.label === 'Moderate' && trendDirection !== 'flat') {
    message += '. Moderate sample variability';
  }

  // Add preliminary data warning
  if (yearData.length < 3) {
    message += '. Trend is preliminary - more data needed';
  }

  // Calculate years to critical if applicable (only for more_is_ok declining trends)
  let yearsToCritical = null;
  if (criticalLevel !== undefined &&
      trendDirection === 'down' &&
      behavior === 'more_is_ok' &&
      stability.label !== 'Volatile' &&
      yearData.length >= 4 &&
      Math.abs(slope) > 0.001) {

    if (currentValue <= criticalLevel) {
      yearsToCritical = { status: 'below', message: '⚠️ Currently below critical level' };
    } else {
      const years = (currentValue - criticalLevel) / Math.abs(slope);
      if (years > 15) {
        yearsToCritical = { status: 'long', message: 'Long-term decline - monitor' };
      } else if (years > 0) {
        const unit = attr === 'pH' ? '' : (attr.includes('sat') || attr.includes('Sat') ? '%' : ' ppm');
        yearsToCritical = {
          status: 'projected',
          years: Math.round(years * 10) / 10,
          message: `At current rate (${slope > 0 ? '+' : ''}${slope.toFixed(1)}${unit}/yr), will reach critical (${criticalLevel}${unit}) in ~${Math.round(years)} years`
        };
      }
    }
  }

  // Determine urgency badge based on behavior and position
  let urgency = 'low';

  if (behavior === 'more_is_ok') {
    // Below critical is always high urgency
    if (criticalLevel !== undefined && currentValue < criticalLevel) {
      urgency = trendIsGood ? 'high-medium' : 'high';
    }
    // Below optimal min
    else if (optimalMin && currentValue < optimalMin) {
      if (!trendIsGood && stability.label === 'Stable') {
        urgency = 'high-medium';
      } else if (!trendIsGood) {
        urgency = 'medium';
      }
    }
  } else if (behavior === 'target_specific') {
    // Far from ideal in either direction
    if (ideal) {
      const pctFromIdeal = Math.abs(currentValue - ideal) / ideal;
      if (pctFromIdeal > 0.15 && !trendIsGood) {
        urgency = 'medium';
      }
      // Below critical is still bad for target_specific
      if (criticalLevel !== undefined && currentValue < criticalLevel) {
        urgency = 'high-medium';
      }
    }
  } else if (behavior === 'lower_is_better') {
    // Above max is concerning
    if (optimalMax && currentValue > optimalMax && !trendIsGood) {
      urgency = 'medium';
    }
  }

  // IMPORTANT: If there's high variability, badge cannot be "Good" (low)
  // The insight warns about unreliable data, so badge must match
  if (hasVariabilityWarning && urgency === 'low') {
    urgency = 'medium'; // Bump to "Review" at minimum
  }

  // Also bump urgency if message contains warning phrases but urgency is still low
  if (urgency === 'low') {
    const warningPhrases = ['Dropping', 'Declining away', 'action recommended', 'Rising away', 'moving away'];
    if (warningPhrases.some(phrase => message.includes(phrase))) {
      urgency = 'medium';
    }
  }

  return {
    trendDirection,
    stability,
    confidence,
    message,
    background,
    yearsToCritical,
    urgency,
    slope,
    behavior,
    ideal,
    trendIsGood
  };
}

// Get urgency badge HTML with clearer labels
function getUrgencyBadge(urgency) {
  const badges = {
    'high': { emoji: '🔴', label: 'Action Required', color: '#dc2626', bg: '#fee2e2' },
    'high-medium': { emoji: '⚠️', label: 'Needs Attention', color: '#ea580c', bg: '#fed7aa' },
    'medium': { emoji: '⚠️', label: 'Review', color: '#ca8a04', bg: '#fef9c3' },
    'low': { emoji: '✓', label: 'Good', color: '#16a34a', bg: '#dcfce7' }
  };
  return badges[urgency] || badges['low'];
}

// Default critical levels for nutrients (fallbacks if not set in Settings)
const DEFAULT_CRITICAL_LEVELS = {
  P: 15,
  K: 120,
  pH: 5.5,
  OM: 2.0,
  S: 8,
  Ca_sat: 55,
  Mg_sat: 8,
  K_Sat: 2.0,
  Zn: 0.5,
  Ca: 500,
  Mg: 50
};

// Default optimal levels for nutrients (fallbacks if not set in Settings)
const DEFAULT_OPTIMAL_LEVELS = {
  P: { min: 25, max: 50 },
  K: { min: 150, max: 250 },
  pH: { min: 6.0, max: 7.0 },
  OM: { min: 3.0, max: 5.0 },
  S: { min: 12, max: 30 },
  Ca_sat: { min: 65, max: 75 },
  Mg_sat: { min: 10, max: 15 },
  K_Sat: { min: 3.0, max: 5.0 },
  H_Sat: { max: 5.0 }
};

// Nutrient behavior types for trend interpretation
// more_is_ok: Above ideal is fine, only worry if below (P, K, OM, S, K_Sat, micros)
// target_specific: Want to hit ideal, too high OR too low is bad (Ca_sat, Mg_sat, pH)
// lower_is_better: Lower is always better (H_Sat)
const NUTRIENT_BEHAVIOR = {
  // Type A: "More is OK" - above ideal is fine, only worry if below
  P: 'more_is_ok',
  K: 'more_is_ok',
  OM: 'more_is_ok',
  S: 'more_is_ok',
  K_Sat: 'more_is_ok',
  Zn: 'more_is_ok',
  Boron: 'more_is_ok',
  Fe: 'more_is_ok',
  Mn: 'more_is_ok',
  Cu: 'more_is_ok',

  // Type B: "Target specific" - want to hit ideal, too high OR too low is bad
  Ca_sat: 'target_specific',
  Mg_sat: 'target_specific',
  pH: 'target_specific',

  // Special
  H_Sat: 'lower_is_better'
};

// Get critical levels from Settings (localStorage) with defaults
function getCriticalLevels() {
  const settings = JSON.parse(localStorage.getItem('soilSettings') || '{}');
  return {
    P: settings.P_critical ?? DEFAULT_CRITICAL_LEVELS.P,
    K: settings.K_critical ?? DEFAULT_CRITICAL_LEVELS.K,
    pH: settings.pH_critical ?? DEFAULT_CRITICAL_LEVELS.pH,
    OM: settings.OM_critical ?? DEFAULT_CRITICAL_LEVELS.OM,
    S: settings.S_critical ?? DEFAULT_CRITICAL_LEVELS.S,
    Ca_sat: settings.Ca_sat_critical ?? DEFAULT_CRITICAL_LEVELS.Ca_sat,
    Mg_sat: settings.Mg_sat_critical ?? DEFAULT_CRITICAL_LEVELS.Mg_sat,
    K_Sat: settings.K_sat_critical ?? DEFAULT_CRITICAL_LEVELS.K_Sat,
    Zn: DEFAULT_CRITICAL_LEVELS.Zn,
    Ca: DEFAULT_CRITICAL_LEVELS.Ca,
    Mg: DEFAULT_CRITICAL_LEVELS.Mg
  };
}

// Get optimal levels from Settings (localStorage) with defaults
function getOptimalLevels() {
  const settings = JSON.parse(localStorage.getItem('soilSettings') || '{}');
  return {
    P: { min: settings.P_min ?? DEFAULT_OPTIMAL_LEVELS.P.min, max: settings.P_max ?? DEFAULT_OPTIMAL_LEVELS.P.max },
    K: { min: settings.K_min ?? DEFAULT_OPTIMAL_LEVELS.K.min, max: settings.K_max ?? DEFAULT_OPTIMAL_LEVELS.K.max },
    pH: { min: settings.pH_min ?? DEFAULT_OPTIMAL_LEVELS.pH.min, max: settings.pH_max ?? DEFAULT_OPTIMAL_LEVELS.pH.max },
    OM: { min: settings.OM_min ?? DEFAULT_OPTIMAL_LEVELS.OM.min, max: settings.OM_max ?? DEFAULT_OPTIMAL_LEVELS.OM.max },
    S: { min: settings.S_min ?? DEFAULT_OPTIMAL_LEVELS.S.min, max: settings.S_max ?? DEFAULT_OPTIMAL_LEVELS.S.max },
    Ca_sat: { min: settings.Ca_sat_min ?? DEFAULT_OPTIMAL_LEVELS.Ca_sat.min, max: settings.Ca_sat_max ?? DEFAULT_OPTIMAL_LEVELS.Ca_sat.max },
    Mg_sat: { min: settings.Mg_sat_min ?? DEFAULT_OPTIMAL_LEVELS.Mg_sat.min, max: settings.Mg_sat_max ?? DEFAULT_OPTIMAL_LEVELS.Mg_sat.max },
    K_Sat: { min: settings.K_sat_min ?? DEFAULT_OPTIMAL_LEVELS.K_Sat.min, max: settings.K_sat_max ?? DEFAULT_OPTIMAL_LEVELS.K_Sat.max },
    H_Sat: { max: settings.H_sat_max ?? DEFAULT_OPTIMAL_LEVELS.H_Sat.max }
  };
}

// Get ideal target levels - calculated as midpoint of optimal range
function getIdealLevels() {
  const optimal = getOptimalLevels();
  const ideals = {};

  for (const [attr, range] of Object.entries(optimal)) {
    if (typeof range === 'object' && range.min !== undefined && range.max !== undefined) {
      // Calculate midpoint of optimal range
      ideals[attr] = (range.min + range.max) / 2;
    } else if (typeof range === 'object' && range.min !== undefined) {
      // Only min defined, use min as ideal
      ideals[attr] = range.min;
    } else if (typeof range === 'object' && range.max !== undefined) {
      // Only max defined (like H_Sat), use max as "ideal" (lower is better)
      ideals[attr] = range.max;
    } else {
      ideals[attr] = range;
    }
  }

  return ideals;
}

// Get nutrient behavior type (hardcoded, not user-configurable)
function getNutrientBehavior(attr) {
  return NUTRIENT_BEHAVIOR[attr] || 'more_is_ok';
}

// ========== BREAKPOINT ANALYSIS ==========

// Calculate mean of an array
function mean(arr) {
  if (!arr || arr.length === 0) return null;
  const valid = arr.filter(v => v !== null && v !== undefined && !isNaN(v));
  if (valid.length === 0) return null;
  return valid.reduce((sum, v) => sum + v, 0) / valid.length;
}

// Calculate standard deviation of an array
function std(arr) {
  if (!arr || arr.length < 2) return null;
  const m = mean(arr);
  if (m === null) return null;
  const valid = arr.filter(v => v !== null && v !== undefined && !isNaN(v));
  const variance = valid.reduce((sum, v) => sum + Math.pow(v - m, 2), 0) / valid.length;
  return Math.sqrt(variance);
}

// Sample without replacement (returns frac% of arr)
function sampleWithoutReplacement(arr, frac) {
  if (!arr || arr.length === 0) return [];
  const n = Math.max(1, Math.round(arr.length * frac));
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

// Stability tolerance by nutrient for breakpoint bootstrap
const BREAKPOINT_STABILITY_TOL = {
  Zn: 0.1, Zn_ppm: 0.1,
  P: 2, P_ppm: 2,
  K: 10, K_ppm: 10,
  pH: 0.1,
  OM: 0.2, OM_pct: 0.2
};

// Near band tolerance for classification
const BREAKPOINT_NEAR_BAND = {
  Zn: 0.1, Zn_ppm: 0.1,
  P: 2, P_ppm: 2,
  K: 10, K_ppm: 10,
  pH: 0.1,
  OM: 0.2, OM_pct: 0.2
};

/**
 * Find data-driven breakpoint using binning approach
 */
function findBreakpointBinning(points, nutrientKey, options = {}) {
  const {
    MIN_POINTS_PER_SIDE = null,
    MIN_PENALTY = 5,
    STABILITY_TOL = BREAKPOINT_STABILITY_TOL[nutrientKey] || 0.5,
    BOOT_ITER = 50,
    BOOT_FRAC = 0.8,
    skipBootstrap = false
  } = options;

  const getNutrientValue = (p) => {
    if (p[nutrientKey] !== undefined && p[nutrientKey] !== null && !isNaN(p[nutrientKey])) {
      return parseFloat(p[nutrientKey]);
    }
    if (p.soil && p.soil[nutrientKey] !== undefined && p.soil[nutrientKey] !== null && !isNaN(p.soil[nutrientKey])) {
      return parseFloat(p.soil[nutrientKey]);
    }
    const keyMap = { 'Zn_ppm': 'Zn', 'P_ppm': 'P', 'K_ppm': 'K', 'OM_pct': 'OM' };
    const altKey = keyMap[nutrientKey];
    if (altKey && p[altKey] !== undefined && p[altKey] !== null && !isNaN(p[altKey])) {
      return parseFloat(p[altKey]);
    }
    return null;
  };

  const getYieldValue = (p) => {
    if (p.avgYield !== undefined && p.avgYield !== null && !isNaN(p.avgYield)) {
      return parseFloat(p.avgYield);
    }
    if (p.yield && p.yield.value !== undefined && p.yield.value !== null && !isNaN(p.yield.value)) {
      return parseFloat(p.yield.value);
    }
    if (p.yieldValue !== undefined && p.yieldValue !== null && !isNaN(p.yieldValue)) {
      return parseFloat(p.yieldValue);
    }
    return null;
  };

  const validPoints = points.filter(p => {
    const x = getNutrientValue(p);
    const y = getYieldValue(p);
    return x !== null && y !== null;
  }).map(p => ({ x: getNutrientValue(p), y: getYieldValue(p), point: p }));

  if (validPoints.length < 10) {
    return {
      nutrientKey, breakpoint: null, penalty: 0, meanBelow: null, meanAbove: null,
      nBelow: 0, nAbove: 0, confidence: 'Low', stabilityPct: 0, candidatesTested: 0,
      error: 'Insufficient data points'
    };
  }

  validPoints.sort((a, b) => a.x - b.x);
  const minPerSide = MIN_POINTS_PER_SIDE || Math.max(5, Math.round(0.15 * validPoints.length));
  const uniqueX = [...new Set(validPoints.map(p => p.x))].sort((a, b) => a - b);

  let bestT = null, bestPenalty = -Infinity, bestStats = null, candidatesTested = 0;

  for (let i = 1; i < uniqueX.length; i++) {
    const t = uniqueX[i];
    const below = validPoints.filter(p => p.x < t);
    const above = validPoints.filter(p => p.x >= t);
    if (below.length < minPerSide || above.length < minPerSide) continue;
    candidatesTested++;
    const meanBelow = mean(below.map(p => p.y));
    const meanAbove = mean(above.map(p => p.y));
    const penalty = meanAbove - meanBelow;
    if (penalty > bestPenalty && penalty >= MIN_PENALTY) {
      bestT = t;
      bestPenalty = penalty;
      bestStats = { meanBelow, meanAbove, nBelow: below.length, nAbove: above.length };
    }
  }

  if (bestT === null) {
    return {
      nutrientKey, breakpoint: null, penalty: 0, meanBelow: null, meanAbove: null,
      nBelow: 0, nAbove: 0, confidence: 'Low', stabilityPct: 0, candidatesTested,
      error: `No threshold meets minimum penalty of ${MIN_PENALTY} bu/ac`
    };
  }

  let stabilityPct = 0;
  if (!skipBootstrap && bestT !== null) {
    let nearCount = 0;
    for (let i = 0; i < BOOT_ITER; i++) {
      const subset = sampleWithoutReplacement(points, BOOT_FRAC);
      const bootResult = findBreakpointBinning(subset, nutrientKey, {
        MIN_POINTS_PER_SIDE: Math.max(3, Math.round(minPerSide * BOOT_FRAC)),
        MIN_PENALTY, skipBootstrap: true
      });
      if (bootResult.breakpoint !== null && Math.abs(bootResult.breakpoint - bestT) <= STABILITY_TOL) {
        nearCount++;
      }
    }
    stabilityPct = (nearCount / BOOT_ITER) * 100;
  }

  let confidence = 'Medium';
  const yearsUsed = validPoints.map(p => p.point.yearsAveraged || p.point.yearsUsed || 1);
  const avgYears = mean(yearsUsed) || 1;
  if (avgYears <= 2) confidence = 'Medium-Low';
  if (bestPenalty >= 2 * MIN_PENALTY && stabilityPct >= 60) {
    confidence = avgYears <= 2 ? 'Medium' : 'High';
  }
  if (bestStats.nBelow < 7 || stabilityPct < 40) confidence = 'Low';

  return {
    nutrientKey, breakpoint: bestT, penalty: bestPenalty,
    meanBelow: bestStats.meanBelow, meanAbove: bestStats.meanAbove,
    nBelow: bestStats.nBelow, nAbove: bestStats.nAbove,
    confidence, stabilityPct, candidatesTested
  };
}

/**
 * Classify points by their relation to the breakpoint
 */
function classifyByBreakpoint(points, nutrientKey, breakpoint, nearBand = null) {
  if (breakpoint === null || breakpoint === undefined) return [];
  const band = nearBand || BREAKPOINT_NEAR_BAND[nutrientKey] || Math.abs(breakpoint * 0.1);

  const getNutrientValue = (p) => {
    if (p[nutrientKey] !== undefined && !isNaN(p[nutrientKey])) return parseFloat(p[nutrientKey]);
    if (p.soil && p.soil[nutrientKey] !== undefined) return parseFloat(p.soil[nutrientKey]);
    const keyMap = { 'Zn_ppm': 'Zn', 'P_ppm': 'P', 'K_ppm': 'K', 'OM_pct': 'OM' };
    const altKey = keyMap[nutrientKey];
    if (altKey && p[altKey] !== undefined) return parseFloat(p[altKey]);
    return null;
  };

  const getYieldValue = (p) => {
    if (p.avgYield !== undefined) return parseFloat(p.avgYield);
    if (p.yield && p.yield.value !== undefined) return parseFloat(p.yield.value);
    if (p.yieldValue !== undefined) return parseFloat(p.yieldValue);
    return null;
  };

  return points.map(p => {
    const value = getNutrientValue(p);
    const yieldVal = getYieldValue(p);
    if (value === null) return { ...p, classification: 'UNKNOWN', nutrientValue: null, yieldValue: yieldVal };
    let classification;
    if (value < breakpoint - band) classification = 'BELOW_BREAKPOINT';
    else if (value > breakpoint + band) classification = 'ABOVE_BREAKPOINT';
    else classification = 'NEAR_BREAKPOINT';
    return { ...p, classification, nutrientValue: value, yieldValue: yieldVal, distanceFromBreakpoint: value - breakpoint };
  }).filter(p => p.classification !== 'UNKNOWN');
}

/**
 * Rank points to address based on breakpoint analysis and interaction flags
 */
function rankPointsToAddress(points, context = {}) {
  const { breakpoints = {}, fieldMeanYield = null } = context;

  const getYieldValue = (p) => {
    if (p.avgYield !== undefined) return parseFloat(p.avgYield);
    if (p.yield && p.yield.value !== undefined) return parseFloat(p.yield.value);
    return null;
  };

  const yieldValues = points.map(getYieldValue).filter(v => v !== null);
  const meanYield = fieldMeanYield || mean(yieldValues) || 0;
  const criticalLevels = getCriticalLevels();

  const getNutrientValue = (p, key) => {
    if (p[key] !== undefined && !isNaN(p[key])) return parseFloat(p[key]);
    if (p.soil && p.soil[key] !== undefined) return parseFloat(p.soil[key]);
    const keyMap = { 'Zn_ppm': 'Zn', 'P_ppm': 'P', 'K_ppm': 'K', 'OM_pct': 'OM' };
    const altKey = keyMap[key];
    if (altKey && p[altKey] !== undefined) return parseFloat(p[altKey]);
    return null;
  };

  const scoredPoints = points.map(p => {
    let score = 0;
    const drivers = [];
    const suggestedActions = [];

    const pH = getNutrientValue(p, 'pH');
    const zn = getNutrientValue(p, 'Zn') || getNutrientValue(p, 'Zn_ppm');
    const phos = getNutrientValue(p, 'P') || getNutrientValue(p, 'P_ppm');
    const pot = getNutrientValue(p, 'K') || getNutrientValue(p, 'K_ppm');
    const yieldVal = getYieldValue(p);
    const pznRatio = phos && zn ? phos / zn : null;

    const keyNutrients = ['Zn_ppm', 'Zn', 'P_ppm', 'P', 'K_ppm', 'K', 'pH'];
    for (const key of keyNutrients) {
      const bp = breakpoints[key];
      if (!bp || bp.breakpoint === null) continue;
      const value = getNutrientValue(p, key);
      if (value === null) continue;
      const band = BREAKPOINT_NEAR_BAND[key] || Math.abs(bp.breakpoint * 0.1);
      if (value < bp.breakpoint - band) {
        score += 3;
        const nutrientName = key.replace('_ppm', '').replace('_pct', '');
        drivers.push(`Below ${nutrientName} breakpoint`);
        suggestedActions.push(`Address ${nutrientName} deficiency`);
      }
    }

    const hasStackedInteraction = (
      (pH > 7 && pznRatio > 12 && zn < 1.5) ||
      (pH < 5.8 && phos !== null && phos < (criticalLevels.P || 15))
    );

    if (hasStackedInteraction) {
      score += 2;
      if (pH > 7 && pznRatio > 12 && zn < 1.5) {
        drivers.push('High pH + P:Zn imbalance + low Zn');
        suggestedActions.push('Consider Zn application, review P strategy');
      } else {
        drivers.push('Low pH + low P interaction');
        suggestedActions.push('Address pH before P application');
      }
    }

    if (yieldVal !== null && yieldVal < meanYield) {
      score += 1;
      drivers.push('Below field average yield');
    }

    if (zn !== null && zn < (criticalLevels.Zn || 0.5)) {
      score += 1;
      if (!drivers.some(d => d.includes('Zn'))) {
        drivers.push('Zn below critical');
        suggestedActions.push('Zn application recommended');
      }
    }
    if (phos !== null && phos < (criticalLevels.P || 15)) {
      score += 1;
      if (!drivers.some(d => d.includes('P'))) {
        drivers.push('P below critical');
        suggestedActions.push('P application recommended');
      }
    }
    if (pot !== null && pot < (criticalLevels.K || 120)) {
      score += 1;
      if (!drivers.some(d => d.includes('K'))) {
        drivers.push('K below critical');
        suggestedActions.push('K application recommended');
      }
    }

    return {
      pointId: p.id || p.sampleId || `${p.lat?.toFixed(4)},${p.lon?.toFixed(4)}`,
      point: p, score, drivers, suggestedActions: [...new Set(suggestedActions)],
      location: { lat: p.lat, lon: p.lon }
    };
  });

  scoredPoints.sort((a, b) => b.score - a.score);

  const SEPARATION_FT = 250;
  const selected = [];

  for (const point of scoredPoints) {
    if (point.score === 0) continue;
    if (!point.location.lat || !point.location.lon) continue;
    let tooClose = false;
    for (const sel of selected) {
      const dist = getDistanceFeet(point.location.lat, point.location.lon, sel.location.lat, sel.location.lon);
      if (dist < SEPARATION_FT) {
        tooClose = true;
        if (selected.length <= 3 && !sel.clusteredPoints) sel.clusteredPoints = [];
        if (selected.length <= 3 && sel.clusteredPoints) sel.clusteredPoints.push(point.pointId);
        break;
      }
    }
    if (!tooClose) selected.push(point);
  }

  return selected.slice(0, 5);
}

/**
 * Build hinge feature for a value relative to a breakpoint
 */
function buildHingeFeature(x, t) {
  return { lowPart: Math.max(0, t - x), highPart: Math.max(0, x - t) };
}

/**
 * Run hinge-based multivariate regression
 */
function runHingeMVR(points, config) {
  const { primaryNutrientKey, breakpoint, covariates = [] } = config;
  if (breakpoint === null || breakpoint === undefined) {
    return { error: 'No breakpoint provided', r2: null };
  }

  const getNutrientValue = (p, key) => {
    if (p[key] !== undefined && !isNaN(p[key])) return parseFloat(p[key]);
    if (p.soil && p.soil[key] !== undefined) return parseFloat(p.soil[key]);
    const keyMap = { 'Zn_ppm': 'Zn', 'P_ppm': 'P', 'K_ppm': 'K', 'OM_pct': 'OM' };
    const altKey = keyMap[key];
    if (altKey && p[altKey] !== undefined) return parseFloat(p[altKey]);
    return null;
  };

  const getYieldValue = (p) => {
    if (p.avgYield !== undefined) return parseFloat(p.avgYield);
    if (p.yield && p.yield.value !== undefined) return parseFloat(p.yield.value);
    return null;
  };

  const validPoints = points.filter(p => {
    const y = getYieldValue(p);
    const primary = getNutrientValue(p, primaryNutrientKey);
    if (y === null || primary === null) return false;
    for (const cov of covariates) {
      if (getNutrientValue(p, cov) === null) return false;
    }
    return true;
  });

  if (validPoints.length < 15) {
    return { error: 'Insufficient data for hinge-MVR', r2: null };
  }

  const n = validPoints.length;
  const k = 3 + covariates.length;
  const X = [], y = [];

  for (const p of validPoints) {
    const primary = getNutrientValue(p, primaryNutrientKey);
    const hinge = buildHingeFeature(primary, breakpoint);
    const row = [1, hinge.lowPart, hinge.highPart];
    for (const cov of covariates) row.push(getNutrientValue(p, cov));
    X.push(row);
    y.push(getYieldValue(p));
  }

  try {
    const XtX = [];
    for (let i = 0; i < k; i++) {
      XtX[i] = [];
      for (let j = 0; j < k; j++) {
        let sum = 0;
        for (let r = 0; r < n; r++) sum += X[r][i] * X[r][j];
        XtX[i][j] = sum;
      }
    }

    const Xty = [];
    for (let i = 0; i < k; i++) {
      let sum = 0;
      for (let r = 0; r < n; r++) sum += X[r][i] * y[r];
      Xty[i] = sum;
    }

    const inv = invertMatrix(XtX);
    if (!inv) return { error: 'Matrix inversion failed (singular matrix)', r2: null };

    const coeffs = [];
    for (let i = 0; i < k; i++) {
      let sum = 0;
      for (let j = 0; j < k; j++) sum += inv[i][j] * Xty[j];
      coeffs[i] = sum;
    }

    const yMean = mean(y);
    let ssTotal = 0, ssResid = 0;
    for (let r = 0; r < n; r++) {
      let predicted = 0;
      for (let i = 0; i < k; i++) predicted += X[r][i] * coeffs[i];
      ssTotal += Math.pow(y[r] - yMean, 2);
      ssResid += Math.pow(y[r] - predicted, 2);
    }
    const r2 = ssTotal > 0 ? 1 - ssResid / ssTotal : 0;

    return {
      r2, intercept: coeffs[0], belowCoef: coeffs[1], aboveCoef: coeffs[2],
      covariateCoefs: coeffs.slice(3).map((c, i) => ({ name: covariates[i], coef: c })),
      n: validPoints.length, breakpoint
    };
  } catch (e) {
    return { error: 'Regression calculation failed: ' + e.message, r2: null };
  }
}

function invertMatrix(matrix) {
  const n = matrix.length;
  const aug = matrix.map((row, i) => {
    const r = [...row];
    for (let j = 0; j < n; j++) r.push(i === j ? 1 : 0);
    return r;
  });

  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(aug[k][i]) > Math.abs(aug[maxRow][i])) maxRow = k;
    }
    [aug[i], aug[maxRow]] = [aug[maxRow], aug[i]];
    if (Math.abs(aug[i][i]) < 1e-10) return null;
    const scale = aug[i][i];
    for (let j = 0; j < 2 * n; j++) aug[i][j] /= scale;
    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = aug[k][i];
        for (let j = 0; j < 2 * n; j++) aug[k][j] -= factor * aug[i][j];
      }
    }
  }
  return aug.map(row => row.slice(n));
}

// ========== EXPORT AS GLOBAL ==========
window.Utils = {
  // Status/UI
  showStatus,

  // Formatting
  formatNumber,
  getDecimals,
  formatValue,

  // Colors
  interpolateColor,
  getGradientColor,
  getChangeGradientColor,
  getMedianBasedColor,
  getChangeColor,
  getColor,
  getPZnRatioColor,

  // Stability analysis
  getLocationHash,
  getDistanceFeet,
  calculateCV,
  calculateSD,
  calculateStabilityData,
  getStabilityColor,
  getStabilityLabel,
  getStabilityEmoji,
  calculateFieldStability,
  calculateTrendStability,

  // Trend analysis
  calculateLinearRegression,
  getTrendDirection,
  getTrendInsight,
  getUrgencyBadge,
  DEFAULT_CRITICAL_LEVELS,
  DEFAULT_OPTIMAL_LEVELS,
  NUTRIENT_BEHAVIOR,
  getCriticalLevels,
  getOptimalLevels,
  getIdealLevels,
  getNutrientBehavior,

  // Data helpers
  getUniqueYears,
  getUniqueFields,
  groupByField,
  calculateFieldAverage,
  isValidValue,
  getNumericValue,

  // General utilities
  debounce,
  throttle,

  // Breakpoint analysis
  mean,
  std,
  sampleWithoutReplacement,
  findBreakpointBinning,
  classifyByBreakpoint,
  rankPointsToAddress,
  buildHingeFeature,
  runHingeMVR,
  BREAKPOINT_STABILITY_TOL,
  BREAKPOINT_NEAR_BAND
};

})();
