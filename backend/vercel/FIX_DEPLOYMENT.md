# Quick Fix for Root Directory Error

## Quick Solution:

**Remove the .vercel folder and redeploy:**

```powershell
# Remove incorrect configuration
Remove-Item -Recurse -Force .vercel

# Redeploy fresh
vercel --prod
```

**When asked "In which directory is your code located?"**
- Answer: `./` (dot-slash)

**When asked other questions:**
- Use lowercase project name: `truscore`
- Answer `no` to modifying settings
- Answer `no` to pulling environment variables

---

**This will fix the root directory error!** ✅












