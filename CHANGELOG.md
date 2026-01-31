# Changelog

All notable changes to the Soil Sample Analysis app will be documented in this file.

---

## [v1.0.79] - January 31, 2026

### IrrWatch NDVI Integration

- **IrrWatch API connection**: Connect to IrrWatch in Settings to fetch satellite NDVI and vegetation data
- **OAuth2 authentication**: Secure client credentials flow for IrrWatch API access
- **Import NDVI data**: New section on Import page to fetch field-level NDVI data by order and date
- **NDVI map overlay**: Toggle button on map page displays NDVI values as colored field overlays
- **Color-coded vegetation**: Green (healthy) to brown (bare) color scale for easy visual assessment
- **Data caching**: NDVI data stored in both IndexedDB (local) and Google Sheets (cloud)
- **Field selector**: Choose which NDVI data fields to save to Google Sheets (ndvi, vegetation_cover, soil_moisture, evapotranspiration, etc.)
- **Replace/Accumulate modes**: Keep only latest snapshot or accumulate historical data
- **Discreet UI**: IrrWatch section hidden by default for users who don't have an account

### How to Connect IrrWatch

1. Go to Settings and find "IrrWatch NDVI Integration"
2. Enter your IrrWatch API Key and Password (from IrrWatch portal)
3. Select your company from the dropdown
4. Go to Import page to fetch NDVI data by date
5. Expand "Fields to Save" to customize which data columns are stored
6. Toggle the NDVI button on the map to view vegetation health overlays

---

## [v1.0.78] - January 31, 2026

### Google Sheets Connection Overhaul

- **Google Picker integration**: Browse and select sheets directly from Google Drive instead of pasting URLs
- **One-click sheet creation**: "Create New Sheet" now creates the sheet with all 5 tabs (Samples, Fields, Settings, YieldData, SampleSites) and headers automatically set up
- **Improved security**: Updated OAuth scope from `spreadsheets` to `drive.file` - app now only has access to sheets you explicitly select, not all your spreadsheets
- **Migration flow**: Existing users see a one-time prompt to re-select their sheet with the new secure scope
- **Simplified setup**: Removed manual URL pasting and tab renaming instructions

### How Sharing Works Now

With the new `drive.file` scope, team members access shared sheets by:
1. Owner shares the sheet normally in Google Drive
2. Team member opens the app and clicks "Select from Drive"
3. They pick the shared sheet - app now has access for their account

---

## [v1.0.77] - January 27, 2026

### Privacy Policy Visibility (Google OAuth Review)
- **Prominent footer**: New site footer with large button-style links for Privacy Policy and Terms of Service
- **Header privacy link**: Added underlined Privacy Policy link in the header area
- **Google reviewer friendly**: Made legal links impossible to miss for OAuth app verification

---

## [v1.0.76] - January 26, 2026

### Sample Site Logging
- **Multi-select sample types**: Select multiple sample types (Soil, Tissue, Nematode, etc.) when logging a sample site
- **Edit sample sites**: Click existing sample site markers to add or remove sample types
- **Sample type display**: Sample sites show which types have been collected

### Analysis Improvements
- **Nutrient-specific CV explanations**: Variability cards now explain WHY each nutrient varies (e.g., P varies due to stratification from no-till, K varies due to crop removal patterns)
- **Enhanced 5-Trigger Framework**: Added interaction notes and tighter thresholds for nutrient recommendations

### Import Page
- **Section headers**: Reorganized Import page into "Data Import" and "Data Management" sections for clarity
- **Manual Sync to Sheets button**: Added button to manually trigger Google Sheets sync

### Bug Fixes
- **Reverted sample marker delete**: Removed delete functionality from sample site markers (was causing issues)

---

## [v1.0.75] - January 24, 2026

### Organic Matter (OM) Improvements

- **Stricter OM stability thresholds**: CV <10% Stable, 10-20% Moderate, >20% Volatile (vs standard 20/30%)
- **Dedicated OM card builder**: Replaces generic nutrient card with agronomic-specific recommendations
- **Three OM levers** mapped to 5-trigger framework:
  - **Increase carbon inputs**: Cover crops (cereal rye, triticale), extend living roots, maintain residue
  - **Reduce carbon loss**: Reduce tillage intensity, avoid unnecessary disturbance
  - **Import carbon**: Manure/compost to lowest OM zones (credit nutrients properly)
