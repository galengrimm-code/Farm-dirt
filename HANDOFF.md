# Soil Sample Analysis App - Handoff Document

## Project Overview

A web-based precision agriculture application that enables farmers to analyze soil nutrient data, track field performance over time, correlate soil conditions with crop yields, and make data-driven decisions without expensive agricultural consulting services.

**Live URL:** Hosted on GitHub Pages (ngrimm-code.github.io)

---

## Architecture

### Tech Stack
- **Frontend:** Vanilla HTML/CSS/JavaScript (no build tools required)
- **Maps:** Leaflet.js with OpenStreetMap/Esri satellite tiles
- **Storage:** Google Sheets API + localStorage (offline cache)
- **File Parsing:** Custom shapefile/GeoJSON/CSV parsers, JSZip for ZIP handling
- **Authentication:** Google OAuth 2.0

### File Structure
```
soil-app-inline/
├── index.html      # Main map view
├── analysis.html   # Analysis dashboards (4 tabs)
├── import.html     # Data import (boundaries, samples, yield)
├── settings.html   # Configuration (thresholds, Google Sheets, visibility)
```

### Data Flow
```
User uploads files → Parsed in browser → Stored in localStorage
                                      → Synced to Google Sheets (if signed in)
                                      
Page load → Check if signed in → Yes → Load from Google Sheets → Cache locally
                              → No  → Load from localStorage
```

---

## Google Cloud Configuration

### Current Credentials (Galen's Project)
```javascript
CLIENT_ID: '714780458094-9rde31taeottmavhl5t0uo8b9kfpergc.apps.googleusercontent.com'
API_KEY: 'AIzaSyCOSDbrAlc3ct2-lRvJv1y7V0nV7haWc9E'
```

### Default Google Sheet ID
```
1buu-8KXoM1kRJSOAWtHaAk40seQT5kqGFY9RICYwdRY
```

### Required Google Sheet Tabs
| Tab Name | Columns |
|----------|---------|
| **Samples** | sampleId, field, lat, lon, year, depth, pH, P, K, OM, Ca_sat, Mg_sat, K_Sat, H_Sat, Zn, Cu, Mn, Fe, Boron, S, CEC, Buffer_pH, P2, Na_Sat, Na, Ca, Mg, NO3, NH4, Soluble_Salts, EC |
| **Fields** | id, name, boundary (JSON), acres, created |
| **Settings** | key, min, target, max |

### Self-Service Setup (New Farmers)
Users can configure their own Google Sheet in Settings:
1. Create new Google Sheet with required tabs
2. Enter Sheet ID in Settings page
3. Save configuration (stored in localStorage as `googleSheetId`)
4. Each user/operation has isolated data

---

## Features by Page

### 📍 Map (index.html)

**Core Features:**
- Display soil samples as colored markers
- Color coding based on nutrient thresholds (red/yellow/green)
- Field boundary polygons
- Filter by Field, Attribute, Year

**Smart Zoom Behavior:**
- Zoom level ≥ 13: Individual sample markers
- Zoom level < 13: Field-level shading (average nutrient value)

**Compare Mode:**
- Year-over-year comparison
- Shows change values (+/- format) on markers
- Green = improvement, Red = decline

**Field Mode:**
- Larger touch-friendly markers for mobile field use
- GPS tracking with pulsing blue dot
- Accuracy circle display

**Mobile Optimizations:**
- 3 dropdowns (Field, Attribute, Year) in compact layout
- Bottom toolbar: Field Mode, Compare, Refresh
- Legend hidden on mobile

### 📊 Analysis (analysis.html)

**Tab 1: Operation Year-Over-Year**
- Compare two years across entire operation
- Stats boxes showing sample counts per year
- Field selection checkboxes (include/exclude fields)
- Mismatch detection (fields only in one year)
- Nutrient cards with % change

**Tab 2: Field Trends**
- Select individual field
- Historical trend cards per nutrient
- Shows all years of data for that field

**Tab 3: Field Rankings**
- Rank fields by any nutrient
- Filter by year or "Most Recent"
- Table with Avg/High/Low/Sample count

**Tab 4: Yield Correlation** ⭐ NEW
- Upload yield shapefiles to correlate with soil
- Pearson correlation coefficients (r, r²)
- Filter by Crop (Corn/Soybeans), Year, Field
- Significance indicators (⭐⭐⭐ high, ⭐⭐ medium, ⭐ low)

### 📁 Import (import.html)

**Boundary Import:**
- Supports: GeoJSON, Shapefile, ZIP
- Auto-detects field names from file
- Batch import multiple fields

**Sample Import:**
- Supports: CSV, Shapefile, GeoJSON, ZIP
- Column mapping modal for unrecognized headers
- Custom aliases saved for future imports
- Auto-assigns samples to fields by GPS location

**Yield Import:** ⭐ NEW
- Supports: Shapefile (ZIP or individual files)
- Compatible with John Deere and Climate FieldView exports
- Configurable radius: 30ft, 60ft, 90ft
- Matches yield points to nearest soil samples
- Stores correlation on sample objects

**Data Management:**
- Sync to Google Sheets
- Reassign samples to boundaries
- Clear Samples / Clear Boundaries / Clear All

### ⚙️ Settings (settings.html)

**Google Sheets Connection:**
- Sheet ID configuration
- Operation name (customizes app title)
- Test connection button
- Setup instructions for new users

**Nutrient Thresholds:**
- pH optimal range
- Macronutrient minimums (P, K, OM)
- Base saturation ranges (Ca, Mg, K, H)
- Buffer zone percentage

