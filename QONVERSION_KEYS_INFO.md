# Qonversion Keys - What You Need

## ✅ Keys You Have

**Project Key:** `Bdh8Y7krabWxjf_alA0bSRUlHn8W3W0_`  
**Secret Key:** `sk_j-ONQtLosbyILpgq1OZl2iubO83Z43hD`

---

## 📱 What Goes in the Mobile App

### **Project Key Only** ✅

The **Project Key** (`Bdh8Y7krabWxjf_alA0bSRUlHn8W3W0_`) is what you need for the mobile app.

- ✅ Used for SDK initialization
- ✅ Safe to include in mobile app
- ✅ Same key typically works for both iOS and Android

**Already configured in:**
- ✅ `.env` file
- ✅ `app.config.js` (as fallback)
- ✅ `src/store/useSubscriptionStore.ts`

---

## 🔐 What Does NOT Go in the Mobile App

### **Secret Key** ❌

The **Secret Key** (`sk_j-ONQtLosbyILpgq1OZl2iubO83Z43hD`) should **NEVER** be in your mobile app!

- ❌ **DO NOT** put this in `.env` or mobile app code
- ✅ Use it only for **server-side operations**:
  - Webhook verification
  - Backend API calls
  - Server-side subscription validation
  - Analytics/reporting from your backend

---

## 🔄 When to Use Each Key

| Use Case | Key to Use | Where |
|----------|------------|-------|
| Mobile SDK initialization | Project Key | Mobile app (React Native) |
| Check entitlements | Project Key | Mobile app |
| Purchase products | Project Key | Mobile app |
| Restore purchases | Project Key | Mobile app |
| Webhook verification | Secret Key | Backend server |
| Server API calls | Secret Key | Backend server |
| Server-side validation | Secret Key | Backend server |

---

## ✅ Current Setup

Your app is now configured with:

```typescript
Project Key: Bdh8Y7krabWxjf_alA0bSRUlHn8W3W0_
```

**Location:**
1. `.env` file (primary source)
2. `app.config.js` (fallback)
3. `src/store/useSubscriptionStore.ts` (used by SDK)

---

## 🚀 Next Steps

1. ✅ **Project Key is configured** - Ready to test!
2. ⏳ **Configure products** in Qonversion Dashboard
3. ⏳ **Create subscription products** in App Store/Play Store
4. ⏳ **Test subscription flow**

---

## 🔒 Security Notes

- ✅ Project Key in mobile app = **Safe** (public, meant for client-side)
- ❌ Secret Key in mobile app = **Security risk** (private, server-side only)
- ✅ Secret Key should be stored in secure backend environment variables
- ✅ Never commit Secret Key to version control

---

## 📚 Reference

- **Dashboard:** https://dashboard.qonversion.io/settings
- **API Keys:** Usually under Settings → API Keys or Project Settings
- **Documentation:** https://documentation.qonversion.io/docs/keys

---

**Your app is ready to use the Project Key!** 🎉

