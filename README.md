# Soil Sample Analysis App

## Quick Start (Testing Locally)

### Option 1: Python (if you have Python installed)
1. Open terminal/command prompt
2. Navigate to this folder: `cd path/to/soil-app`
3. Run: `python -m http.server 8000`
4. Open browser to: `http://localhost:8000`

### Option 2: Node.js (if you have Node installed)
1. Open terminal/command prompt
2. Run: `npx serve soil-app`
3. Open the URL it shows you

### Option 3: VS Code Live Server
1. Install "Live Server" extension in VS Code
2. Open this folder in VS Code
3. Right-click `index.html` → "Open with Live Server"

## First Time Setup

1. Open the app in your browser
2. Click "Sign In with Google"
3. Sign in with your Google account
4. Allow the permissions
5. The app will automatically create headers in your Google Sheet

## Pages

- **Map** (index.html) - View samples on interactive map
- **Analysis** (analysis.html) - Trend analysis with charts
- **Import** (import.html) - Upload boundaries and samples
- **Settings** (settings.html) - Configure thresholds

## Google Cloud Console

Your project: https://console.cloud.google.com

If you need to add more authorized domains later:
1. Go to APIs & Services → Credentials
2. Click on your OAuth Client ID
3. Add new Authorized JavaScript origins

## Troubleshooting

**"Sign in" not working?**
- Make sure you added `http://localhost:8000` to Authorized JavaScript origins
- Check browser console for errors (F12)

**"Access blocked" error?**
- You need to add yourself as a test user in OAuth consent screen
- Go to: APIs & Services → OAuth consent screen → Test users → Add your email