**Column Aliases:**
- View/delete custom column mappings
- Created during import when mapping columns

**Nutrient Visibility:**
- Checkbox grid to show/hide nutrients
- Affects dropdowns in Map and Analysis pages

---

## Data Structures

### Sample Object
```javascript
{
  sampleId: "4550108",
  field: "Glens",
  lat: 39.8528,
  lon: -95.5347,
  year: 2021,
  depth: "6",  // Sample depth in inches (default: 6)
  pH: 6.8,
  P: 28,
  K: 185,
  OM: 3.2,
  // ... other nutrients
  yieldCorrelations: {  // Added when yield data imported
    2021: {
      avgYield: 218.5,
      pointCount: 47,
      crop: "corn",
      radiusFt: 60
    }
  }
}
```

### Field Boundary Object
```javascript
{
  "Glens": [[lat, lon], [lat, lon], ...],  // Polygon coordinates
  "WCG": [[[lat, lon], ...], [[lat, lon], ...]]  // Multi-polygon
}
```

### Yield Data Object
```javascript
{
  lat: 39.8530,
  lon: -95.5350,
  yield: 225.3,
  year: 2021,
  crop: "corn"
}
```

---

## localStorage Keys

| Key | Purpose |
|-----|---------|
| `soilSamples` | Array of sample objects |
| `fieldBoundaries` | Object of field polygons |
| `yieldData` | Array of yield points |
| `soilSettings` | Threshold settings |
| `columnAliases` | Custom column mappings |
| `nutrientVisibility` | Show/hide nutrients |
| `googleSheetId` | Custom Sheet ID |
| `operationName` | Farm/operation name |
| `googleAccessToken` | OAuth token |
| `googleTokenExpiry` | Token expiration |

---

## Supported Nutrients

### Default Visible (17)
Sample ID, pH, P, K, OM, CEC, Ca%, Mg%, K%, H%, Zn, Cu, Mn, Fe, Boron, S, Buffer pH

### Default Hidden (9)
P2 (Bray P2), Na%, Na, Ca(ppm), Mg(ppm), NO3, NH4, Soluble_Salts, EC

### Column Aliases (Auto-mapped)
```javascript
{
  pH: ['ph', 'soil_ph'],
  P: ['phosphorus', 'bray_p', 'bray_p1', 'p_ppm', 'p1'],
  K: ['potassium', 'k_ppm'],
  OM: ['organic_matter', 'om_pct', 'o_m'],
  // ... see import.html STANDARD_FIELDS for full list
}
```

---

## Color Coding Logic

### Threshold-Based (pH, P, K, OM, Base Sats)
- **Green:** Within optimal range or above minimum
- **Yellow:** In buffer zone (default 25% outside optimal)
- **Red:** Below minimum or outside range

### Median-Based (CEC, Micronutrients)
- Uses IQR (Interquartile Range) to handle outliers
- **Green:** Upper third of values
- **Yellow:** Middle third
- **Red:** Lower third

### "Lower is Better" Nutrients
Mg_sat, H_Sat, Na_Sat, Soluble_Salts - color scale inverted

---

## Yield Correlation Feature

### How It Works
1. User uploads yield shapefile (John Deere/Climate FieldView export)
2. System extracts lat/lon and yield value from each point
3. For each soil sample, finds all yield points within configured radius
4. Averages yield values and attaches to sample
5. Calculates Pearson correlation coefficient for each nutrient vs yield

### Supported Yield Field Names
```javascript
['VRYIELDVO', 'Yld_Vol_Dr', 'YLD_VOL_DR', 'YIELD', 'DryYield', 
 'Dry_Yield', 'YldVolDry', 'YldMassDry', 'VRYIELDMA', 'Yld_Mass_D']
```

### Correlation Interpretation
| r value | Meaning |
|---------|---------|
| +0.7 to +1.0 | Strong positive |
| +0.4 to +0.7 | Moderate positive |
| +0.2 to +0.4 | Weak positive |
| -0.2 to +0.2 | No relationship |
| < -0.2 | Negative correlation |

---

## Known Issues / TODO

### Current Issues
None currently tracked.

### Potential Enhancements
1. Export reports (PDF/Excel)
2. Variable rate prescription maps
3. Multi-year trend charts with graphs
4. Field zone management (sub-divide fields)
5. Integration with more yield monitor formats
6. Offline-first PWA support
7. Push notifications for sync status

---

## Development Notes

### No Build Process
All files are standalone HTML with inline CSS/JS. Just edit and refresh.

### Testing New Features
1. Edit files locally
2. Open in browser (file:// works for most features)
3. Google OAuth requires HTTPS (use GitHub Pages or localhost with cert)

### Deployment
1. Commit changes to GitHub
2. GitHub Pages auto-deploys from main branch
3. Clear browser cache if changes don't appear

### Adding New Nutrients
1. Add to `STANDARD_FIELDS` in import.html
2. Add aliases to `DEFAULT_ALIASES` in import.html
3. Add to `CONFIG.ALL_NUTRIENTS` in index.html
4. Add display name to `CONFIG.NUTRIENT_NAMES` in index.html and analysis.html
5. Add unit to `CONFIG.NUTRIENT_UNITS`
6. If "lower is better", add to `CONFIG.LOWER_IS_BETTER`

---

## Contact / Resources

- **Primary Developer:** Galen
- **Google Cloud Console:** console.cloud.google.com
- **Leaflet Docs:** leafletjs.com
- **Google Sheets API:** developers.google.com/sheets/api

---

*Last Updated: January 2025*
*Version: v11*
