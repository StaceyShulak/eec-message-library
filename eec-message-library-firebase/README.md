# Outreach Message Library — Firebase + Cloudflare

Simple, cross-device message library that syncs across all your devices in real-time using Firebase and Cloudflare Pages.

## Setup (10 minutes total)

### Step 1: Create Firebase Project (2 minutes)

1. Go to **https://firebase.google.com**
2. Click **Get Started** → **Create Project**
3. Name it: `eec-message-library`
4. Click through (disable Google Analytics is fine)
5. Once created, go to **Build** → **Realtime Database**
6. Click **Create Database**
7. Choose **Start in test mode** (for now)
8. Click **Create**

### Step 2: Get Firebase Config (2 minutes)

1. In Firebase console, click the gear icon (Settings)
2. Go to **Project Settings**
3. Scroll to **Your apps** section
4. Click **Web** icon (or create if needed)
5. Copy your config object that looks like:

```
{
  apiKey: "...",
  authDomain: "...",
  databaseURL: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
}
```

6. Open `app.js` in this folder
7. Replace `REPLACE_WITH_...` values with your actual config
8. Save the file

### Step 3: Deploy to Cloudflare (3 minutes)

1. Commit changes to GitHub (this folder)
2. Go to **https://dash.cloudflare.com**
3. Go to **Pages**
4. Click **Create Project** → **Connect Git**
5. Select your repo
6. Set **Build output directory**: `./` (current folder)
7. Leave build command blank
8. Click **Deploy**

Wait 1-2 minutes for deployment. Your site is live at `https://your-project.pages.dev`

### Step 4: Set Edit Passcode (1 minute)

The app asks for a passcode when saving. Set it:

1. Open your live site
2. Try to edit something
3. It prompts for passcode — enter what you want
4. It saves to localStorage on your device

To change it later, edit the prompt in `app.js` or clear browser data.

## Done!

- Edit and sync templates across devices
- No backend complexity, no build issues
- Firebase Realtime Database handles sync
- Deployed on Cloudflare Pages
- Free tier covers everything

## Notes

- Templates auto-sync when changes are made
- Edit passcode is stored in your browser
- All data stored in Firebase (not your device)
- Security rules are in "test mode" — if you go live, restrict access via Firebase console
