# Stock Yo Space: Full Testing Protocol

**Target URL**: https://stockyospace.com  
**Purpose**: Verify that Phases 1-5 fixes resolved authentication, key reset, and sharing issues.

---

## Pre-Test Setup

Before starting, open the browser's Developer Console (F12 → Console tab) and keep it visible throughout testing. The Phase 5 updates added detailed logging with 📦 emoji tags that will help diagnose any remaining issues.

**Clear all previous state first:**
```javascript
localStorage.clear();
sessionStorage.clear();
```
Then hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R).

---

## Test Accounts

| Role  | nsec | npub |
|-------|------|------|
| Owner | `nsec1wnqh6y2aqlkygufm90vyjs38d6wcq2qzzh536tshg5u93m0w640shfrm4d` | (derived on login) |
| Guest | `nsec1qvqdaxh9zk42msuvlrzxx376a9k73kqc4ugfgjq4sg656tf0dy7syzgmx0` | `npub1qvqdaxh9zk42msuvlrzxx376a9k73kqc4ugfgjq4sg656tf0dy7s23k8s6` |

---

## Phase A: Owner Login

### Step A1: Navigate to Login
1. Go to https://stockyospace.com
2. You should see a login dialog or a "Login" button
3. Click to open the login dialog if not already open

### Step A2: Enter Owner nsec
1. Locate the nsec input field (should have id="nsec" or similar)
2. Click the "Key" tab if there are multiple login methods
3. Type or paste the Owner nsec:
   ```
   nsec1wnqh6y2aqlkygufm90vyjs38d6wcq2qzzh536tshg5u93m0w640shfrm4d
   ```
4. **CHECKPOINT**: The input should NOT show "Invalid secret key format" error
5. If validation passes, the "Log In" button should become enabled (not grayed out)

### Step A3: Complete Login
1. Click the "Log In" button
2. Wait up to 10 seconds for login to complete
3. **CHECKPOINT**: You should be redirected to the dashboard or inventory page
4. **CHECKPOINT**: Check console for any errors (red text)
5. **CHECKPOINT**: Look for console logs showing relay connections

### Expected Console Output (Phase 2 logging):
```
Connecting to relays...
Connected to wss://relay.damus.io (or similar)
Signer initialized
```

### If Login Fails:
- Note the exact error message shown on screen
- Copy any red console errors
- Check if the "Log In" button ever became enabled
- Proceed to FAILURE DIAGNOSTICS section at the end

---

## Phase B: Reset Inventory Key

### Step B1: Navigate to Settings
1. Click on "Settings" in the navigation menu
2. URL should change to https://stockyospace.com/settings
3. Wait for the page to fully load

### Step B2: Locate Reset Button
1. Scroll to the bottom of the Settings page
2. Look for a "Troubleshooting" section
3. Find the "Reset Inventory Key" button (should be red/danger colored)

### Step B3: Check Button State
1. **CHECKPOINT**: The button should be ENABLED (clickable), not grayed out
2. If the button is disabled, check console for errors
3. **CHECKPOINT**: You should NOT see "Not ready or no personal key" error

### Step B4: Click Reset
1. Click the "Reset Inventory Key" button
2. Wait up to 15 seconds
3. **CHECKPOINT**: Look for "Success! Key reset." message on screen
4. **CHECKPOINT**: Check console for confirmation logs

### Expected Console Output (Phase 3 logging):
```
📦 Resetting inventory key...
📦 Signer available, proceeding...
📦 Key reset successful
```

### If Reset Fails:
- Note if button was disabled (Phase 2 issue)
- Note if "Not ready" error appeared (Phase 3 issue)
- Check console for specific error messages
- Proceed to FAILURE DIAGNOSTICS section

---

## Phase C: Clean Share List

### Step C1: Navigate to Inventory
1. Click "Inventory" in the navigation menu
2. URL should change to https://stockyospace.com/inventory
3. Wait for inventory to load

### Step C2: Open Share Dialog
1. Look for a "Share" button or share icon (usually looks like an arrow or person+)
2. Click to open the Share dialog/modal
3. **CHECKPOINT**: Dialog should open without errors

### Step C3: Check Existing Shares
1. Look at the list of shared users in the dialog
2. If the Guest npub is already listed:
   ```
   npub1qvqdaxh9zk42msuvlrzxx376a9k73kqc4ugfgjq4sg656tf0dy7s23k8s6
   ```
3. Click the trash/remove icon next to it to remove them
4. Wait for removal confirmation

### Step C4: Verify Clean State
1. Close the Share dialog
2. Re-open the Share dialog
3. **CHECKPOINT**: Guest should no longer be in the list (or list should show "No shares yet")

---

## Phase D: Add Guest Share

### Step D1: Enter Guest npub
1. With Share dialog open, locate the npub input field (id="npub")
2. Type or paste the Guest npub:
   ```
   npub1qvqdaxh9zk42msuvlrzxx376a9k73kqc4ugfgjq4sg656tf0dy7s23k8s6
   ```
3. **CHECKPOINT**: No validation error should appear

### Step D2: Submit Share
1. Click the "Add" button OR press Enter
2. **CHECKPOINT**: The form should submit (Phase 4 fixed form handling)
3. Wait up to 10 seconds for the share to process

### Expected Console Output (Phase 4 logging):
```
Adding shared user: npub1qvqdaxh9zk42msuvlrzxx376a9k73kqc4ugfgjq4sg656tf0dy7s23k8s6
Share added successfully
```

### Step D3: Verify Share Added
1. **CHECKPOINT**: Guest npub should now appear in the shared users list
2. Close the Share dialog
3. Re-open to verify persistence
4. **CHECKPOINT**: Guest should still be listed after re-opening

