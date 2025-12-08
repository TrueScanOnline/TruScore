# Android Device Authorization - Complete Troubleshooting Guide

## Problem: Device Shows "unauthorized" and No Popup Appears

This happens when:
- Authorization was previously denied
- USB connection isn't triggering the prompt
- Phone needs to be unlocked
- USB mode is set incorrectly

---

## ✅ Complete Fix Procedure

### Step 1: On Your Android Phone

**A. Unlock Your Phone**
- ⚠️ **CRITICAL:** Phone must be UNLOCKED when connecting
- Some phones won't show popup if locked

**B. Revoke Previous Authorizations**
1. **Settings** → **Developer Options**
2. Scroll down to **"Revoke USB debugging authorizations"**
3. **Tap it** and confirm
4. This clears all previous authorizations

**C. Verify USB Debugging Settings**
Make sure these are **ENABLED**:
- ✅ **USB debugging**
- ✅ **USB debugging (Security settings)** - if available on your phone

**D. Check USB Connection Mode**
1. When you plug in USB, **pull down notification panel**
2. Look for **"USB"** or **"Charging this device via USB"**
3. **Tap it**
4. Select **"File Transfer"** or **"MTP"**
   - ❌ NOT "Charging only"
   - ❌ NOT "PTP"

**E. Disconnect and Reconnect**
1. **Unplug** USB cable
2. **Wait 5 seconds**
3. **Plug back in**
4. **Keep phone unlocked**
5. **Look for popup** immediately

---

### Step 2: In PowerShell

**Run the complete fix script:**
```powershell
.\FIX_UNAUTHORIZED_DEVICE_COMPLETE.ps1
```

**Or manually:**
```powershell
# Restart ADB
adb kill-server
adb start-server

# Check status
adb devices
```

---

## 🔧 Advanced Troubleshooting

### If Still No Popup After Above Steps:

#### Option 1: Toggle USB Debugging
**On phone:**
1. Settings → Developer Options
2. **Disable** "USB debugging"
3. **Wait 5 seconds**
4. **Enable** "USB debugging" again
5. Unplug and replug USB

#### Option 2: Restart Phone
1. Restart your Android phone
2. After restart, connect USB
3. Popup should appear

#### Option 3: Try Different USB Cable
- Some USB cables are **charging-only** (no data)
- Try a different cable
- Use the cable that came with your phone if possible

#### Option 4: Try Different USB Port
- Try a different USB port on your computer
- Prefer USB 2.0 ports (not USB 3.0) if available
- Avoid USB hubs - connect directly to computer

#### Option 5: Check Phone Lock Screen
- Some phones require the phone to be **unlocked** when first connecting
- Keep phone unlocked when plugging in USB

#### Option 6: Install/Update USB Drivers
**For Windows:**
1. Download **Samsung USB Driver** (if Samsung phone)
2. Or **Google USB Driver** from Android SDK
3. Install drivers
4. Restart computer
5. Try again

**Check if drivers are installed:**
```powershell
# In Device Manager (devmgmt.msc)
# Look for your phone under "Portable Devices" or "Android Phone"
# Should NOT have yellow warning icon
```

---

## 📱 Alternative: Wireless Debugging (Android 11+)

If USB continues to be problematic, use wireless debugging:

### On Your Phone:
1. **Settings** → **Developer Options**
2. Enable **"Wireless debugging"**
3. Tap **"Wireless debugging"**
4. Tap **"Pair device with pairing code"**
5. Note the **IP address** and **port** (e.g., `192.168.1.100:12345`)
6. Note the **pairing code** (6 digits)

### In PowerShell:
```powershell
# Pair with code
adb pair <IP>:<PORT>
# Enter the 6-digit pairing code when prompted

# Connect
adb connect <IP>:<PORT>

# Verify
adb devices
```

**Example:**
```powershell
adb pair 192.168.1.100:12345
# Enter code: 123456
adb connect 192.168.1.100:12345
adb devices
```

---

## ✅ Success Indicators

**When it's working:**
```powershell
adb devices
# Should show:
# List of devices attached
# RZ8WB0399JY     device
```

**Key:** Should say `device` (not `unauthorized` or `offline`)

---

## 🚀 Next Steps After Authorization

Once authorized, you can build:
```powershell
npx expo run:android
```

---

## 📋 Checklist

Before running `npx expo run:android`, verify:
- [ ] Phone is **unlocked**
- [ ] **USB debugging** is enabled
- [ ] USB mode is **"File Transfer"** or **"MTP"**
- [ ] `adb devices` shows `device` (not `unauthorized`)
- [ ] Phone and computer are on same network (if using wireless)

---

## 💡 Pro Tips

1. **Always unlock phone** when first connecting
2. **Use original USB cable** if possible
3. **Revoke authorizations** if switching computers
4. **Keep phone unlocked** during first connection
5. **Check notification panel** for USB mode selection

---

**Most Common Issue:** Phone needs to be **unlocked** when connecting USB for the first time!
