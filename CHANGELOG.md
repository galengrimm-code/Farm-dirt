# Changelog

All notable changes to the Soil Sample Analysis app will be documented in this file.

---

## [v1.0.29] - January 15, 2026

### Yield Outlier Detection Improvements
- **Crop-specific thresholds**: Corn (50-350 bu/ac), Soybeans (20-100 bu/ac)
- **Scatter plot outlier filter**: New "Hide outliers" checkbox (default ON) removes bad yield data from scatter plot
- **Shows count**: Displays how many outliers were hidden and the threshold used
- **Better Data Scrubbing**: Outlier scanner now uses crop-specific limits to catch sensor errors

### Print-Friendly PDF Exports
- **Comprehensive print CSS**: Added page-break rules for all report types
- **Keep elements together**: Model summaries, key findings, tables, charts won't be cut across pages
- **Table headers repeat**: Headers visible on each page if table spans pages
- **Section breaks**: Major sections start on new pages

### Data Quality - Orphaned Sample Scanner
- **Find Samples Outside Boundaries**: New button in Data Scrubber section
- **Point-in-polygon detection**: Identifies samples not inside any field boundary
- **Cleanup stale data**: Remove samples from fields no longer farmed or with boundary changes
- **Review before delete**: Shows results in table for selective removal

### CSV Import Improvements
- **BOM removal**: Handles Excel CSVs with Byte Order Mark
- **Delimiter auto-detection**: Supports comma, semicolon, and tab-delimited files
- **Lab-specific aliases**: Added Midwest Labs column names (WpH, BpH, AA K, DTPA-Zn, etc.)
- **Clearer mapping UI**: Instructions and hints clarify which dropdown is standard vs CSV

### Shapefile Attribute Mapping
- **New mapping interface**: Preview and map shapefile attributes before importing
- **Summary bar**: Shows sample count and number of attributes found
- **Two-step wizard**: Map Attributes → Preview & Import
- **Auto-detection**: Automatically matches attributes using lab aliases (pH, P_M3, etc.)
- **Preview values**: Shows sample values next to each dropdown (e.g., "6.2, 6.8, 7.1...")
- **Unmapped attributes**: Yellow chips show which attributes aren't mapped to standard fields
- **Data preview table**: Review first 5 rows with mapped data before importing
- **Geometry extraction**: Lat/Lon automatically extracted from point coordinates
- **Save aliases**: Option to save new mappings for future imports

### Field Management
- **New "Manage Field Boundaries" section** on Import page
- **Field table**: Shows field name, acres, sample count, year range for each field
- **Visual indicators**: Fields with no samples highlighted in yellow with badge
- **Edit/Rename**: Click Edit to rename boundary AND update all associated samples
- **Delete with options**: Three deletion modes:
  - Delete boundary only (samples become "Unassigned")
  - Delete boundary AND all soil samples
  - Delete boundary and reassign samples to nearest field by GPS
- **Acre calculation**: Computes field size from boundary polygon coordinates
- **Summary bar**: Total fields, total acres, total samples

---

## [v1.0.27] - January 15, 2026

### CSV Import with Column Mapping
- **New import option**: Choose between Shapefile/ZIP or CSV with column mapping
- **Two-step wizard**: Map columns in Step 1, preview data in Step 2
- **Auto-detection**: Automatically maps columns using existing aliases (pH, P, K, etc.)
- **Required field validation**: Latitude and Longitude required, highlighted if missing
- **Data preview**: Shows first 5 rows with mapped column names
- **Row validation**: Warns about rows with missing/invalid coordinates
- **Save mapping profiles**: Save column mappings for reuse with different lab formats
- **Load saved mappings**: Quickly apply previously saved mappings

---

## [v1.0.19] - January 15, 2026

