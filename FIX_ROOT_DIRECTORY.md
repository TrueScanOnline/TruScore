# Fix Root Directory Error

## Problem
Vercel is using `.\` as the root directory, which doesn't exist.

## Solution

You have two options:

---

### Option 1: Remove Root Directory Setting (Recommended)

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/leightons-projects-d328c774/truscore/settings
   - Or: https://vercel.com/dashboard
   - Click on your project: **truscore**

2. **Go to Settings → General**

3. **Find "Root Directory"**
   - Change it to: **(empty)** or `.`
   - Or remove the root directory setting entirely

4. **Save settings**

5. **Redeploy:**
   ```powershell
   vercel --prod
   ```

---

### Option 2: Redeploy with Correct Settings (Easier)

**Delete the .vercel folder and redeploy:**

```powershell
# Remove the incorrect configuration
Remove-Item -Recurse -Force .vercel

# Redeploy fresh
vercel --prod
```

**When asked "In which directory is your code located?"**
- Answer: `./` (just dot-slash, not `.\`)

---

### Option 3: Quick Fix via Command Line

```powershell
# Update project settings
vercel project ls
# Then remove root directory via dashboard

# Or redeploy fresh:
Remove-Item -Recurse -Force .vercel
vercel --prod
```

---

**I recommend Option 2 - it's the quickest!** 🚀










