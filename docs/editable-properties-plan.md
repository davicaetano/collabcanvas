# Editable Shape Properties Implementation Plan

## Overview

Transform the current read-only Properties Toolbar into a fully interactive property editor. When a shape is selected, users can edit its properties (position, size, colors, etc.) directly through input controls.

## Current State

### What We Have
- ✅ Properties Toolbar displays on the right side
- ✅ Shows shape properties when one shape is selected
- ✅ Shows read-only values: position (X, Y), size, fill, stroke, strokeWidth
- ✅ Shape selection system already working

### What's Missing
- ❌ Editable input controls for properties
- ❌ Real-time property updates to Firestore
- ❌ Property validation and constraints
- ❌ Visual feedback during editing

## Shape Data Structure

Based on current implementation:
```javascript
{
  id: string,              // Unique shape ID
  x: number,               // Position X (canvas coordinates)
  y: number,               // Position Y (canvas coordinates)
  width: number,           // Shape width in pixels
  height: number,          // Shape height in pixels
  fill: string,            // Fill color (hex, e.g., '#3B82F6')
  stroke: string,          // Stroke color (hex, e.g., '#000000')
  strokeWidth: number      // Stroke width in pixels (e.g., 2)
}
```

## Editable Properties Priority

### Phase 1: Essential Properties (MVP)
1. **Position (X, Y)** - Numeric inputs
2. **Size (Width, Height)** - Numeric inputs  
3. **Fill Color** - Color picker
4. **Stroke Color** - Color picker
5. **Stroke Width** - Numeric input or slider

### Phase 2: Advanced Properties (Future)
- Rotation angle
- Opacity/transparency
- Corner radius (for rectangles)
- Shadow/blur effects
- Z-index/layer order

## Component Architecture

### 1. PropertiesToolbar Enhancement
**File**: `src/components/Canvas/PropertiesToolbar.jsx`

**Changes Needed**:
- Replace read-only text with editable input components
- Add property update handlers
- Add validation logic
- Show loading/saving states

### 2. New Input Components

#### NumericInput.jsx
**File**: `src/components/Canvas/properties/NumericInput.jsx`

**Features**:
- Controlled input for numbers
- Support for step increment/decrement
- Keyboard support (Arrow Up/Down, Enter to confirm)
- Min/max validation
- Display unit label (px, degrees, etc.)

**Props**:
```javascript
{
  label: string,           // Display label (e.g., "X Position")
  value: number,           // Current value
  onChange: function,      // Update handler
  min?: number,           // Minimum allowed value
  max?: number,           // Maximum allowed value
  step?: number,          // Increment/decrement step (default: 1)
  unit?: string,          // Display unit (default: 'px')
  disabled?: boolean      // Read-only mode
}
```

#### ColorInput.jsx
**File**: `src/components/Canvas/properties/ColorInput.jsx`

**Features**:
- Color preview swatch
- Click to open color picker
- Support for hex color codes
- Text input for manual color entry
- Recent colors palette (nice-to-have)

**Props**:
```javascript
{
  label: string,           // Display label (e.g., "Fill Color")
  value: string,           // Current color (hex)
  onChange: function,      // Update handler
  disabled?: boolean      // Read-only mode
}
```

### 3. Property Update Flow

```
User edits input
    ↓
Input onChange handler
    ↓
Validate value (min/max, format)
    ↓
If VALID: Update local state (optimistic UI)
If INVALID: Keep previous value (do nothing)
    ↓
Call updateShape() with new values
    ↓
Sync to Firestore
    ↓
Real-time listener updates all clients
```

## Implementation Details

### Property Update Handler

**File**: `src/components/Canvas/PropertiesToolbar.jsx`

