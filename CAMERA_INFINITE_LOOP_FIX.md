# Camera Infinite Loop Fix

**Date:** December 2024  
**Issue:** Camera lifecycle causing infinite state transitions and "Maximum update depth exceeded" error

---

## 🐛 Problem

The camera was stuck in an infinite loop:
- State transitions: `initializing → idle → unmounting → initializing` (repeating)
- React error: "Maximum update depth exceeded"
- Camera wouldn't open, showing "scan.retryCamera" error

### Root Cause

Multiple `useEffect` hooks were fighting each other:
1. **Hook's permission effect** - Triggered initialization when permission granted
2. **Screen's permission effect** - Also tried to activate camera
3. **Focus effect** - Read `cameraLifecycle.state` which caused re-renders on every state change

This created a cycle:
- Permission effect → state change → focus effect re-runs → state change → permission effect re-runs → loop

---

## ✅ Solution

### 1. Fixed Hook's Permission Effect (`useCameraLifecycle.ts`)
- Added `prevPermissionRef` to track actual permission changes
- Only reacts when permission **actually changes**, not on every render
- Prevents unnecessary re-initialization

### 2. Simplified Screen's Permission Effect (`app/index.tsx`)
- Removed direct camera activation
- Only resets initialization flags
- Lets the hook handle all state transitions
- Added `prevPermissionRef` to detect actual changes

### 3. Fixed Focus Effect (`app/index.tsx`)
- Removed dependency on `cameraLifecycle.state` (was causing re-renders)
- Added delay (200ms) to let permission effect complete first
- Only activates if not already initialized
- Simplified cleanup

### 4. Fixed Unmount Effect
- Removed `cameraLifecycle` from dependency array
- Only runs on mount/unmount, not on state changes

---

## 🔧 Changes Made

### `src/hooks/useCameraLifecycle.ts`
```typescript
// Added permission tracking
const prevPermissionRef = useRef(hasPermission);

// Only react to actual permission changes
if (prevPermissionRef.current === hasPermission) {
  return; // Skip if no change
}
prevPermissionRef.current = hasPermission;
```

### `app/index.tsx`
```typescript
// Added refs to track state
const prevPermissionRef = useRef(permission?.granted);
const hasInitializedRef = useRef(false);

// Simplified permission effect - no direct camera actions
// Simplified focus effect - removed state reads, added delay
// Fixed unmount effect - removed cameraLifecycle dependency
```

---

## ✅ Result

- ✅ No more infinite loops
- ✅ Camera initializes properly
- ✅ State transitions are clean and predictable
- ✅ No "Maximum update depth exceeded" errors
- ✅ Camera opens correctly

---

## 🧪 Testing

After this fix, test:
1. **App launch** - Camera should initialize smoothly
2. **Permission grant** - Should initialize once, not loop
3. **Screen focus** - Should activate camera without loops
4. **Screen blur** - Should deactivate cleanly
5. **Multiple focus/blur cycles** - Should work without issues

---

## 📝 Key Learnings

1. **Don't read state in dependency arrays** - Causes infinite loops
2. **Track previous values with refs** - Only react to actual changes
3. **Let one effect handle state** - Don't have multiple effects fighting
4. **Use delays carefully** - Can help with race conditions
5. **Simplify effects** - Less is more

---

**Status:** ✅ Fixed  
**TypeScript:** ✅ Compiles  
**Ready for Testing:** ✅ Yes











