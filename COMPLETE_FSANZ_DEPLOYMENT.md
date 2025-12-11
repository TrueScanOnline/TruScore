# Complete FSANZ Database Deployment - Automated

**Date:** January 2025  
**Status:** ✅ **Ready to Execute**

---

## 🚀 Automated Deployment Script

I've created PowerShell scripts to complete the entire setup automatically!

---

## Quick Start (3 Steps)

### Step 1: Login to Vercel

```powershell
.\scripts\vercelLogin.ps1
```

**Or manually:**
```powershell
vercel login
```

This will open a browser - follow the prompts to log in.

### Step 2: Run Complete Deployment Script

```powershell
.\scripts\completeFSANZDeployment.ps1
```

**This script automatically:**
- ✅ Checks Vercel CLI installation
- ✅ Verifies login status
- ✅ Deploys to Vercel production
- ✅ Extracts deployment URL
- ✅ Updates .env file with URLs
- ✅ Verifies all files are in place

### Step 3: Restart App

```powershell
npm start
```

---

## Manual Steps (If Scripts Don't Work)

### Step 1: Login to Vercel

```powershell
vercel login
```

Follow the browser prompts to log in.

### Step 2: Deploy to Vercel

```powershell
cd backend\vercel
vercel --prod --yes
```

**Copy the deployment URL** from the output (e.g., `https://truescan-backend-abc123.vercel.app`)

### Step 3: Update .env File

Edit `.env` file and add:

```env
EXPO_PUBLIC_FSANZ_AU_URL=https://your-vercel-url.vercel.app/api/fsanz-database?country=au
EXPO_PUBLIC_FSANZ_NZ_URL=https://your-vercel-url.vercel.app/api/fsanz-database?country=nz
```

Replace `your-vercel-url` with your actual deployment URL.

### Step 4: Restart App

```powershell
npm start
```

---

## Troubleshooting

### "vercel: command not found"

Install Vercel CLI:
```powershell
npm install -g vercel
```

### "The specified token is not valid"

Run login again:
```powershell
vercel login
```

### Script Execution Policy Error

If you get an execution policy error:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then run the script again.

---

## ✅ Verification

After deployment, check:

1. **Vercel Deployment:**
   - Visit your Vercel dashboard
   - Check deployment status
   - Test API endpoint: `https://your-url.vercel.app/api/fsanz-database?country=au`

2. **Environment Variables:**
   - Check `.env` file has correct URLs
   - Restart app to load new variables

3. **App Logs:**
   - Launch app as NZ/AU user
   - Check startup logs for: `✅ FSANZ NZ Database: AVAILABLE`

---

**Ready to deploy! Run the scripts above!** 🚀












