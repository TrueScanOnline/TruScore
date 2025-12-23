# 🚀 Deployment Next Steps

**You're logged in! Now complete the deployment:**

---

## Step 1: Deploy to Vercel

**In your PowerShell terminal, run:**

```powershell
cd backend\vercel
vercel --prod
```

**What to expect:**
- Vercel will ask some questions (project name, etc.)
- Answer the prompts
- Wait 2-5 minutes for deployment
- **Look for this line in the output:**
  ```
  ✅ Production: https://your-app-name.vercel.app
  ```
- **COPY THAT URL!** You'll need it for the next step

**After deployment completes:**
```powershell
cd ..\..
```

---

## Step 2: Update .env File

**Option A: Use the automation script (Easiest)**

After deployment, run this (replace URL with your actual deployment URL):

```powershell
.\scripts\updateEnvWithVercelUrl.ps1 -Url "https://your-app-name.vercel.app"
```

**Option B: Manual update**

1. Open `.env` file in project root
2. Add these lines:

```env
EXPO_PUBLIC_FSANZ_AU_URL=https://your-app-name.vercel.app/api/fsanz-database?country=au
EXPO_PUBLIC_FSANZ_NZ_URL=https://your-app-name.vercel.app/api/fsanz-database?country=nz
```

Replace `your-app-name` with your actual deployment URL.

---

## Step 3: Restart App

```powershell
npm start
```

---

## ✅ Verify It Worked

1. **Test API endpoint** (open in browser):
   ```
   https://your-app-name.vercel.app/api/fsanz-database?country=au
   ```
   Should return: `{}` (empty database is OK)

2. **Check app logs** when launching:
   - Should see: `✅ FSANZ NZ Database: AVAILABLE`

---

**Ready? Run `cd backend\vercel` then `vercel --prod`** 🚀




















