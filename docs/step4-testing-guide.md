# Step 4: Firestore Integration Testing Guide

## Overview
This guide provides comprehensive testing instructions for the editable properties feature with Firestore real-time synchronization.

## ✅ What's Already Working

### Firestore Integration (Built-in)
- **Offline Persistence**: Enabled by default in Firestore v9+ (firebase.js:29)
- **Real-time Sync**: `subscribeToShapes` provides live updates
- **Update Function**: `updateShape` handles property changes with timestamps
- **Batch Operations**: Support for bulk updates via `updateShapesBatch`

### Current Implementation
- PropertiesToolbar uses `updateShape` from firestore.js
- Optimistic UI updates for instant feedback
- Property validation before Firestore writes
- Integer rounding for all numeric values

---

## 🧪 Test Scenarios

### Test 1: Single User Property Editing
**Goal**: Verify that property changes persist correctly

**Steps**:
1. Open the app at `http://localhost:5173`
2. Log in with Google
3. Click "Add Shape" (A key) and draw a rectangle
4. Click "Select" (V key) and select the shape
5. In PropertiesToolbar, change X position from current value to `500`
6. Press Enter or click outside the input
7. Refresh the page (F5)

**Expected Result**:
- ✅ Shape moves to X=500 immediately (optimistic update)
- ✅ After refresh, shape is still at X=500 (Firestore persisted)
- ✅ Properties Toolbar shows X=500 (no decimals)

---

### Test 2: Multi-User Real-Time Sync
**Goal**: Verify that changes sync across multiple users in real-time

