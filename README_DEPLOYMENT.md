# Quick Deployment Guide

You've successfully logged into Vercel! ✅

## Now Do This:

### 1. Deploy to Vercel

```powershell
cd backend\vercel
vercel --prod
```

When it asks questions:
- **Set up and deploy?** → Answer **yes**
- **Project name?** → Press Enter (use default) or choose a name
- **Directory?** → Press Enter (current directory is fine)

**Wait for deployment to complete.** Look for the URL like:
```
✅ Production: https://truescan-backend-abc123.vercel.app
```

**Copy that URL!**

### 2. Return to Project Root

```powershell
cd ..\..
```

### 3. Update .env File

Run this (replace `YOUR-URL` with the URL from step 1):

```powershell
.\scripts\updateEnvWithVercelUrl.ps1 -Url "https://YOUR-URL.vercel.app"
```

### 4. Restart App

```powershell
npm start
```

---

**That's it! The FSANZ databases will now be available for NZ/AU users!** 🎉

---

**Or tell me the deployment URL and I'll update the .env file for you!**




















