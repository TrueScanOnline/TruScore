# Fix Root Directory - Final Solution

## The Problem
Vercel project has Root Directory set to `.\` which is invalid.

## Solution: Fix in Vercel Dashboard

### Step 1: Open Project Settings

**Go to this URL:**
```
https://vercel.com/leightons-projects-d328c774/truscore/settings
```

Or:
1. Go to: https://vercel.com/dashboard
2. Click on project: **truscore**
3. Click **Settings** tab
4. Click **General** section

### Step 2: Remove Root Directory

1. Scroll down to **"Root Directory"** section
2. **Clear/Delete the value** (should show `.\` or similar)
3. **Leave it EMPTY**
4. Click **Save**

### Step 3: Redeploy

After saving, run:

```powershell
vercel --prod
```

This time it should work! ✅

---

## Alternative: Update via CLI (Advanced)

If you prefer CLI:

```powershell
# Get project info
vercel project ls

# Note: Root directory must be removed via dashboard
# CLI doesn't have direct command to remove it
```

**Dashboard method is easier and recommended!** 🚀















