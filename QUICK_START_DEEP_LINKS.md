# Quick Start: Deep Links Setup (Fully Automated)

## ✅ What's Already Done

I've automatically created all the necessary files:

1. ✅ iOS Universal Links API route
2. ✅ Android App Links API route  
3. ✅ Barcode redirect page
4. ✅ Vercel configuration updated

## 🚀 Deploy Now (One Command)

From PowerShell, run:

```powershell
cd backend\vercel
vercel --prod
```

That's it! The deep links will be live on your Vercel deployment URL.

## 📋 What Happens Next

After deployment:

1. **Your deep links will work at:**
   - `https://YOUR-VERCEL-URL.vercel.app/.well-known/apple-app-site-association`
   - `https://YOUR-VERCEL-URL.vercel.app/.well-known/assetlinks.json`
   - `https://YOUR-VERCEL-URL.vercel.app/barcode/{barcode}`

2. **To use `truescan.app` domain:**
   - Go to Vercel Dashboard → Your Project → Settings → Domains
   - Add `truescan.app`
   - Update DNS as instructed
   - Wait 5-15 minutes for DNS propagation

3. **Optional: Set environment variables** (for full functionality):
   ```powershell
   # Run the interactive setup script
   powershell -ExecutionPolicy Bypass -File scripts\setupDeepLinks.ps1
   ```

## 🎯 That's It!

The deep links are ready to deploy. Just run `vercel --prod` and you're done!

No manual file editing, no complex configuration - everything is automated. 🎉
