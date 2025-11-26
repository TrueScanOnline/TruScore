# Install Cloudflare Tunnel on Windows - Manual Setup

## 🎯 Quick Installation (No Chocolatey Needed)

### Step 1: Download Cloudflare Tunnel

**Direct Download Link:**
- Go to: https://github.com/cloudflare/cloudflared/releases/latest
- Download: `cloudflared-windows-amd64.exe` (or `cloudflared-windows-386.exe` for 32-bit)

**OR use this direct link (latest version):**
- https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe

### Step 2: Install It

**Option A: Quick Install (Easiest)**

1. **Download the file** from the link above
2. **Rename it** to `cloudflared.exe`
3. **Move it** to your project folder (or any folder you remember)
4. **Use it directly:**
   ```powershell
   .\cloudflared.exe tunnel --url http://localhost:8081
   ```

**Option B: Add to PATH (Better for Daily Use)**

1. **Download** `cloudflared-windows-amd64.exe`
2. **Create folder:** `C:\cloudflared`
3. **Move file** there and rename to `cloudflared.exe`
4. **Add to PATH:**
   - Press `Win + X`, select "System"
   - Click "Advanced system settings"
   - Click "Environment Variables"
   - Under "System variables", find "Path", click "Edit"
   - Click "New"
   - Add: `C:\cloudflared`
   - Click OK on all windows
   - **Restart PowerShell**

5. **Test it:**
   ```powershell
   cloudflared --version
   ```

---

## 🚀 Quick Test

After installing, test it works:

```powershell
cloudflared --version
```

You should see something like:
```
cloudflared version 2024.x.x
```

---

## ✅ Ready to Use!

Once installed, you can use it:

**Terminal 1:**
```powershell
npx expo start
```

**Terminal 2:**
```powershell
cloudflared tunnel --url http://localhost:8081
```

---

## 📝 Alternative: Download Without Browser

If you want to download directly from PowerShell:

```powershell
# Download latest version
Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile "cloudflared.exe"

# Move to your project folder or create a folder
New-Item -ItemType Directory -Force -Path "C:\cloudflared"
Move-Item -Path "cloudflared.exe" -Destination "C:\cloudflared\cloudflared.exe"

# Test it works
C:\cloudflared\cloudflared.exe --version
```

Then use it:
```powershell
C:\cloudflared\cloudflared.exe tunnel --url http://localhost:8081
```

---

## 🎯 Recommended: Simple Setup Script

I'll create a script that downloads and sets it up for you automatically!