- **OM-specific volatility warning**: "OM is sensitive to sampling depth and lab method; keep depth consistent and use the same lab/method across years."
- **Multi-year expectation note**: Always shows "OM changes slowly in most corn/soy systems. Treat OM trends as multi-year signals, not year-to-year decisions."

### Sample Site Pin Drop

- **Site ID generated on save**: Shows "(Generated on save)" placeholder until Save button clicked
- **Client/Farm validation**: Requires selection before saving
- **Improved field detection**: Added console logging for debugging when field not detected

### Bug Fixes

- **Fixed Google Sheets sync duplication**: Changed from `append` to `update` API calls for Clients, Farms, Fields, and Samples tabs. Prevents duplicate data when sync is called multiple times.
- **Fixed Field Trends bug**: Renamed duplicate `getNutrientThresholds` function that was causing nutrient cards to crash

---

## [v1.0.74] - January 23, 2026

### Field Trends - Nutrient Insights

- **P:Zn Ratio Insights**: 5-case tiered recommendations based on ratio level AND zinc sufficiency
  - Shows current P, Zn, and ratio values with actionable guidance
  - "Why ratios matter" tooltip explaining agronomic context
  - Added to both single field and operation-wide views

- **Organic Matter Tips**: Actionable improvement tips when OM is below threshold
  - Triggers when OM < 2.0% (critical) or below optimal with flat/declining trend
  - 4 specific tips: cover crops, reduced tillage, compost/manure, crop residue
  - Always visible (not collapsible) for immediate visibility

- **Zinc Improvement Insights**: Comprehensive 3-tier guidance system
  - Low (<50% target), Marginal (50-100%), Adequate (≥100%)
  - Dynamic Zn target based on P level: `max(1.5 ppm, P/10)` to maintain 10:1 ratio
  - Shows calculated target with explanation when elevated due to high P
  - P:Zn ratio used as context, not primary trigger

### Methodology Page

- **New page**: `methodology.html` documenting all calculations used in the app
- **8 sections**: Stability Scores, Trend Analysis, Nutrient Ratios, Thresholds, Averages, Yield Correlation, Spatial Analysis, Color Scaling
- **Formulas**: Code-style boxes with exact formulas (CV, linear regression, Pearson r, etc.)
- **Agronomic context**: "Why it matters" notes explaining the science
- **Navigation**: Jump links and collapsible sections
- **Footer links**: Added "How We Calculate" link to all page footers
- **Settings card**: Prominent link card added to Settings page

### Settings

- **pH default change**: Updated optimal range from 6.0-7.0 to 6.3-7.0

### Bug Fixes

- **Fixed**: Year dropdown now hidden when stability attributes selected (stability uses all years)
- **Improved**: Stability legend shows "CV% across all years" for clarity

---

## [v1.0.73] - January 21, 2026

### Dynamic Zoom-Based Color Scaling
- **New**: Field colors now based on only VISIBLE fields on screen (not all fields)
- **Dynamic legend**: Shows current visible range (e.g., "18 - 45 ppm")
- **Auto-updates on pan/zoom**: Color scale recalculates as you move the map
- **Better detail**: See subtle differences when zoomed into areas with similar values
- **Debounced updates**: 150ms delay prevents excessive recalculations

### Google Sheet URL Support
- **Accept full URLs**: Paste entire Google Sheet URL instead of just the ID
- **Auto-extraction**: Sheet ID automatically extracted from URL
- **Backwards compatible**: Still accepts just the ID if preferred
- **Shows confirmation**: "Sheet ID detected: 1ABC..." after parsing

### Bug Fixes
- **Fixed**: Sheet ID extraction - was using full URL instead of extracted ID
- **Fixed**: CONFIG.SHEET_ID getter now extracts ID from stored URLs

### UI Improvements
- **Footer links**: Added Privacy Policy and Terms of Service links to all pages
- **Google verification**: Added Search Console verification file

---

## [v1.0.72] - January 20, 2026

### Custom Domain
- **New domain**: App now available at https://farm-dirt.com
- **CNAME configured**: GitHub Pages custom domain setup

### Branding
- **New logo**: Seedling with soil SVG logo (`logo.svg`)
- **Favicon**: Optimized icon for browser tabs (`favicon.svg`)
- **All pages updated**: Favicon link added to all HTML pages

