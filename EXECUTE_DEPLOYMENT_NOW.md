# Execute FSANZ Deployment - Step by Step

**Date:** January 2025  
**Status:** Ready to Execute

---

## 🚀 Complete Setup - Follow These Steps

I'll guide you through each step. Let's do this!

---

## Step 1: Login to Vercel

**Run this command:**

```powershell
vercel login
```

**What happens:**
- Opens a browser window
- Follow the prompts to log in or create a Vercel account
- Return to terminal when done

**If already logged in, skip to Step 2.**

---

## Step 2: Deploy to Vercel

**Navigate to backend directory and deploy:**

```powershell
cd backend\vercel
vercel --prod --yes
```

**Wait for deployment to complete.** It will show:
- Deployment URL (e.g., `https://truescan-backend-abc123.vercel.app`)
- Copy this URL - you'll need it for Step 3

**After deployment completes, return to project root:**

```powershell
cd ..\..
```

---

## Step 3: Update .env File

I've created a script to automatically update the .env file!

**Run this command (replace URL with your actual deployment URL):**

```powershell
.\scripts\updateEnvWithVercelUrl.ps1 -Url "https://your-vercel-url.vercel.app"
```

**Or manually edit `.env` file:**

Add these lines:
```env
EXPO_PUBLIC_FSANZ_AU_URL=https://your-vercel-url.vercel.app/api/fsanz-database?country=au
EXPO_PUBLIC_FSANZ_NZ_URL=https://your-vercel-url.vercel.app/api/fsanz-database?country=nz
```

Replace `your-vercel-url` with your actual deployment URL from Step 2.

---

## Step 4: Restart App

**Restart your development server:**

```powershell
npm start
```

---

## ✅ Verification

After restarting:

1. **Launch app** as NZ or AU user
2. **Check startup logs** - should show:
   ```
   ✅ FSANZ NZ Database: AVAILABLE
      Products: 0
      Status: Ready for queries
   ```

3. **Test API endpoint** (in browser):
   ```
   https://your-vercel-url.vercel.app/api/fsanz-database?country=au
   ```
   Should return JSON (even if empty: `{}`)

---

## 📋 Quick Command Summary

```powershell
# Step 1: Login
vercel login

# Step 2: Deploy
cd backend\vercel
vercel --prod --yes
cd ..\..

# Step 3: Update .env (replace URL)
.\scripts\updateEnvWithVercelUrl.ps1 -Url "https://your-url.vercel.app"

# Step 4: Restart
npm start
```

---

## 🎉 Done!

That's it! The FSANZ database system is now fully deployed and configured!

---

**Ready to start? Begin with Step 1!** 🚀

















