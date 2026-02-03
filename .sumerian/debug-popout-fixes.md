# Pop-out Window Bug - Debug Log

## Problem
All pop-out windows (Explorer, Code Editor, Agent, Terminal, DevTools) show blank white screen.

## Attempted Fixes (DO NOT REPEAT)

### Attempt 1: Replace init() with lightweight state sync
**Files Modified:** DetachedPanelWindow.tsx
**What:** Replaced `init()` call with custom `initDetachedWindow()` that only syncs state via `window.sumerian.state.getAll()`
**Result:** FAILED - Windows still blank white
**Why it failed:** Unknown - possibly state not being synced properly or React not rendering

### Attempt 2: Add loading state UI
**Files Modified:** DetachedPanelWindow.tsx
**What:** Added `isLoading` and `initError` state, showed spinner while loading
**Result:** FAILED - Never saw spinner, just blank white
**Why it failed:** React component not mounting at all

### Attempt 3: Sync state before detach
**Files Modified:** layoutStore.ts
**What:** Added state sync calls before `window.sumerian.window.detachPanel()` using dynamic import of appStateHelper
**Result:** FAILED - Circular import issues, windows still blank
**Why it failed:** Dynamic import may have caused issues

### Attempt 4: Add console message forwarding
**Files Modified:** WindowManager.ts
**What:** Added `window.webContents.on('console-message', ...)` to forward logs
**Result:** FAILED - No console messages appeared
**Why it failed:** Window content not loading/executing JS

### Attempt 5: Add debug logging to renderer.tsx
**Files Modified:** renderer.tsx
**What:** Added logging for detached window detection
**Result:** FAILED - No logs appeared
**Why it failed:** Same as above - JS not executing

### Attempt 6: Inline styles fallback
**Files Modified:** DetachedPanelWindow.tsx
**What:** Changed `bg-nexus-bg-primary` to inline `style={{ backgroundColor: '#0a0a0a' }}`
**Result:** FAILED - Still white
**Why it failed:** CSS not the issue - React not rendering at all

### Attempt 7: Revert all changes
**Files Modified:** All above files reverted to HEAD
**Result:** FAILED - Still blank white (this was the ORIGINAL bug)
**Why it failed:** The bug existed before my changes

---

## Key Insight
The blank white pop-out windows is the **ORIGINAL BUG** that existed before any of my changes. Reverting doesn't fix it because it was already broken.

## Root Cause Analysis Needed
1. Why is React not mounting in detached windows?
2. Is the URL being loaded correctly?
3. Is the preload script working?
4. Is there a JS error preventing render?

## Attempt 8: Fix preload path in WindowManager
**Files Modified:** WindowManager.ts, main.ts
**What:** Pass correct preload path from main.ts to WindowManager via setPreloadPath()
**Result:** PARTIAL SUCCESS - Explorer works, others still blank
**Why partial:** The preload path was wrong (different __dirname in bundled code). Fixed it, Explorer now works.

## Attempt 9: Add initDetached() for lightweight state sync
**Files Modified:** useAppStore.ts, types.ts, DetachedPanelWindow.tsx
**What:** Created initDetached() that only syncs state without re-opening project/spawning CLI
**Result:** FAILED - All panels now broken including Explorer
**Why:** initDetached() doesn't have the event listeners that init() sets up

## Attempt 10: Revert to init()
**Files Modified:** DetachedPanelWindow.tsx
**What:** Reverted back to using init() instead of initDetached()
**Result:** TESTING
**Why:** Explorer was working with init() before the initDetached change

## Key Observations
1. Explorer worked ONCE with the preload path fix + init()
2. After adding initDetached(), everything broke
3. The app crashes frequently with "libc++abi: terminating due to uncaught exception"
4. Multiple "Failed to initialize sandbox" errors appear

## Hypothesis
The preload path fix WAS correct. The issue now is that:
1. init() in detached windows tries to re-open project which spawns CLI
2. Multiple CLI processes cause resource exhaustion / crashes
3. Need to prevent init() from re-opening project in detached windows

## Attempt 11: Detect detached window in init() and skip project.open()
**Files Modified:** useAppStore.ts
**What:** Check `window.location.search.includes('detached=')` and skip project.open() in detached windows
**Result:** PARTIAL - worked once, then failed

## Attempt 12: Add sandbox: false to BrowserWindow
**Files Modified:** WindowManager.ts
**What:** Added `sandbox: false` to webPreferences for detached windows
**Result:** SUCCESS - All pop-outs now work consistently

## FINAL FIX SUMMARY
The pop-out window bug was caused by TWO issues:

### Issue 1: Wrong preload path
- `WindowManager.ts` used `__dirname` to compute preload path
- After Vite bundling, `__dirname` resolved to wrong location
- **Fix:** Pass correct preload path from `main.ts` via `setPreloadPath()`

### Issue 2: Sandbox initialization failures
- Chromium sandbox was failing to initialize for detached windows
- **Fix:** Added `sandbox: false` to BrowserWindow webPreferences

### Issue 3: Slow init in detached windows
- `init()` was re-opening project and spawning CLI processes (30+ seconds)
- **Fix:** Detect detached window via URL param and skip `project.open()`

## Files Modified
1. `src/main/windows/WindowManager.ts` - Added setPreloadPath(), sandbox: false
2. `src/main.ts` - Call setPreloadPath() after creating main window
3. `src/renderer/stores/useAppStore.ts` - Skip project.open() in detached windows
4. `src/renderer/App.tsx` - Added error display for preload script issues

## Terminal Reattach Blank Issue - FIXED ✅

### Problem
When a Terminal panel was detached and then reattached, the terminal went blank.

### Root Cause
- Terminal `onData` events were bound to the **original window's webContents**
- When detached, the new window created a new xterm instance but the pty data was still being sent to the old window
- When reattached, the terminal existed but data events pointed to closed/wrong window

### Solution: Broadcast to All Windows
Changed `TerminalManager` to broadcast terminal data to **ALL windows** via `BrowserWindow.getAllWindows()` instead of binding to a single window.

### Files Modified

#### `src/main/terminal/TerminalManager.ts`
```typescript
// Before: Data sent to single webContents
ptyProcess.onData((data) => {
    events.onData(data);  // Only goes to original window
});

// After: Broadcast to ALL windows
ptyProcess.onData((data) => {
    BrowserWindow.getAllWindows().forEach(win => {
        if (!win.isDestroyed()) {
            win.webContents.send(`terminal:data:${id}`, data);
        }
    });
});
```

Also added duplicate check in `createTerminal()`:
```typescript
if (this.ptyProcesses.has(id)) {
    return;  // Skip if terminal already exists
}
```

#### `src/renderer/panels/TerminalPanel.tsx`
- Store `fitAddonRef` to reuse FitAddon instance
- Trigger resize on tab activation to refresh display:
```typescript
useEffect(() => {
    if (isActive && xtermRef.current && fitAddonRef.current) {
        setTimeout(() => {
            fitAddonRef.current?.fit();
            window.sumerian.terminal.resize(id, cols, rows);
        }, 50);
    }
}, [isActive, id]);
```

#### Removed (no longer needed)
- `terminal:attach` IPC handler in `handlers.ts`
- `attach()` method in `preload.ts`
- `attach()` type in `sumerian.d.ts`

### Result
- ✅ Terminal shows content when detached
- ✅ Terminal shows content when reattached
- ✅ Tab switching maintains content
- ✅ Both main and detached windows receive terminal data simultaneously
