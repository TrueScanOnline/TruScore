# How to Open TrueScan Project & Add .env File

## 📂 Step 1: Open TrueScan Project in VSCode

### Option A: From VSCode (Recommended)
1. **Open VSCode**
2. Click **File** → **Open Folder** (or press `Ctrl+K` then `Ctrl+O`)
3. Navigate to: `C:\TrueScan-FoodScanner`
4. Click **Select Folder**

### Option B: From Windows File Explorer
1. Open **File Explorer** (Windows key + E)
2. Navigate to: `C:\TrueScan-FoodScanner`
3. **Right-click** on the `TrueScan-FoodScanner` folder
4. Select **"Open with Code"** (if you have it installed)
   - OR drag the folder into VSCode window

### Option C: From Terminal/Command Line
1. Open **PowerShell** or **Command Prompt**
2. Type:
   ```powershell
   cd C:\TrueScan-FoodScanner
   code .
   ```
3. Press **Enter**

---

## ✅ Verify You're in the Right Project

Once VSCode opens, check the **Explorer** panel (left side):

You should see files like:
- ✅ `app/` folder
- ✅ `src/` folder
- ✅ `package.json` (should say "truescan-food-scanner")
- ✅ `app.config.js`
- ✅ `tsconfig.json`

**❌ If you see:** `crypto-pal-safety-sep16` or different files → You're in the wrong folder!

---

## 📝 Step 2: Create the .env File

### Method 1: Using VSCode (Easiest)

1. **In VSCode Explorer panel** (left side), **right-click** on the `TrueScan-FoodScanner` folder
   - (Make sure you right-click on the **root folder**, not a subfolder)
   
2. Click **"New File"**

3. Type: `.env` (include the dot at the beginning!)

4. Press **Enter**

5. **Paste this content** into the file:
   ```env
   # Qonversion Project Key (used by mobile SDK)
   # Get from: https://dashboard.qonversion.io/settings
   EXPO_PUBLIC_QONVERSION_PROJECT_KEY=Bdh8Y7krabWxjf_alA0bSRUlHn8W3W0_
   
   # Note: Secret Key is for server-side use only (webhooks, backend API)
   # Do NOT put the Secret Key in the mobile app!
   ```

6. **Save the file**: `Ctrl+S` or File → Save

---

### Method 2: Using Windows File Explorer

1. Open **File Explorer**
2. Navigate to: `C:\TrueScan-FoodScanner`
3. **Right-click** in an empty area → **New** → **Text Document**
4. Name it: `.env` (include the dot!)
   - ⚠️ **Important**: You might get a warning "You must type a filename". Click **Yes**
5. **Right-click** the `.env` file → **Open with** → **Notepad** (or VSCode)
6. **Paste this content**:
   ```env
   # Qonversion Project Key (used by mobile SDK)
   # Get from: https://dashboard.qonversion.io/settings
   EXPO_PUBLIC_QONVERSION_PROJECT_KEY=Bdh8Y7krabWxjf_alA0bSRUlHn8W3W0_
   
   # Note: Secret Key is for server-side use only (webhooks, backend API)
   # Do NOT put the Secret Key in the mobile app!
   ```
7. **Save** and **Close**

---

### Method 3: Using PowerShell (Fastest)

1. Open **PowerShell**
2. Type these commands:
   ```powershell
   cd C:\TrueScan-FoodScanner
   
   @"
   # Qonversion Project Key (used by mobile SDK)
   # Get from: https://dashboard.qonversion.io/settings
   EXPO_PUBLIC_QONVERSION_PROJECT_KEY=Bdh8Y7krabWxjf_alA0bSRUlHn8W3W0_
   
   # Note: Secret Key is for server-side use only (webhooks, backend API)
   # Do NOT put the Secret Key in the mobile app!
   "@ | Out-File -FilePath .env -Encoding utf8
   ```

3. Press **Enter**

---

## ✅ Verify .env File Was Created

1. **In VSCode Explorer panel**, you should now see:
   - ✅ `.env` file in the root folder (`TrueScan-FoodScanner`)

2. **Click on `.env`** to open it and verify the content is correct

---

## 🔄 Step 3: Restart Your Dev Server

After creating the `.env` file:

1. **Stop** your current Expo dev server (if running)
   - Press `Ctrl+C` in the terminal

2. **Restart** the dev server:
   ```powershell
   yarn start
   ```
   or
   ```powershell
   npm start
   ```

3. The app will now use the Qonversion Project Key from the `.env` file!

---

## 🎯 Quick Visual Guide

```
VSCode Explorer Panel (Left Side)
├── 📁 TrueScan-FoodScanner  ← Right-click here
│   ├── 📁 app
│   ├── 📁 src
│   ├── 📄 package.json
│   ├── 📄 app.config.js
│   ├── 📄 tsconfig.json
│   └── 📄 .env  ← This should appear here after creation!
```

---

## ⚠️ Troubleshooting

### Problem: Can't see .env file in VSCode
**Solution:**
- VSCode might hide dot-files by default
- Press `Ctrl+Shift+P` → Type "files.exclude" → Check settings
- OR click the **"..." menu** in Explorer → **Show Hidden Files**

### Problem: File is named `.env.txt` instead of `.env`
**Solution:**
1. Rename the file to `.env` (without `.txt`)
2. Windows might ask "Are you sure you want to change the extension?" → Click **Yes**

### Problem: Wrong folder open in VSCode
**Solution:**
- Look at the **folder name** in the VSCode title bar
- Should say: `[folder name] - Visual Studio Code`
- If it says `crypto-pal-safety-sep16`, close VSCode and follow Step 1 again

### Problem: .env file not being read
**Solution:**
- Make sure `.env` is in the **root folder** (`C:\TrueScan-FoodScanner\`)
- **Not** in a subfolder like `app/` or `src/`
- Restart your dev server after creating `.env`

---

## ✅ Final Check

Your `.env` file should:
- ✅ Be located at: `C:\TrueScan-FoodScanner\.env`
- ✅ Contain: `EXPO_PUBLIC_QONVERSION_PROJECT_KEY=Bdh8Y7krabWxjf_alA0bSRUlHn8W3W0_`
- ✅ Be visible in VSCode Explorer panel
- ✅ Not be named `.env.txt` or `.env.bak`

---

**That's it! Your app is now configured with the Qonversion Project Key!** 🎉

