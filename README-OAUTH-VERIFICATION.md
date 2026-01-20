# Google OAuth Verification Checklist

This document outlines the steps to complete Google OAuth verification for the Soil Analysis App.

---

## Prerequisites Created

- [x] `privacy-policy.html` - Privacy policy page
- [x] `terms-of-service.html` - Terms of service page
- [x] `support.html` - Help and support page
- [ ] `google[xyz].html` - Domain verification file (get from Google)

**After pushing to GitHub, verify these URLs work:**
- https://galengrimm-code.github.io/Soil-analysis-app/privacy-policy.html
- https://galengrimm-code.github.io/Soil-analysis-app/terms-of-service.html
- https://galengrimm-code.github.io/Soil-analysis-app/support.html

---

## Google Cloud Console Steps

### 1. Access OAuth Consent Screen

1. Go to: https://console.cloud.google.com/
2. Select your project (the one with Sheets API enabled)
3. Navigate to: **APIs & Services → OAuth consent screen**

### 2. Fill Out App Information

| Field | Value |
|-------|-------|
| App name | Soil Analysis App |
| User support email | galen@galengrimm.com |
| App logo | (optional - upload if you have one) |

### 3. Fill Out App Domain

| Field | Value |
|-------|-------|
| Application home page | `https://galengrimm-code.github.io/Soil-analysis-app/` |
| Application privacy policy | `https://galengrimm-code.github.io/Soil-analysis-app/privacy-policy.html` |
| Application terms of service | `https://galengrimm-code.github.io/Soil-analysis-app/terms-of-service.html` |

### 4. Authorized Domains

Add: `galengrimm-code.github.io`

### 5. Developer Contact Information

Email: `galen@galengrimm.com`

### 6. Scopes

Add only the scope you need:
```
https://www.googleapis.com/auth/spreadsheets
```

### 7. Save and Continue

---

## Domain Verification

Google requires you to verify ownership of your domain.

1. Go to: **APIs & Services → Domain verification**
2. Click **Add domain**
3. Enter: `galengrimm-code.github.io`
4. Choose **HTML file** verification method
5. Download the verification file Google provides (e.g., `google1234567890abcdef.html`)
6. Add the file to your project root
7. Commit and push to GitHub:
   ```bash
   git add google*.html
   git commit -m "Add Google domain verification file"
   git push
   ```
8. Wait a few minutes for GitHub Pages to deploy
9. Click **Verify** in Google Console

---

## Submit for Verification

### 1. Publish the App

Go to **OAuth consent screen → Publish App**

### 2. Prepare for Verification

Click **Prepare for verification**

### 3. Justification for Sheets Scope

When asked why you need the Sheets scope, use this text:

```
Soil Analysis App helps farmers track soil sample data, field boundaries,
and crop yield information for agricultural analysis and decision-making.

The app stores all data in the user's own Google Sheet - we do not have
access to this data on any external server. Users maintain complete
ownership and control of their data.

Google Sheets access is required to:
- Save soil sample data (nutrient levels, GPS coordinates, sample dates)
- Save field boundary polygons for mapping
- Save yield data for correlation analysis with soil nutrients
- Save user settings and thresholds
- Sync data across the user's devices

All data processing happens locally in the user's browser. The app only
reads from and writes to the single Google Sheet that the user explicitly
connects to the application.

This is a free agricultural tool that helps farmers make data-driven
decisions about soil health and crop management.
```

### 4. Submit

Click Submit and wait for Google's review (typically 2-6 weeks).

---

## If Google Requests a Demo Video

Record a 2-3 minute screencast showing:

1. **App homepage** - Show the main map interface
2. **Sign-in flow** - Click Sign In, show Google OAuth popup
3. **Connect a Sheet** - Go to Settings, show entering Sheet ID
4. **Import data** - Upload a sample CSV or shapefile
5. **View on map** - Show samples displayed on the map
6. **Explain data storage** - Emphasize that data stays in user's Sheet

**Recording tools:**
- Loom (free, easy to use)
- OBS Studio (free, more control)
- Screencastify (Chrome extension)

---

## Common Rejection Reasons & Fixes

### "Privacy policy doesn't mention Google user data"

**Fix:** The privacy policy includes a dedicated section on Google Sheets access. Make sure the URL is accessible.

### "Need more justification for scope"

**Fix:** Use the detailed justification text above. Emphasize:
- Agricultural use case
- User owns their data
- No server storage
- Single Sheet access only

### "Domain not verified"

**Fix:**
1. Check that verification file is in repo root
2. Verify URL is accessible: `https://galengrimm-code.github.io/Soil-analysis-app/google[xyz].html`
3. Wait for GitHub Pages deployment (can take a few minutes)
4. Try verification again

### "App name mismatch"

**Fix:** Ensure the app name in Google Console matches exactly: "Soil Analysis App"

### "Homepage not accessible"

**Fix:** Verify `https://galengrimm-code.github.io/Soil-analysis-app/` loads correctly

---

## Post-Verification

Once verified:

1. The "unverified app" warning will no longer appear for users
2. Users can sign in without seeing security warnings
3. The app can have more than 100 users

---

## Contact

If you have questions about the verification process:
- Google's documentation: https://support.google.com/cloud/answer/9110914
- Email: galen@galengrimm.com

---

*Last updated: January 20, 2026*
