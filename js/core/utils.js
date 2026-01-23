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
// Get color for P:Zn ratio based on optimal range
function getPZnRatioColor(value) {
  if (value === null || value === undefined || isNaN(value)) return '#94a3b8'; // grey
  if (value >= 8 && value <= 10) return '#16a34a';  // Green (optimal 8-10)
  if ((value >= 5 && value < 8) || (value > 10 && value <= 12)) return '#eab308'; // Yellow (acceptable)
  return '#ef4444'; // Red (problematic <5 or >12)
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

// Get comprehensive trend insight based on stability and trend direction
// Returns the full insight object with message, confidence, etc.
function getTrendInsight(yearData, attr, slope, criticalLevels = {}) {
  if (!yearData || yearData.length < 2) return null;

  const stability = calculateTrendStability(yearData, attr);
  if (!stability) return null;

  const lastYear = yearData[yearData.length - 1];
  const trendDirection = getTrendDirection(slope, lastYear.avg, attr);

  // Determine confidence based on stability + years
  let confidence;
  if (stability.label === 'Stable' && yearData.length >= 4 && trendDirection !== 'flat') {
    confidence = 'High';
  } else if (stability.label === 'Moderate' || yearData.length === 3) {
    confidence = 'Medium';
  } else {
    confidence = 'Low';
  }

  // For lower_is_better nutrients, invert the trend interpretation
  const lowerIsBetter = ['H_Sat', 'Na_Sat', 'Soluble_Salts', 'EC'].includes(attr);
  const effectiveTrend = lowerIsBetter ?
    (trendDirection === 'up' ? 'down' : trendDirection === 'down' ? 'up' : 'flat') :
    trendDirection;

  // Generate insight message based on trend + stability matrix
  let message, background;

  if (effectiveTrend === 'up') {
    if (stability.label === 'Stable') {
      message = '✓ Consistent improvement - management is working';
      background = '#dcfce7'; // Light green
    } else if (stability.label === 'Moderate') {
      message = '↑ Improving with some variability';
      background = '#fef9c3'; // Light yellow
    } else {
      message = '⚠️ Appears improving, but high variability - confirm with consistent resampling';
      background = '#fef3c7'; // Yellow/amber
    }
  } else if (effectiveTrend === 'down') {
    if (stability.label === 'Stable') {
      message = '🔴 Consistent decline - action recommended';
      background = '#fee2e2'; // Light red/pink
    } else if (stability.label === 'Moderate') {
      message = '↓ Declining with moderate variability - consider action and confirm next sample';
      background = '#fed7aa'; // Light orange
    } else {
      message = '⚠️ May be declining, but unstable data - resample before major changes';
      background = '#fef3c7'; // Yellow/amber
    }
  } else {
    // Flat trend
    if (stability.label === 'Stable') {
      message = '✓ Holding steady with consistent readings';
      background = '#dcfce7'; // Light green
    } else if (stability.label === 'Moderate') {
      message = '→ Mostly steady with some noise - continue monitoring';
      background = '#f1f5f9'; // Light gray
    } else {
      message = '⚠️ Average stable but wide swings - investigate variability causes';
      background = '#fef3c7'; // Yellow/amber
    }
  }

  // Add preliminary data warning
  if (yearData.length < 3) {
    message += '. Trend is preliminary - more data needed';
  }

  // Calculate years to critical if applicable
  let yearsToCritical = null;
  const criticalLevel = criticalLevels[attr];
  if (criticalLevel !== undefined &&
      effectiveTrend === 'down' &&
      stability.label !== 'Volatile' &&
      yearData.length >= 4 &&
      Math.abs(slope) > 0.001) {

    const currentLevel = lastYear.avg;
    if (currentLevel <= criticalLevel) {
      yearsToCritical = { status: 'below', message: '⚠️ Currently below critical level' };
    } else {
      const years = (currentLevel - criticalLevel) / Math.abs(slope);
      if (years > 15) {
        yearsToCritical = { status: 'long', message: 'Long-term decline - monitor' };
      } else if (years > 0) {
        yearsToCritical = {
          status: 'projected',
          years: Math.round(years * 10) / 10,
          message: `At current rate (${slope > 0 ? '+' : ''}${slope.toFixed(1)} ${attr === 'pH' ? '' : 'ppm'}/yr), will reach critical level (${criticalLevel}${attr === 'pH' ? '' : ' ppm'}) in ~${Math.round(years)} years`
        };
      }
    }
  }

  // Determine urgency badge
  const optimalRanges = JSON.parse(localStorage.getItem('thresholds') || '{}');
  let urgency = 'low';
  const currentValue = lastYear.avg;

  // Check if below critical
  if (criticalLevel !== undefined && currentValue < criticalLevel) {
    if (effectiveTrend === 'down' && stability.label === 'Stable') {
      urgency = 'high';
    } else {
      urgency = 'high-medium';
    }
  } else if (criticalLevel !== undefined) {
    // Check if below optimal (using critical as a proxy if no optimal defined)
    const optimalMin = optimalRanges[`${attr}_min`] || criticalLevel * 1.5;
    if (currentValue < optimalMin) {
      if (effectiveTrend === 'down' && stability.label === 'Stable') {
        urgency = 'high-medium';
      } else if (effectiveTrend === 'down' || stability.label !== 'Stable') {
        urgency = 'medium';
      }
    }
  }

  return {
    trendDirection: effectiveTrend,
    stability,
    confidence,
    message,
    background,
    yearsToCritical,
    urgency,
    slope
  };
}

// Get urgency badge HTML
function getUrgencyBadge(urgency) {
  const badges = {
    'high': { emoji: '🔴', label: 'Action Needed', color: '#dc2626', bg: '#fee2e2' },
    'high-medium': { emoji: '⚠️', label: 'Attention', color: '#ea580c', bg: '#fed7aa' },
    'medium': { emoji: '⚠️', label: 'Watch', color: '#ca8a04', bg: '#fef9c3' },
    'low': { emoji: '✓', label: 'On Track', color: '#16a34a', bg: '#dcfce7' }
  };
  return badges[urgency] || badges['low'];
}

// Default critical levels for nutrients
const DEFAULT_CRITICAL_LEVELS = {
  P: 15,
  K: 120,
  pH: 5.5,
  OM: 2.0,
  Zn: 0.5,
  S: 8,
  Ca: 500,
  Mg: 50
};

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

  // Data helpers
  getUniqueYears,
  getUniqueFields,
  groupByField,
  calculateFieldAverage,
  isValidValue,
  getNumericValue,

  // General utilities
  debounce,
  throttle
};

})();
