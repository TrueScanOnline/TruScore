# App Store Connect Submission Setup

## Issue: Invalid App Store Connect Credentials

The `eas.json` had placeholder values that caused submission to fail.

## ✅ Fixed

- Removed invalid placeholder values from `eas.json`
- EAS will now prompt for credentials or use environment variables

## 📤 Submit iOS Build

### Option 1: Interactive Submission (Recommended)

```powershell
cd C:\TrueScan-FoodScanner; eas submit --platform ios --latest
```

This will prompt you for:
- Apple ID (if not configured)
- App Store Connect API key (if not configured)
- Or use existing credentials

### Option 2: Using Script

```powershell
cd C:\TrueScan-FoodScanner; powershell -NoProfile -ExecutionPolicy Bypass -File scripts\submitIOSInteractive.ps1
```

### Option 3: Configure Credentials First

If you want to configure credentials before submitting:

1. **Set up App Store Connect API Key**:
   - Go to: https://appstoreconnect.apple.com/access/api
   - Create an API key
   - Download the `.p8` file
   - Note the Key ID and Issuer ID

2. **Configure in EAS**:
   ```powershell
   eas credentials
   ```
   Follow the prompts to configure iOS credentials.

3. **Then submit**:
   ```powershell
   eas submit --platform ios --latest --non-interactive
   ```

## 🔑 Required Information

For App Store Connect submission, you need:

1. **Apple ID**: Your Apple Developer account email
2. **App Store Connect API Key** (recommended):
   - Key ID (10 characters)
   - Issuer ID (UUID format)
   - `.p8` private key file
3. **Or App-Specific Password** (alternative):
   - Generated from appleid.apple.com
   - Used with Apple ID

## 📋 Steps to Submit

1. **Check builds are finished**:
   ```powershell
   eas build:list --platform ios --limit 1
   ```

2. **Submit interactively** (will prompt for credentials):
   ```powershell
   eas submit --platform ios --latest
   ```

3. **Or configure credentials first, then submit**:
   ```powershell
   eas credentials
   eas submit --platform ios --latest --non-interactive
   ```

## 🔗 Resources

- **App Store Connect**: https://appstoreconnect.apple.com
- **API Keys**: https://appstoreconnect.apple.com/access/api
- **EAS Submit Docs**: https://docs.expo.dev/submit/introduction/

---

**Next Step**: Run the interactive submission command above to submit your iOS build.