### Multivariate Regression Analysis
- **New sub-tabs** on Yield Correlation page: "Individual Correlations" and "Combined Model"
- **Multiple linear regression**: Analyzes all nutrients together to find which matter when controlling for others
- **Model Summary**: Shows R², Adjusted R², F-statistic, and observation count
- **Coefficients Table**: Displays coefficient, std error, t-value, p-value, and significance for each variable
- **Variable Selection**: Choose which nutrients to include with Select All / Core Only buttons
- **Sample Size Warning**: Alerts when sample size is too small for number of variables (n < 10 per variable)
- **Collinearity Detection**: Shows VIF (Variance Inflation Factor) warnings when variables are highly correlated
- **Yield Predictor**: Enter nutrient values to predict yield with 95% confidence interval
- **Interpretation Help**: Explains which variables are significant and what the coefficients mean

### Map - Mobile Improvements
- Compare mode now desktop-only (hidden on mobile < 768px)
- Mobile map keeps only essential controls: Field, Attribute, Year

### Spatial Change Analysis
- **Default to All Fields**: Operation-wide view selected by default
- **Earliest Available Baseline**: New option uses each field's earliest sample as baseline (not just 2013)
- **Per-field baseline**: When using "Earliest Available", each field uses its own first sample year
- Supports fields with different starting years in the same analysis

---

## [v1.0.17] - January 14, 2026

### Data Quality / Outlier Removal
- **New Data Quality section** on Import page for cleaning bad data
- **Outlier Detection Scan**: Scans all samples and flags suspicious values
  - Yield: < 50 or > 350 bu/ac (raw), or < 50% or > 175% of field average
  - Nutrients: pH outside 4.5-8.5, P > 300, K > 800, CEC > 50, OM > 15%
- **Review Before Delete**: Table of flagged items with checkboxes for selection
- **Configurable Thresholds**: Adjust what counts as an outlier
- **Delete with Confirmation**: Permanently removes selected outliers
- **Audit Log**: Records all deletions with timestamps

---

## [v1.0.15] - January 14, 2026

### Yield Correlation
- Add "Normalize by Field" toggle with explanation info box
- Collapsible info box explaining how normalization affects correlations
- When normalized, yields shown as % of field average to isolate nutrient effect

### Reports & Exports
- Improved page break handling in PDF reports
- Added CSS rules to prevent breaking inside cards, tables, and graphs
- Headers kept with following content
- Orphan/widow line prevention

---

## [v1.0.1] - January 14, 2026

### Version Tracking
- Add APP_VERSION and BUILD_DATE constants to all pages
- Display version and build timestamp in footer
- Add "What's New" section on Settings page
- Create CHANGELOG.md for version history
- Add pre-commit hook for automatic version bumping

### Yield Correlation Enhancements
- **Data Verification Check** button below scatter plot
- Show yield search radius used during import (50ft, 150ft, etc.)
- **Multi-year yield handling**:
  - "All Years (Average)" - averages yield across years at each location
  - "All Years (Combined)" - each year as separate data point
  - Specific year selection
- **Enhanced scatter plot**:
  - Larger chart (900x500)
  - Trend line with equation (y = mx + b)
  - R² (R-squared) display
  - 95% prediction interval bands
  - Yield threshold analysis with interactive slider
  - Swap Axes toggle (X=Nutrient/Y=Yield or X=Yield/Y=Nutrient)
  - Points highlighted above/below threshold
- Make scatter plot always visible (was hidden behind debug button)

### Data Storage
- **IndexedDB storage** for large datasets (fixes localStorage quota errors)
- Fix Import page not loading data from IndexedDB

### Map & Display
- Add configurable decimal precision for all nutrient attributes
- Show field averages in stats box when "All Fields" selected
- Use absolute thresholds for field shading
- Hide field labels when zoomed out
- Fix field shading by filtering outliers from color range
- Make placeholder text more faint in import form inputs