```javascript
const handlePropertyUpdate = async (shapeId, propertyName, newValue) => {
  try {
    // 1. Validate the new value
    const validatedValue = validateProperty(propertyName, newValue);
    
    // If validation fails, keep the current value (do nothing)
    if (validatedValue === null) {
      console.log('Invalid value, keeping current value');
      return;
    }
    
    // 2. Optimistic update (update local state immediately)
    const updatedShapes = shapes.map(shape => 
      shape.id === shapeId 
        ? { ...shape, [propertyName]: validatedValue }
        : shape
    );
    setShapes(updatedShapes);
    
    // 3. Sync to Firestore
    await updateShapeInFirestore(shapeId, {
      [propertyName]: validatedValue
    });
    
  } catch (error) {
    console.error('Failed to update property:', error);
    // Keep current value on error
  }
};
```

### Property Validation

**File**: `src/utils/propertyValidation.js`

```javascript
export const PROPERTY_CONSTRAINTS = {
  x: { type: 'number', min: -10000, max: 10000 },
  y: { type: 'number', min: -10000, max: 10000 },
  width: { type: 'number', min: 1, max: 10000 },
  height: { type: 'number', min: 1, max: 10000 },
  strokeWidth: { type: 'number', min: 0, max: 100 },
  fill: { type: 'color' },
  stroke: { type: 'color' },
};

export const validateProperty = (propertyName, value) => {
  const constraint = PROPERTY_CONSTRAINTS[propertyName];
  
  if (!constraint) {
    return null; // Invalid property name - reject
  }
  
  switch (constraint.type) {
    case 'number':
      const num = parseFloat(value);
      // If invalid number or out of range, reject
      if (isNaN(num)) return null;
      if (constraint.min !== undefined && num < constraint.min) return null;
      if (constraint.max !== undefined && num > constraint.max) return null;
      return num;
      
    case 'color':
      // Validate hex color format
      if (!/^#[0-9A-Fa-f]{6}$/.test(value)) {
        return null; // Invalid format - reject
      }
      return value;
      
    default:
      return value;
  }
};
```

## UI/UX Design

### Property Section Layout

```
┌─────────────────────────────────────┐
│ Shape Properties                    │
├─────────────────────────────────────┤
│                                     │
│ Position                            │
│ ┌──────────┐  ┌──────────┐        │
│ │ X: [100] │  │ Y: [200] │   px   │
│ └──────────┘  └──────────┘        │
│                                     │
│ Size                                │
│ ┌──────────┐  ┌──────────┐        │
│ │ W: [150] │  │ H: [100] │   px   │
│ └──────────┘  └──────────┘        │
│                                     │
│ Appearance                          │
│ Fill       [■] #3B82F6             │
│ Stroke     [■] #000000             │
│ Width      [───•──] 2 px           │
│                                     │
└─────────────────────────────────────┘
```

### Input States

1. **Default**: Normal border, white background
2. **Focus**: Blue border, cursor visible
3. **Editing**: Show save indicator (optional)
4. **Disabled**: Gray background, no interaction

**Note**: Invalid values are silently rejected - the input simply keeps the previous valid value.

### Keyboard Shortcuts

- **Arrow Up/Down**: Increment/decrement value by step
- **Shift + Arrow**: Increment/decrement by 10x step
- **Enter**: Confirm and move to next input
- **Escape**: Cancel edit and revert to original value
- **Tab**: Navigate between inputs

## Offline Persistence & Network Resilience

### Strategy: Firestore Offline Persistence

Firestore provides built-in offline support that handles most of the complexity for us.

#### How It Works

1. **Enable Offline Persistence** in Firebase initialization
2. **Local Cache**: Firestore maintains a local cache of data
3. **Write Queue**: Offline writes are queued locally
4. **Automatic Sync**: When connection restored, writes sync automatically
5. **Conflict Resolution**: Last write wins (Firestore default)

#### Implementation

**File**: `src/utils/firebase.js`

**Note**: Firestore v9+ has offline persistence **enabled by default**! The current implementation already supports offline mode. However, for explicit control and better error handling, we can use `enableIndexedDbPersistence()`:

