# FSANZ Deployment Guide - Complete Instructions

**Date:** January 2025  
**Purpose:** Complete step-by-step guide to deploy FSANZ databases

---

## ⚠️ Important: Vercel Login Required

The first step requires you to log in to Vercel. This opens a browser and requires your interaction.

---

## Step-by-Step Instructions

### Step 1: Login to Vercel (Interactive - You Need to Do This)

**Run this command in PowerShell:**

```powershell
vercel login
```

**What happens:**
1. Opens your default browser
2. Shows Vercel login page
3. **Either:**
   - Log in with your existing Vercel account
   - Or create a new account (free)
4. After logging in, browser shows "Login successful"
5. Return to PowerShell terminal
6. You should see confirmation

**If you get "The specified token is not valid":**
- Run `vercel login` again
- Make sure you complete the browser login

**Once logged in, proceed to Step 2.**

---

### Step 2: Deploy to Vercel

**Run these commands:**

```powershell
cd backend\vercel
vercel --prod --yes
```

**What happens:**
- Vercel will deploy your backend
- This may take 2-5 minutes
- Shows progress and deployment URL
- Look for line like: `🔗  https://truescan-backend-abc123.vercel.app`

**IMPORTANT:** Copy the deployment URL shown! You'll need it for Step 3.

**Example output:**
```
✅ Production: https://truescan-backend-abc123.vercel.app
```

**After deployment completes, return to project root:**

```powershell
cd ..\..
```

---

### Step 3: Update .env File

**Option A: Use the automation script (Recommended)**

Replace `YOUR-DEPLOYMENT-URL` with the URL from Step 2:

```powershell
.\scripts\updateEnvWithVercelUrl.ps1 -Url "https://YOUR-DEPLOYMENT-URL.vercel.app"
```

**Option B: Manual update**

1. Open `.env` file in project root
2. Add these lines (replace URL with your deployment URL):

```env
# FSANZ Database URLs
EXPO_PUBLIC_FSANZ_AU_URL=https://YOUR-DEPLOYMENT-URL.vercel.app/api/fsanz-database?country=au
EXPO_PUBLIC_FSANZ_NZ_URL=https://YOUR-DEPLOYMENT-URL.vercel.app/api/fsanz-database?country=nz
```

---

### Step 4: Restart Development Server

**Stop current server (if running):**
- Press `Ctrl+C` in terminal

**Start fresh:**
```powershell
npm start
```

---

## ✅ Verification

### 1. Test API Endpoint

Open in browser:
```
https://YOUR-DEPLOYMENT-URL.vercel.app/api/fsanz-database?country=au
```

**Expected result:**
- Returns JSON: `{}` (empty database is OK)
- Or returns error page if not deployed correctly

### 2. Check App Logs

Launch app as NZ or AU user, check logs:

**Should see:**
```
✅ FSANZ NZ Database: AVAILABLE
   Products: 0
   Status: Ready for queries
```

### 3. Test Product Scan

- Scan a product
- Check logs for FSANZ queries
- Should see: `🔍 Trying FSANZ NZ Database...`

---

## 🐛 Troubleshooting

### "vercel: command not found"

**Install Vercel CLI:**
```powershell
npm install -g vercel
```

### "The specified token is not valid"

**Log in again:**
```powershell
vercel login
```

### Script Execution Policy Error

**Allow script execution:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Deployment Fails

**Check:**
1. Are you logged in? (`vercel whoami`)
2. Do files exist in `backend/vercel/data/`?
3. Check Vercel dashboard for errors

### API Returns 404

**Check:**
1. Is deployment URL correct in `.env`?
2. Did you restart the app after updating `.env`?
3. Are JSON files in `backend/vercel/data/`?

---

## 📋 Complete Command Sequence

Here's everything in order:

```powershell
# Step 1: Login (interactive - opens browser)
vercel login

# Step 2: Deploy
cd backend\vercel
vercel --prod --yes
# Copy the deployment URL shown
cd ..\..

# Step 3: Update .env (replace URL with your actual URL)
.\scripts\updateEnvWithVercelUrl.ps1 -Url "https://your-actual-url.vercel.app"

# Step 4: Restart app
npm start
```

---

## 🎯 Current Status

- ✅ All infrastructure created
- ✅ Database files ready
- ✅ Vercel API endpoint ready
- ⏳ Needs: Vercel login (your action)
- ⏳ Needs: Deployment (run command)
- ⏳ Needs: .env update (automated or manual)

**Total time: ~5-10 minutes**

---

**Ready to start? Begin with `vercel login`!** 🚀















