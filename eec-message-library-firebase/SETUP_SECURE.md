# Secure Firebase Setup Instructions

## Problem Fixed
✅ Your Firebase API key was exposed on GitHub. We've rotated it and now store secrets safely.

## Files Included

1. **firebase-config.example.js** - Template showing structure (safe to commit)
2. **firebase-config.js** - Your actual config with NEW API key (never commit this!)
3. **.gitignore** - Prevents firebase-config.js from being committed
4. **index.html** - Updated to load config before app
5. **app.js** - Updated to use config from firebase-config.js

## Setup Steps

### Step 1: Update Your GitHub Repo

1. Go to your GitHub repo: https://github.com/StaceyShulak/eec-message-library
2. Replace these files with the updated versions:
   - `index.html` (overwrite)
   - `app.js` (overwrite)
   - Add `.gitignore` (new file)
   - Add `firebase-config.example.js` (new file, shows structure)
3. **Do NOT upload** `firebase-config.js` to GitHub

### Step 2: Create Local Config File

You ONLY need `firebase-config.js` locally and in production:

1. On your computer, create a file called `firebase-config.js` in your project root
2. Copy the content from `firebase-config.js` (the file with your actual API key)
3. Save it locally (it's gitignored, so it won't be committed)
4. Test locally first before deploying

### Step 3: Deploy to Cloudflare

Since this is a static site, Cloudflare will just host the HTML/JS files as-is:

1. Commit updated files to GitHub (without firebase-config.js)
2. Cloudflare will auto-redeploy in 1-2 minutes
3. Manually add `firebase-config.js` to your deployed site via Cloudflare Pages Files editor:
   - Go to https://dash.cloudflare.com → Pages
   - Select your project
   - Go to Files tab
   - Upload `firebase-config.js` to the root directory

### Step 4: Test

1. Visit your live site: https://eec-message-library.pages.dev
2. Templates should load from Firebase
3. Try editing a template
4. Open the app on a different device → changes sync in real-time

## Security Summary

- ✅ API key rotated (old one invalidated)
- ✅ Secrets never committed to GitHub
- ✅ firebase-config.js added to .gitignore
- ✅ Clean separation: code is public, secrets are private

## Why This Matters

- **Before**: Secrets in GitHub = anyone can access your database
- **After**: Secrets only in production = secure ✓

Questions? Let me know!