### Yield Import Fixes
- Rewrite yield matching to be soil-sample-centric
- Fix DBF parsing stack overflow with large yield files
- Fix yield correlation stack overflow for large datasets
- Fix yield import stack overflow and hide no-data samples
- Fix data quality: treat 0 as "no data" for nutrient values

### Other Fixes
- Reorder Analysis tabs: Field Trends first
- Fix year selection being overwritten in View mode
- Add gitignore for temp files

---

## [v0.13] - January 13, 2026

### Field Trends
- Add "All Fields" operation-wide trends
- Add median line to Field Trends with dual-line graph
- Improve Field Trends styling
- Fix Field Trends crash on empty string values
- Shrink Field Trends graphs for better PDF export layout
- Fix Field Trends graph sizing and layout

### Year-Over-Year Comparison
- Redesign Compare mode with stacked year selectors
- Improve Compare Years UX with smooth color gradients
- Change "Select None" to "Select All" in comparison
- Default to matching fields only
- Fix comparison buttons and error handling

### Yield Correlation
- Filter field dropdown to only show fields with yield data
- Rewrite yield matching to use most recent soil sample per yield point
- Fix yield GPS matching
- Add detailed yield matching diagnostics and debug logging
- Fix yield correlation value filtering for All Fields

### Import Improvements
- Show list of fields with yield data on import page
- Show list of sample years on import page
- Make import sections more visually distinct
- Add sample depth to Google Sheets storage
- Auto-detect crop year from yield file metadata
- Add detailed yield import summary with per-field breakdown
- Optimize yield storage and add multi-field zip import

### Settings & Configuration
- Add export functionality and editable column mapping
- Show all column aliases in settings (built-in + custom)
- Add hide/restore for built-in aliases
- Add confirmation dialog for removing individual aliases
- Fix alias deletion X button with proper escaping

### Backup & Security
- Add automatic backup system for data protection
- Add zoom-based field view mode and backup footer
- Allow public read access without login
- Share auth state across pages

### Map Enhancements
- Add all-attributes popup on sample click
- Use relative coloring for field shading when zoomed out
- Change zoom threshold to 15/16 for sample markers
- Fix field name assignment - use boundary matching only

### Bug Fixes
- Fix Field Rankings not loading data on initial view
- Remove redundant field dropdowns from year stats boxes
- Move status message below nav tabs
- Fix Google Sheets error on load with auto-retry
- Fix missing function errors
- Fix year selector sync issues

---

## [v0.12] - January 13, 2026

### Core Features
- Differentiate optional vs default fields in sample import
- Force deployment fixes

---

## [v0.11 and earlier] - January 12, 2026

### Initial Release Features
- **Map View**: Interactive Leaflet map with nutrient color coding
- **Sample Markers**: Color-coded by nutrient levels with smooth gradients
- **Field Boundaries**: Import and display field boundaries from shapefiles
- **Google Sheets Integration**: Store and sync data with Google Sheets
- **Analysis Page**:
  - Field Trends with visual graphs
  - Field Rankings and comparisons
  - Yield Correlations
  - Year-Over-Year comparison
- **Import Page**:
  - CSV/Excel soil sample import
  - Shapefile field boundary import
  - Yield map import from shapefiles
- **Settings Page**:
  - Nutrient thresholds configuration
  - Column mapping for different lab formats
  - Nutrient visibility toggles
  - Google Sheets configuration
- **Export**: PDF reports for Field Trends and Year Comparison
- **Mobile Support**: Responsive design with mobile toolbar

---

## Version History Summary

| Version | Date | Highlights |
|---------|------|------------|
| v1.0.1 | Jan 14, 2026 | Version tracking, scatter plot improvements, IndexedDB storage |
| v0.13 | Jan 13, 2026 | Field Trends redesign, backup system, yield correlation fixes |
| v0.12 | Jan 13, 2026 | Import improvements, bug fixes |
| v0.11 | Jan 12, 2026 | Initial public release |

---

*Generated from git commit history*
