# Authorize Android Device for Development

## Issue: Device Shows "unauthorized"

Your Android device is connected but not yet authorized for USB debugging.

---

## ✅ Quick Fix Steps

### Step 1: Check Your Phone Screen

**Look for a popup on your phone** that says:
- "Allow USB debugging?"
- "The computer's RSA key fingerprint is: ..."
- Options: **"Allow"** or **"Cancel"**

**If you see this popup:**
1. ✅ Check the box: **"Always allow from this computer"**
2. ✅ Tap **"Allow"**

**If you DON'T see a popup:**
- The popup might have been dismissed
- Try unplugging and replugging the USB cable
- Or revoke USB debugging authorizations and start fresh (see Step 2)

---

### Step 2: Revoke and Re-authorize (If Needed)

**On your Android phone:**

1. **Settings** → **Developer Options**
2. Scroll down to **"Revoke USB debugging authorizations"**
3. Tap it and confirm
4. **Unplug** the USB cable
5. **Plug it back in**
6. You should see the authorization popup again
7. Check **"Always allow from this computer"**
8. Tap **"Allow"**

---

### Step 3: Verify Authorization

**In PowerShell:**
```powershell
adb devices
```

**You should see:**
```
List of devices attached
RZ8WB0399JY     device
```

**Note:** It should say `device` (not `unauthorized`)

---

### Step 4: Build and Install

**Once authorized, run:**
```powershell
npx expo run:android
```

---

## 🔍 Troubleshooting

### Still Shows "unauthorized"?

1. **Check USB connection:**
   - Try a different USB cable
   - Try a different USB port
   - Make sure it's a data cable (not just charging)

2. **Restart ADB:**
   ```powershell
   adb kill-server
   adb start-server
   adb devices
   ```

3. **Check Developer Options:**
   - Settings → Developer Options
   - Make sure **"USB debugging"** is enabled
   - Try enabling **"USB debugging (Security settings)"** if available

4. **Check USB Mode:**
   - When you plug in, check notification on phone
   - Make sure USB mode is set to **"File Transfer"** or **"MTP"**
   - Not "Charging only"

---

## 📱 Alternative: Wireless Debugging (Android 11+)

If USB is problematic, you can use wireless debugging:

**On your phone:**
1. Settings → Developer Options
2. Enable **"Wireless debugging"**
3. Tap **"Wireless debugging"** → **"Pair device with pairing code"**
4. Note the IP address and port (e.g., `192.168.1.100:12345`)

**In PowerShell:**
```powershell
adb pair <IP>:<PORT>
# Enter the pairing code when prompted
adb connect <IP>:<PORT>
adb devices
```

---

## ✅ Success Indicators

**When it's working:**
- `adb devices` shows `device` (not `unauthorized`)
- `npx expo run:android` starts building
- No authorization errors

---

**Next Step:** Once authorized, proceed with `npx expo run:android`