```javascript
import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Enable offline persistence explicitly (optional, but gives more control)
enableIndexedDbPersistence(db)
  .then(() => {
    console.log('Offline persistence enabled');
  })
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time.
      console.warn('Offline persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      // The current browser doesn't support persistence
      console.warn('Offline persistence not available in this browser');
    }
  });

export { db };
```

**Current Status**: The app already has basic offline support since Firestore v9+ enables it by default. The explicit implementation above is optional but recommended for production.

#### Benefits

- ✅ **Automatic queuing** of writes during offline
- ✅ **Local reads** continue to work offline
- ✅ **Automatic sync** when connection restored
- ✅ **Conflict resolution** handled by Firestore (last write wins)
- ✅ **No additional code** needed in components

#### User Experience

```
User is ONLINE:
  Edit property → Update local → Sync to Firestore → Real-time to others

User goes OFFLINE:
  Edit property → Update local → Queue write → Visual indicator (optional)

User comes back ONLINE:
  Queued writes sync automatically → Other users receive updates
```

#### Optional: Connection Status Indicator

Add a small indicator to show online/offline status:

```javascript
// Hook to track connection status
const [isOnline, setIsOnline] = useState(navigator.onLine);

useEffect(() => {
  const handleOnline = () => setIsOnline(true);
  const handleOffline = () => setIsOnline(false);
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}, []);

// Show indicator in UI
{!isOnline && (
  <div className="bg-yellow-500 text-white px-3 py-1 text-sm">
    Offline - Changes will sync when connected
  </div>
)}
```

### Concurrency Strategy: Last Write Wins

**Simple and Predictable**:
- No complex conflict resolution logic
- Firestore handles this automatically
- Users see the most recent edit from any user
- Good for collaborative editing where latest state matters

**Behavior**:
```
User A: Sets width to 100 (time: T1)
User B: Sets width to 200 (time: T2)
Result: Width = 200 (last write wins)
```

This is acceptable for shape properties where the latest value is typically the desired one.

## Files to Create

### New Components
```
src/components/Canvas/properties/
├── NumericInput.jsx       # Numeric property input
├── ColorInput.jsx         # Color property input
└── PropertyLabel.jsx      # Consistent label component (optional)
```

### New Utilities
```
src/utils/
└── propertyValidation.js  # Property validation logic
```

## Files to Modify

### 1. PropertiesToolbar.jsx
**Changes**:
- Import new input components
- Add property update handler
- Replace read-only divs with input components
- Add validation logic (reject invalid values silently)
- Add loading states (optional)

### 2. firebase.js & firestore.js
**Changes**:
- **firebase.js**: Enable offline persistence with `enableIndexedDbPersistence()`
- **firestore.js**: Ensure `updateShape` function handles partial updates
- Add error handling for network failures (Firestore handles retries automatically)
- Consider debouncing rapid updates (optional)

### 3. useCanvasState.js or create usePropertyEditor.js
**Changes**:
- Add property editing state management
- Track pending/saving states
- Handle optimistic updates

## Implementation Steps

### Step 0: Enable Offline Persistence (30 minutes) - OPTIONAL
**Note**: Firestore v9+ already has offline persistence enabled by default!

1. ⚪ (Optional) Explicitly enable `enableIndexedDbPersistence()` for better control
2. ✅ Test offline behavior (disconnect network, make edits)
3. ✅ Verify automatic sync when reconnected
4. ⚪ (Optional) Add connection status indicator to UI

### Step 1: Create Input Components (2 hours)
1. ✅ Create `NumericInput.jsx` with basic functionality
2. ✅ Create `ColorInput.jsx` with color picker
3. ✅ Test components in isolation
4. ✅ Add keyboard shortcuts support

### Step 2: Add Property Validation (1 hour)
1. ✅ Create `propertyValidation.js` utility
2. ✅ Define constraints for each property
3. ✅ Add validation tests
4. ✅ Handle edge cases (NaN, null, undefined)

