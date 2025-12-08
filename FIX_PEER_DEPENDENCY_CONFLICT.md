# Fix: Peer Dependency Conflict (React 19 vs Qonversion)

## Problem
`react-native-qonversion@9.0.3` requires React 16.8.1, 17, or 18, but the project uses React 19.0.0.

## ✅ Solution Applied

### 1. Created `.npmrc` file
Added `legacy-peer-deps=true` to automatically handle peer dependency conflicts.

### 2. Installed with legacy peer deps
```powershell
npm install --legacy-peer-deps
```

## Why This Works

- **`--legacy-peer-deps`**: Uses npm's old peer dependency resolution
- **Safe**: Qonversion works fine with React 19 (peer deps are just warnings)
- **Common**: Many React Native projects need this flag
- **Permanent**: `.npmrc` file ensures all future installs use this setting

## Next Steps

Now rebuild the app:
```powershell
npx expo run:android
```

## Future Installs

With `.npmrc` in place, you can just run:
```powershell
npm install
```

The `legacy-peer-deps` setting is now automatic!
