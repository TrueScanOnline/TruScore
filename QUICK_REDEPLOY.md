# Quick Redeploy - All Steps

## Complete Command Sequence

```powershell
# 1. Navigate to backend
cd C:\TrueScan-FoodScanner\backend\vercel

# 2. Remove old config (if exists)
Remove-Item -Recurse -Force .vercel -ErrorAction SilentlyContinue

# 3. Deploy
vercel --prod
```

## Answer These Questions:

1. **Set up and deploy?** → `yes`
2. **Which scope?** → `Leighton's projects`
3. **Link to existing project?** → `no`
4. **Project name?** → `truscore` (lowercase!)
5. **Code directory?** → `./` (dot-slash)
6. **Modify settings?** → `no`
7. **Change additional settings?** → `no`
8. **Pull environment variables?** → `no`

## After Deployment:

```powershell
# Return to project root
cd ..\..

# Update .env (replace YOUR-URL with actual URL)
.\scripts\updateEnvWithVercelUrl.ps1 -Url "https://YOUR-URL.vercel.app"

# Restart app
npm start
```

**That's it!** 🚀















