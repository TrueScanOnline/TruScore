# 🚀 START HERE - FSANZ Deployment

**Your complete step-by-step guide to deploy FSANZ databases**

---

## ✅ What's Already Done

1. ✅ All infrastructure created
2. ✅ Database JSON files created
3. ✅ Vercel backend files ready
4. ✅ API endpoint configured
5. ✅ Automation scripts prepared

---

## 📋 What YOU Need to Do (3 Steps)

### Step 1: Login to Vercel ⚠️ (Interactive - Opens Browser)

**Run this command:**

```powershell
vercel login
```

**What happens:**
- Opens browser automatically
- Log in or create free Vercel account
- Return to terminal when done
- You should see: "Success! Authentication complete"

**If you see "The specified token is not valid":**
- You're already logged in OR need to login again
- Run: `vercel logout` then `vercel login`

---

### Step 2: Deploy to Vercel

**Run these commands:**

```powershell
cd backend\vercel
vercel --prod --yes
```

**Wait 2-5 minutes for deployment.**

**Look for this line in output:**
```
✅ Production: https://your-app-name.vercel.app
```

**COPY THAT URL!** You'll need it for Step 3.

**Return to project root:**
```powershell
cd ..\..
```

---

### Step 3: Update .env File (Automated!)

**Run this command (replace URL with your actual deployment URL):**

```powershell
.\scripts\updateEnvWithVercelUrl.ps1 -Url "https://your-app-name.vercel.app"
```

**Or manually edit `.env` file:**

Add these lines:
```env
EXPO_PUBLIC_FSANZ_AU_URL=https://your-app-name.vercel.app/api/fsanz-database?country=au
EXPO_PUBLIC_FSANZ_NZ_URL=https://your-app-name.vercel.app/api/fsanz-database?country=nz
```

---

### Step 4: Restart App

```powershell
npm start
```

---

## ✅ Verify It Worked

1. **Test API:** Open in browser:
   ```
   https://your-app-name.vercel.app/api/fsanz-database?country=au
   ```
   Should return: `{}` (empty database is OK)

2. **Check App Logs:** Launch app, should see:
   ```
   ✅ FSANZ NZ Database: AVAILABLE
   ```

---

## 🎯 Quick Reference

```powershell
# Step 1: Login
vercel login

# Step 2: Deploy (copy the URL shown)
cd backend\vercel
vercel --prod --yes
cd ..\..

# Step 3: Update .env (use your URL)
.\scripts\updateEnvWithVercelUrl.ps1 -Url "https://YOUR-URL.vercel.app"

# Step 4: Restart
npm start
```

---

**Ready? Start with Step 1: `vercel login`** 🚀















