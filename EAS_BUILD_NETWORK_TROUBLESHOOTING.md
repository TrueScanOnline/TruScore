# EAS Build Network Troubleshooting Guide

## Issue: Upload Failed - DNS Resolution Error

**Error:** `getaddrinfo ENOTFOUND storage.googleapis.com`

This indicates a network connectivity issue preventing the build from uploading to Google Cloud Storage.

---

## Solutions

### Solution 1: Retry the Build (Most Common Fix)

DNS issues are often temporary. Simply retry the build:

```powershell
cd C:\TrueScan-FoodScanner
eas build -p ios --profile production
```

**Why this works:** DNS resolution failures are often transient network issues.

---

### Solution 2: Check Network Connectivity

Test if you can reach Google Cloud Storage:

```powershell
# Test DNS resolution
nslookup storage.googleapis.com

# Test connectivity
ping storage.googleapis.com
```

**If these fail:**
- Check your internet connection
- Check if you're behind a corporate firewall/proxy
- Try a different network (mobile hotspot, different WiFi)

---

### Solution 3: Reduce Archive Size

The archive is **719 MB**, which is very large. I've created a `.easignore` file to exclude unnecessary files.

**Files now excluded:**
- Documentation files (*.md)
- Database files (Database files/, *.xlsx, *.tsv, *.FT)
- Test files and test builds
- Scripts directory
- Backend files
- Large data files

**Expected reduction:** Archive should be **< 100 MB** after exclusions.

**Next steps:**
1. The `.easignore` file is now in place
2. Retry the build - it will use the smaller archive
3. Upload should be faster and more reliable

---

### Solution 4: Check Firewall/Proxy Settings

If you're behind a corporate firewall or proxy:

1. **Check if proxy is required:**
   ```powershell
   # Check proxy settings
   netsh winhttp show proxy
   ```

2. **Configure npm to use proxy (if needed):**
   ```powershell
   npm config set proxy http://proxy.company.com:8080
   npm config set https-proxy http://proxy.company.com:8080
   ```

3. **Or use environment variables:**
   ```powershell
   $env:HTTP_PROXY="http://proxy.company.com:8080"
   $env:HTTPS_PROXY="http://proxy.company.com:8080"
   ```

---

### Solution 5: Use Different DNS Servers

If DNS resolution is consistently failing:

1. **Change DNS servers to Google DNS:**
   - Open Network Settings
   - Change DNS to: `8.8.8.8` and `8.8.4.4`

2. **Or use Cloudflare DNS:**
   - DNS: `1.1.1.1` and `1.0.0.1`

---

### Solution 6: Flush DNS Cache

Clear your DNS cache and retry:

```powershell
# Flush DNS cache
ipconfig /flushdns

# Retry build
eas build -p ios --profile production
```

---

## Recommended Action Plan

1. ✅ **`.easignore` file created** - Archive size will be reduced
2. **Retry the build** - Most DNS issues are temporary
3. **If it fails again:**
   - Check network connectivity (ping, nslookup)
   - Check firewall/proxy settings
   - Try different network
   - Flush DNS cache

---

## Expected Archive Size After .easignore

**Before:** 719 MB  
**After:** ~50-100 MB (estimated)

This will make uploads:
- ✅ Faster
- ✅ More reliable
- ✅ Less likely to timeout
- ✅ Less bandwidth usage

---

## Build Command

Once network is resolved:

```powershell
cd C:\TrueScan-FoodScanner
eas build -p ios --profile production
```

---

## Additional Notes

- The build process compresses files before upload
- Large archives take longer to compress and upload
- Network timeouts are more likely with large files
- The `.easignore` file will significantly reduce archive size

---

**Status:** ✅ `.easignore` file created - Ready to retry build