### Step 3: Update PropertiesToolbar (2 hours)
1. ✅ Add property update handler
2. ✅ Replace read-only text with input components
3. ✅ Wire up onChange handlers
4. ✅ Add validation (silently reject invalid values)

### Step 4: Firestore Integration (1 hour)
1. ✅ Test updateShape with property changes
2. ✅ Verify real-time sync works correctly
3. ✅ Handle offline scenarios
4. ✅ Add debouncing if needed

### Step 5: Testing & Polish (1 hour)
1. ✅ Test single shape editing
2. ✅ Test property validation edge cases
3. ✅ Test multi-user editing scenarios
4. ✅ Test invalid value rejection
5. ✅ Test offline/online transitions
6. ✅ Polish UI and animations

**Total Estimated Time**: 7.5 hours (including offline persistence)

## Success Criteria

### Functional Requirements
- ✅ User can edit X, Y position via numeric inputs
- ✅ User can edit width, height via numeric inputs
- ✅ User can change fill color via color picker
- ✅ User can change stroke color via color picker
- ✅ User can adjust stroke width via input
- ✅ Changes sync to Firestore immediately
- ✅ Other users see updates in real-time
- ✅ Invalid values are rejected (keeps previous value)

### User Experience
- ✅ Inputs respond immediately (no lag)
- ✅ Visual feedback shows save status (optional)
- ✅ Keyboard shortcuts work as expected
- ✅ Invalid values are silently rejected (input keeps previous value)
- ✅ UI is consistent with rest of application

### Technical Requirements
- ✅ No performance degradation when editing
- ✅ Optimistic updates feel instant
- ✅ No race conditions with concurrent edits (last write wins)
- ✅ Proper error handling and recovery
- ✅ Offline edits persist and sync when connection restored

## Edge Cases to Handle

### Validation
- **Negative dimensions** (width/height < 0) → Keep current value
- **Extremely large values** (> 10000px) → Keep current value
- **Invalid color formats** → Keep current value
- **Non-numeric input** in number fields → Keep current value
- **Empty/null values** → Keep current value

### Concurrency
- **Two users editing simultaneously** → Last write wins (Firestore default behavior)
- **Network disconnection during edit** → Use Firestore offline persistence (writes queued locally)
- **Firestore write failures** → Retry automatically when connection restored
- **Stale data after reconnection** → Firestore syncs automatically with server state

### Selection States
- No shapes selected → Disable all inputs
- Multiple shapes selected → Show "Multiple values" or disable (Phase 2)
- Shape deleted while editing → Close property panel
- Selection changed mid-edit → Confirm or cancel changes

## Future Enhancements (Post-MVP)

### Multi-Select Editing
- Show mixed values as "—" or "Multiple"
- Allow batch editing of common properties
- "Apply to all" button for quick updates

### Advanced Inputs
- Slider for stroke width with live preview
- Gradient picker for advanced fills
- Eyedropper tool for color sampling
- Property linking (e.g., lock aspect ratio)

### History & Undo
- Track property changes for undo/redo
- Show property change history
- Revert to previous values

### Presets & Styles
- Save property combinations as presets
- Quick apply common styles
- Share presets with team

---

## Quick Start Checklist

When implementing, follow this order:

1. ☐ Create `NumericInput.jsx` component
2. ☐ Create `ColorInput.jsx` component
3. ☐ Create `propertyValidation.js` utility
4. ☐ Update `PropertiesToolbar.jsx` to use new inputs
5. ☐ Add property update handler with Firestore sync
6. ☐ Test with single shape selection
7. ☐ Add error handling and loading states
8. ☐ Test multi-user scenario
9. ☐ Polish UI and add keyboard shortcuts
10. ☐ Document usage and update README

---

This plan focuses on making properties editable with a clean, simple implementation that can be expanded later with more advanced features.