### If Share Fails:
- Check if button click/Enter registered at all (check console)
- Look for "Adding shared user..." log - if missing, event handler didn't fire
- Note any error messages
- Proceed to FAILURE DIAGNOSTICS section

---

## Phase E: Logout

### Step E1: Find Logout
1. Look for a "Logout" button (often in Settings or navigation menu)
2. May also be in a user dropdown or profile area

### Step E2: Execute Logout
1. Click "Logout"
2. **CHECKPOINT**: You should be returned to the login screen
3. If no logout button exists, manually clear state:
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```

---

## Phase F: Guest Login

### Step F1: Login as Guest
1. Open the login dialog
2. Click "Key" tab if needed
3. Enter Guest nsec:
   ```
   nsec1qvqdaxh9zk42msuvlrzxx376a9k73kqc4ugfgjq4sg656tf0dy7syzgmx0
   ```
4. **CHECKPOINT**: No "Invalid secret key format" error
5. Click "Log In"
6. Wait for login to complete

### Step F2: Navigate to Inventory
1. Go to the Inventory page
2. Wait for it to load (watch for 📦 console logs)

### Expected Console Output (Phase 5 logging):
```
📦 Fetching inventory...
📦 Found X items
📦 Decrypting item 1...
📦 Decrypting item 2...
```

---

## Phase G: Verify Shared Inventory

### Step G1: Check Inventory List
1. **CRITICAL CHECKPOINT**: Do you see items in the inventory?
2. These items should be the ones created by the Owner
3. The inventory should NOT be empty (unless Owner had no items)

### Step G2: Document Results
Report one of the following outcomes:

**SUCCESS**: "Guest can see Owner's inventory items. Sharing works correctly."

**PARTIAL**: "Guest sees inventory page but it's empty or shows 'Loading...' indefinitely."

**FAILURE**: "Guest sees an error message: [exact error text]"

**CRITICAL FAILURE**: "Not ready or no personal key" error appeared at any point.

---

## FAILURE DIAGNOSTICS

If any phase failed, perform these additional checks:

### Diagnostic 1: Console Error Analysis
1. Copy ALL red error messages from the console
2. Note which phase the errors occurred in
3. Look specifically for:
   - `nip19` or `decode` errors → Phase 1 issue
   - `relay` or `connect` or `timeout` errors → Phase 2 issue
   - `signer` or `encryption` or `key` errors → Phase 3 issue
   - `share` or `add` or `form` errors → Phase 4 issue
   - `hydration` or `state` or `undefined` errors → Phase 5 issue

### Diagnostic 2: LocalStorage State
Run this in console and report the output:
```javascript
console.log('=== LocalStorage Debug ===');
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  console.log(key + ': ' + localStorage.getItem(key).substring(0, 50) + '...');
}
```

### Diagnostic 3: NDK State
Run this in console and report the output:
```javascript
console.log('=== NDK Debug ===');
console.log('Window NDK:', typeof window.ndk);
console.log('Signer:', window.ndk?.signer ? 'Present' : 'Missing');
console.log('Active user:', window.ndk?.activeUser?.pubkey?.substring(0, 16) + '...');
console.log('Connected relays:', window.ndk?.pool?.relays?.size || 0);
```

### Diagnostic 4: Network Tab
1. Open Network tab in DevTools
2. Filter by "WS" (WebSocket)
3. Report:
   - How many WebSocket connections exist?
   - Are they in "Connected" state or "Pending"?
   - Any connections in "Failed" state?

### Diagnostic 5: Specific File Checks
If the above diagnostics point to a specific phase, examine these files in the codebase:

| Phase | Files to Check |
|-------|----------------|
| 1 (Auth) | `LoginDialog.tsx` - look at nsec validation logic |
| 2 (Relay) | `NDKContext.tsx` - look at connect() and timeout logic |
| 3 (Keys) | `useInventoryKey.ts` - look at signer availability checks |
| 4 (Share) | `ShareInventoryModal.tsx`, `useSharing.ts` - look at form handlers |
| 5 (State) | `App.tsx`, `useInventory.ts` - look at ErrorBoundary and logging |

---

## Final Report Template

Please structure your final report as follows:

```
## Stock Yo Space Test Results

**Test Date**: [date/time]
**Site Version**: [check if there's a version number visible, or note last deploy time]

### Phase Results
- Phase A (Owner Login): ✅ PASS / ❌ FAIL - [details]
- Phase B (Reset Key): ✅ PASS / ❌ FAIL - [details]
- Phase C (Clean Shares): ✅ PASS / ❌ FAIL - [details]
- Phase D (Add Share): ✅ PASS / ❌ FAIL - [details]
- Phase E (Logout): ✅ PASS / ❌ FAIL - [details]
- Phase F (Guest Login): ✅ PASS / ❌ FAIL - [details]
- Phase G (Verify Sharing): ✅ PASS / ❌ FAIL - [details]

### Critical Errors Observed
[List any "Not ready or no personal key" or other critical errors]

### Console Errors
[Paste relevant console errors here]

### Diagnostic Results
[If any phase failed, include diagnostic outputs here]

### Recommended Next Steps
[Based on where failure occurred, suggest which code to examine]
```

---

## Notes for the Testing Agent

1. **Be patient with relays** — Nostr relays can take 5-15 seconds to connect. Don't assume failure too quickly.

2. **Use real typing when possible** — JavaScript `.value =` assignments sometimes don't trigger React's state updates. If that fails, try actual keyboard input simulation.

3. **Check for toasts** — Success/error messages often appear as toast notifications that disappear after a few seconds. Watch for them.

4. **The 📦 emoji logs are your friend** — Phase 5 added detailed logging. These logs will tell you exactly where things stall.

5. **If completely stuck** — Report which exact step you're stuck on and what you see on screen. Include a screenshot if possible.