**Steps**:
1. Open the app in two browser tabs (or two different browsers)
2. Log in with the SAME Google account in both tabs
3. In Tab 1: Create a rectangle
4. In Tab 1: Change the Fill color to red (#ff0000)
5. Watch Tab 2

**Expected Result**:
- ✅ Rectangle appears in Tab 2 immediately after creation
- ✅ Color change in Tab 1 appears in Tab 2 within 1-2 seconds
- ✅ Both tabs show identical shape properties

---

### Test 3: Concurrent Editing (Last Write Wins)
**Goal**: Verify that concurrent edits follow "Last Write Wins" strategy

**Steps**:
1. Open the app in two browser tabs
2. Log in with the same account in both
3. Create a shape in Tab 1
4. In Tab 1: Select the shape and start editing X position
5. In Tab 2: Select the same shape and quickly change Y position to `300`
6. In Tab 1: Change X position to `400` (after Tab 2's change)

**Expected Result**:
- ✅ Final shape position: X=400, Y=300 (both changes applied)
- ✅ Last write wins (whoever saves last, their value sticks)
- ✅ No conflicts or errors in console

---

### Test 4: Invalid Value Rejection
**Goal**: Verify that invalid inputs are silently rejected

**Steps**:
1. Select a shape
2. Try to change X to: `abc` (invalid)
3. Press Enter
4. Try to change Width to: `-50` (below minimum)
5. Press Enter
6. Try to change Fill color to: `red` (invalid format, needs hex)
7. Press Enter

**Expected Result**:
- ✅ Invalid values are NOT applied
- ✅ Input reverts to previous valid value
- ✅ Console shows warning: "Invalid value for property..."
- ✅ No Firestore write occurs for invalid values

---

### Test 5: Offline Persistence
**Goal**: Verify that changes work offline and sync when back online

**Steps**:
1. Open DevTools (F12) → Network tab
2. Set network to "Offline" mode
3. Create a shape (will fail to sync)
4. Try to edit properties (will queue locally)
5. Set network back to "Online"
6. Wait 2-3 seconds

**Expected Result**:
- ✅ While offline: Changes appear locally but may show warning
- ✅ When back online: Changes sync to Firestore automatically
- ✅ Firestore queue processes pending writes
- ✅ No data loss

**Note**: Firestore's offline persistence will cache reads but may show errors for writes until reconnected.

---

### Test 6: Property Validation Edge Cases
**Goal**: Verify all validation constraints work correctly

**Test Cases**:
| Property | Test Value | Expected Result | Reason |
|----------|-----------|-----------------|--------|
| X | `0` | ✅ Accepted | Minimum boundary |
| X | `3000` | ✅ Accepted | Maximum boundary (canvas width) |
| X | `-1` | ❌ Rejected | Below minimum |
| X | `3001` | ❌ Rejected | Above maximum |
| X | `150.7` | ✅ Accepted as `151` | Rounded up |
| Y | `0` | ✅ Accepted | Minimum boundary |
| Y | `3000` | ✅ Accepted | Maximum boundary |
| Width | `1` | ✅ Accepted | Minimum boundary |
| Width | `3000` | ✅ Accepted | Maximum boundary |
| Width | `0` | ❌ Rejected | Below minimum |
| Height | `1` | ✅ Accepted | Minimum boundary |
| Height | `0` | ❌ Rejected | Below minimum |
| Stroke Width | `0` | ✅ Accepted | Minimum (no stroke) |
| Stroke Width | `100` | ✅ Accepted | Maximum boundary |
| Stroke Width | `101` | ❌ Rejected | Above maximum |
| Fill | `#ff0000` | ✅ Accepted | Valid hex |
| Fill | `#FF0000` | ✅ Accepted | Valid hex (uppercase) |
| Fill | `red` | ❌ Rejected | Not hex format |
| Fill | `#ff00` | ❌ Rejected | Too short |
| Stroke | `#000000` | ✅ Accepted | Valid hex |

**Steps**:
1. Select a shape
2. Test each value from the table above
3. Verify acceptance/rejection matches expected result

---

### Test 7: Batch Operations (500 Shapes)
**Goal**: Verify that bulk operations work correctly

**Steps**:
1. Click "Add 500 Rectangles" button
2. Wait for shapes to load (~2-3 seconds)
3. Select any random shape
4. Check properties in PropertiesToolbar

**Expected Result**:
- ✅ All 500 shapes created successfully
- ✅ All shapes have integer coordinates (no decimals)
- ✅ Random selection shows valid properties
- ✅ No errors in console

---

### Test 8: Drag and Property Sync
**Goal**: Verify that dragged shapes update properties correctly

**Steps**:
1. Create a shape at position X=100, Y=100
2. Note the initial position in PropertiesToolbar
3. Drag the shape to a new location
4. Check PropertiesToolbar again

**Expected Result**:
- ✅ PropertiesToolbar updates to show new X, Y
- ✅ Values are integers (no decimals like 245.7)
- ✅ Other users see the shape move in real-time
- ✅ Firestore updates persist after refresh

---

## 🚀 Performance Considerations

### Current Implementation
- **No debouncing**: Every property change immediately writes to Firestore
- **Optimistic updates**: UI updates before Firestore confirms write
- **Batch support**: Available for multi-shape operations (not yet used for properties)

### Potential Improvement: Debouncing
If users type very fast (e.g., changing X from 100 → 101 → 102 → 103), we currently make 4 Firestore writes. We could add debouncing to only write after user stops typing for ~300ms.

**Trade-off**:
- ✅ **Pro**: Fewer Firestore writes = lower costs, better performance
- ❌ **Con**: Slight delay before other users see changes (300ms)

**Recommendation**: Add debouncing only if performance becomes an issue (Step 5 polish).

---

## ✅ Success Criteria Checklist

After completing all tests above, verify:

- [ ] Single user can edit properties and changes persist
- [ ] Multiple users see changes in real-time (1-2 second delay max)
- [ ] Invalid values are silently rejected (no errors, just ignored)
- [ ] Offline changes sync when back online
- [ ] All numeric values are integers (no decimals)
- [ ] Concurrent edits follow "Last Write Wins" strategy
- [ ] No console errors during normal operation
- [ ] 500 shapes can be created and edited without issues
- [ ] Dragged shapes update properties correctly

---

## 🐛 Known Issues / Limitations

### Expected Behavior
1. **Offline Writes**: Firestore will show warnings in console when offline, but will queue writes for later. This is normal.
2. **Timestamp Delay**: `updatedAt` uses `serverTimestamp()`, so it's set on the server, not immediately visible locally.
3. **Concurrency**: No conflict resolution beyond "last write wins". If two users edit the same property simultaneously, the last write will overwrite the first.

### Not Issues
- ❌ "Warning: Invalid value for property..." in console → This is expected for validation rejections
- ❌ Slight delay (~100-500ms) for real-time sync → Normal Firestore latency
- ❌ Offline errors → Expected, will auto-retry when online

---

## 📊 Test Results Template

Use this template to document your test results:

```
# Step 4 Test Results
Date: [Date]
Tester: [Your Name]

## Test Summary
- Total Tests: 8
- Passed: [ ]
- Failed: [ ]
- Skipped: [ ]

## Individual Test Results

### Test 1: Single User Property Editing
- Status: [ ] PASS [ ] FAIL
- Notes:

### Test 2: Multi-User Real-Time Sync
- Status: [ ] PASS [ ] FAIL
- Notes:

### Test 3: Concurrent Editing
- Status: [ ] PASS [ ] FAIL
- Notes:

### Test 4: Invalid Value Rejection
- Status: [ ] PASS [ ] FAIL
- Notes:

### Test 5: Offline Persistence
- Status: [ ] PASS [ ] FAIL
- Notes:

### Test 6: Property Validation Edge Cases
- Status: [ ] PASS [ ] FAIL
- Failed Cases:

### Test 7: Batch Operations
- Status: [ ] PASS [ ] FAIL
- Notes:

### Test 8: Drag and Property Sync
- Status: [ ] PASS [ ] FAIL
- Notes:

## Issues Found
1. [Issue description]
2. [Issue description]

## Recommendations
1. [Recommendation]
2. [Recommendation]
```

---

## 🎯 Next Steps

After completing Step 4 testing:
1. Document any issues found
2. Fix critical bugs
3. Consider debouncing optimization (optional)
4. Proceed to **Step 5: Final Testing & Polish**

