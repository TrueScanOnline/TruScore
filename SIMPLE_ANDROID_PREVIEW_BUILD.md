# 📱 Simple Guide: Build Android App Locally (Before EAS)

## 🎯 What You're Doing

Instead of using EAS (which costs build credits), you're building the app on YOUR computer first to catch errors.

**Think of it like:**
- ❌ **EAS Build** = Paying someone else to build it (uses credits)
- ✅ **Local Build** = Building it yourself for free (catches errors first)

---

## 🚀 The Simple Command

Open PowerShell in your project folder and type:

```powershell
npx expo run:android
```

**That's it!** Just one command.

---

## 📋 What Happens When You Run It

1. **Expo checks** if you have Android Studio installed
2. **Expo generates** the Android code automatically
3. **Expo builds** the app (creates an APK file)
4. **Expo installs** it on your connected phone/emulator
5. **You see errors** immediately if something is wrong

---

## ✅ Before You Start - Check These 3 Things

### 1. Do you have Android Studio?
- **Yes?** → Skip to step 2
- **No?** → Download: https://developer.android.com/studio
  - Install it (takes 10-15 minutes)
  - Open it once to set up

### 2. Do you have a phone or emulator?
- **Physical Phone:**
  - Connect phone to computer with USB cable
  - On phone: Settings → Developer Options → Enable USB Debugging
  - Allow the computer when phone asks
  
- **Emulator (Virtual Phone):**
  - Open Android Studio
  - Click "Device Manager" (top right)
  - Click "Create Device"
  - Choose a phone (like Pixel 5)
  - Click "Start" to launch it

### 3. Are you in the right folder?
- Open PowerShell
- Type: `cd C:\TrueScan-FoodScanner`
- Press Enter

---

## 🎬 Step-by-Step (Copy & Paste)

### Step 1: Open PowerShell
- Press `Windows Key + X`
- Click "Windows PowerShell" or "Terminal"

### Step 2: Go to your project
```powershell
cd C:\TrueScan-FoodScanner
```

### Step 3: Run the build command
```powershell
npx expo run:android
```

### Step 4: Wait
- First time: Takes 5-10 minutes (downloading stuff)
- After that: Takes 2-5 minutes

### Step 5: Check the result
- ✅ **Success?** App opens on your phone/emulator
- ❌ **Error?** Read the error message and fix it

---

## 🔍 What Errors Look Like

### Good (Success):
```
BUILD SUCCESSFUL
Installing APK...
Starting app...
```

### Bad (Error):
```
Error: Unable to resolve module...
```

**If you see errors:**
1. Copy the error message
2. The error tells you what's wrong
3. Fix it, then try again

---

## ❓ Common Questions

### Q: "Do I need to install anything first?"
**A:** Just Android Studio. The command installs everything else automatically.

### Q: "How long does it take?"
**A:** 
- First time: 5-10 minutes
- After that: 2-5 minutes

### Q: "What if I don't have a phone?"
**A:** Use an emulator (virtual phone) in Android Studio.

### Q: "What if it fails?"
**A:** 
- Read the error message
- It tells you what's wrong
- Fix it and try again
- This is why we test locally first!

### Q: "Do I need internet?"
**A:** Yes, for the first time (to download Android SDK). After that, no.

---

## 🎯 Why This Helps

**Before (without local build):**
1. Run EAS build → Wait 20 minutes → Fails → Use up build credit → Fix → Try again → Wait 20 minutes...

**After (with local build):**
1. Run local build → Wait 2 minutes → See error → Fix → Try again → Wait 2 minutes → Success!
2. **Then** run EAS build → Success! (because you already fixed everything)

---

## ✅ Success Checklist

You'll know it worked when:
- ✅ Command finishes without errors
- ✅ App appears on your phone/emulator
- ✅ App opens and works
- ✅ No red error messages

**Then you're ready for EAS build!**

---

## 🚀 After Local Build Succeeds

Once your local build works, you can confidently run:

```powershell
eas build --platform android --profile preview
```

**It should work because you already fixed all the errors locally!**

---

## 💡 Remember

- **Local build = Free testing on your computer**
- **EAS build = Cloud build (uses credits)**
- **Test locally first, then use EAS when ready!**

---

## 🆘 Still Confused?

**Just run this one command:**
```powershell
npx expo run:android
```

**If it works:** Great! You're ready for EAS.

**If it fails:** The error message will tell you what to fix.