### Google OAuth Verification Documents
- **Privacy Policy**: `privacy-policy.html` - explains data handling and user rights
- **Terms of Service**: `terms-of-service.html` - usage terms and disclaimers
- **Support Page**: `support.html` - FAQ and help documentation
- **Verification guide**: `README-OAUTH-VERIFICATION.md` - step-by-step OAuth setup

---

## [v1.0.71] - January 20, 2026

### Google Sheets Sync Improvements
- **Auto-sync**: All imports and client/farm changes automatically sync to Google Sheets
- **Removed manual sync button**: No longer needed since everything auto-syncs
- **New "Load from Google Sheets" button**: Pull data from Sheets to sync across devices
- **Safer sync**: Sync now only writes data, never clears existing data from Sheets
- **Clients/Farms tabs**: Auto-created in Google Sheets when first syncing

### Bug Fixes
- **Fixed**: Import page syntax error causing data not to load
- **Fixed**: Data loading on mobile - samples and boundaries now load independently
- **Fixed**: Removed auto-created "Default Farm" - defaults to "All" until user creates structure

---

## [v1.0.70] - January 17, 2026

### Client/Farm Organizational Structure
- **New**: Hierarchical organization for multi-client operations (Client → Farm → Field)
- **Settings page**: "Active Operation" card to select which client/farm to view
- **Settings page**: "Manage Clients & Farms" card to add/edit/delete clients and farms
- **Auto-filtering**: All pages automatically filter by active client/farm selection
- **Import page**: Assign field boundaries to a specific client/farm when importing
- **Quick-add buttons**: Create new clients or farms directly from the import page
- **Field Management**: Table now shows which farm/client each field belongs to
- **Data migration**: Existing fields automatically assigned to default client/farm on first load

### How It Works
1. Go to Settings → "Manage Clients & Farms" to create clients and farms
2. Select active client/farm in "Active Operation" section
3. Map, Analysis, and Import pages automatically filter to show only selected data
4. When importing boundaries, choose which client/farm they belong to

---

## [v1.0.46] - January 15, 2026

### Shapefile Attribute Mapping Bug Fix
- **Fixed**: All shapefile attributes now appear in every dropdown
- **Added HTML escaping**: Properly escape special characters (parentheses, dashes, quotes) in attribute names
- **Debug logging**: Console shows all detected attributes vs what's added to dropdowns
- **New dropdowns**: Added Sample Year and Sample Depth mapping fields
- **Year/Depth from shapefile**: Can now map year and depth from shapefile attributes (overrides form values)
- **Year aliases**: Auto-detects year, cropyear, sampledate, etc.
- **Depth aliases**: Auto-detects depth, sampledepth, depth_in, etc.
- **Live unmapped updates**: Unmapped attributes list updates as you change dropdown selections

---

## [v1.0.45] - January 15, 2026

### Yield Data Persistence Fix
- **Fixed**: Yield data now persists across page refreshes
- **Root cause**: Raw `yieldData[]` array was not being saved to IndexedDB
- **IndexedDB v2**: Added 'yield' object store for storing raw yield points
- **All pages updated**: import.html, analysis.html, index.html now use DB_VERSION 2

### Yield Year Dropdown Improvements
- **Shows matched vs unmatched**: Years with yield data but not matched to soil samples now appear (disabled)
- **Debug logging**: Console shows detailed breakdown of matched vs raw yield years
- **Better diagnostics**: Helps identify when yield import succeeded but matching failed

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
| v1.0.77 | Jan 27, 2026 | Prominent privacy policy footer and header link for Google OAuth review |
| v1.0.76 | Jan 26, 2026 | Sample site editing, multi-select types, CV explanations, 5-Trigger enhancements |
| v1.0.75 | Jan 24, 2026 | OM agronomic recommendations, Sheets sync fix, Sample Site modal |
| v1.0.74 | Jan 23, 2026 | Field Trends insights (P:Zn, OM, Zn), Methodology page, pH default |
| v1.0.73 | Jan 21, 2026 | Dynamic zoom-based color scaling, Google Sheet URL support |
| v1.0.1 | Jan 14, 2026 | Version tracking, scatter plot improvements, IndexedDB storage |
| v0.13 | Jan 13, 2026 | Field Trends redesign, backup system, yield correlation fixes |
| v0.12 | Jan 13, 2026 | Import improvements, bug fixes |
| v0.11 | Jan 12, 2026 | Initial public release |

---

*Generated from git commit history*
