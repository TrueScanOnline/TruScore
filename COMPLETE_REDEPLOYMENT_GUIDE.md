# Complete Redeployment Guide - Start Fresh

**Starting from scratch after deleting the project**

---

## Step-by-Step Deployment

### Step 1: Navigate to Backend Directory

```powershell
cd C:\TrueScan-FoodScanner\backend\vercel
```

---

### Step 2: Remove Old Configuration (If Exists)

```powershell
Remove-Item -Recurse -Force .vercel -ErrorAction SilentlyContinue
```

---

### Step 3: Deploy to Vercel

```powershell
vercel --prod
```

---

### Step 4: Answer the Questions

Follow these answers **EXACTLY**:

#### Question 1: "Set up and deploy?"
```
Answer: yes
```

#### Question 2: "Which scope should contain your project?"
```
Answer: Leighton's projects
(Or choose your scope)
```

#### Question 3: "Link to existing project?"
```
Answer: no
```

#### Question 4: "What's your project's name?"
```
Answer: truscore
(Or any LOWERCASE name: truescan-backend, truescan-api, etc.)
```

#### Question 5: "In which directory is your code located?"
```
Answer: ./
(Just type: dot-slash, nothing else!)
```

#### Question 6: "Want to modify these settings?"
```
Answer: no
```

#### Question 7: "Do you want to change additional project settings?"
```
Answer: no
```

#### Question 8: "Would you like to pull environment variables now?"
```
Answer: no
```

---

### Step 5: Wait for Deployment

Vercel will:
- Build and deploy your backend
- Show progress
- Provide deployment URL

**Look for this line:**
```
✅ Production: https://truscore-xxxxx.vercel.app
```

**COPY THAT URL!** You'll need it for the next step.

---

### Step 6: Return to Project Root

```powershell
cd ..\..
```

You should now be in: `C:\TrueScan-FoodScanner`

---

### Step 7: Update .env File

**Option A: Use automation script (Recommended)**

Replace `YOUR-URL` with the deployment URL from Step 5:

```powershell
.\scripts\updateEnvWithVercelUrl.ps1 -Url "https://YOUR-URL.vercel.app"
```

**Option B: Manual update**

1. Open `.env` file in project root
2. Add these lines:

```env
# FSANZ Database URLs
EXPO_PUBLIC_FSANZ_AU_URL=https://YOUR-URL.vercel.app/api/fsanz-database?country=au
EXPO_PUBLIC_FSANZ_NZ_URL=https://YOUR-URL.vercel.app/api/fsanz-database?country=nz
```

Replace `YOUR-URL` with your actual deployment URL.

---

### Step 8: Restart Development Server

```powershell
npm start
```

---

## ✅ Verify It Worked

### 1. Test API Endpoint

Open in browser:
```
https://YOUR-URL.vercel.app/api/fsanz-database?country=au
```

**Expected:** Returns `{}` (empty database is OK)

### 2. Check App Logs

Launch app as NZ or AU user, check logs:

**Should see:**
```
✅ FSANZ NZ Database: AVAILABLE
   Products: 0
   Status: Ready for queries
```

---

## 📋 Quick Command Summary

```powershell
# Step 1: Navigate
cd C:\TrueScan-FoodScanner\backend\vercel

# Step 2: Remove old config (if exists)
Remove-Item -Recurse -Force .vercel -ErrorAction SilentlyContinue

# Step 3: Deploy
vercel --prod
# Answer questions (see guide above)

# Step 4: Return to root
cd ..\..

# Step 5: Update .env (replace URL)
.\scripts\updateEnvWithVercelUrl.ps1 -Url "https://YOUR-URL.vercel.app"

# Step 6: Restart app
npm start
```

---

## 🎯 Key Points to Remember

1. ✅ **Project name must be LOWERCASE** (e.g., `truscore`)
2. ✅ **Code directory: `./`** (just dot-slash)
3. ✅ **Answer `no` to modifying settings**
4. ✅ **Answer `no` to pulling environment variables**
5. ✅ **Copy the deployment URL** when shown

---

**Ready? Start with Step 1!** 🚀












