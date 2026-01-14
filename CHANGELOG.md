# Changelog

All notable changes to the Soil Sample Analysis app will be documented in this file.

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
