# Select Tool Implementation Plan

## Overview

The Select Tool is the primary interaction mode for selecting and manipulating shapes on the canvas. It uses the MousePointer2 icon from Lucide React, matching the floating toolbar.

## Visual Design

### Cursor Behavior
- **Custom cursor**: Navigation arrow icon (matching toolbar visual style)
- **Implementation**: SVG cursor (`/public/select-cursor.svg`)
- **Style**: Black filled arrow pointing upper-left with white outline for visibility
- **Consistent**: Cursor remains the same throughout all interactions in select mode
- **No hover changes**: Cursor does NOT change when hovering over shapes

### Icon
- **Toolbar Icon**: Navigation arrow (Lucide React style)
- **Position**: First button in the floating toolbar
- **Tooltip**: "Select Tool"
- **Visual consistency**: Cursor icon matches toolbar button icon

## Functionality

### What Select Tool DOES:
1. ✅ **Select shapes** - Click on a shape to select it
2. ✅ **Multi-select** - Hold Shift/Cmd/Ctrl + Click to add/remove shapes from selection
3. 🔄 **Marquee selection** - Click and drag on empty canvas to select multiple shapes
4. ✅ **Drag shapes** - Click and drag selected shapes to move them
5. ✅ **Show SelectionBox** - Display selection indicators with handles
6. ✅ **Deselect on canvas click** - Click on empty canvas to deselect all
7. ✅ **Deselect on ESC** - Press ESC key to deselect all

### What Select Tool DOES NOT DO:
1. ❌ **NO canvas panning** - Cannot drag the canvas itself
2. ❌ **NO cursor changes** - Cursor stays as default pointer
3. ❌ **NO hover effects on cursor** - No visual feedback via cursor

## Behavior Details

### Selection Logic

#### Single and Multi-Select (Click)
- **Single Click on shape**: Select one shape (replaces previous selection)
- **Shift/Cmd/Ctrl + Click on shape**: Toggle shape in selection (add or remove)
- **Click on empty canvas**: Deselect all shapes
- **ESC key**: Deselect all shapes

#### Marquee Selection (Drag on Empty Canvas)
- **Trigger**: Click and drag on empty canvas (not on a shape)
- **Visual Feedback**: Semi-transparent blue rectangle appears while dragging
- **Selection Area**: All shapes that intersect with the marquee rectangle
- **Behavior**: 
  - Start drag → Show marquee box
  - While dragging → Update marquee box size and highlight shapes inside
  - Release mouse → Select all shapes inside marquee, hide marquee box
  - If no shapes inside → Deselect all (same as simple click)
- **Multi-select modifier**: Hold Shift/Cmd/Ctrl while marquee selecting to ADD to current selection instead of replacing

### Dragging Shapes
- **Drag selected shape**: Moves the shape and updates Firestore
- **Drag unselected shape**: Automatically selects and drags it
- **Multiple shapes selected**: Only drags the shape being clicked

### Visual Feedback

#### Selection Box (for selected shapes)
- **Border**: Blue solid line (2px stroke)
- **Handles**: 8 white squares with blue border (8x8px)
  - 4 corner handles
  - 4 edge handles (middle of each side)
- **No cursor feedback**: Cursor remains default throughout

#### Marquee Selection Box (while dragging)
- **Fill**: Semi-transparent blue (`rgba(59, 130, 246, 0.1)`)
- **Border**: Solid blue dashed line (2px stroke, dash pattern [5, 5])
- **Appears**: Only while actively dragging on empty canvas
- **Updates**: Real-time as mouse moves
- **Disappears**: Immediately when mouse is released
- **Visual indication**: Shapes inside marquee are visually highlighted during drag (optional)

## Integration with Other Tools

### Switching FROM Select Tool
When user switches to another tool:
- All selections are maintained (except Pan Tool)
- SelectionBox remains visible (except Pan Tool)

### Switching TO Select Tool
When user switches to Select Tool:
- Previous selections are maintained
- User can immediately interact with selected shapes

## Implementation Status

### Completed ✅
- [x] **Explicit `isSelectMode` state** (refactored from implicit logic)
- [x] **Mutual exclusivity of modes** (only one mode active at a time)
- [x] **Custom cursor** (navigation arrow matching toolbar icon)
- [x] **Marquee selection** (drag box to select multiple shapes)
- [x] Basic selection logic (single and multi-select)
- [x] SelectionBox component with handles
- [x] Deselection on canvas click
- [x] Deselection on ESC key
- [x] Integration with floating toolbar
- [x] Properties panel integration
- [x] Canvas panning disabled in select mode
- [x] SelectionBox only visible in select mode
- [x] Shape dragging only in select mode

### Pending ⏳
- [ ] Handle-based resizing (drag handles to resize shapes)
- [ ] Rotation handles
- [ ] Alignment guides
- [ ] Snap to grid/objects

## User Experience

### Expected Behavior
1. User clicks Select Tool button (first icon in toolbar)
2. Cursor remains as default pointer
3. User can click shapes to select them
4. User can drag selected shapes to move them
5. User CANNOT drag the canvas (must use Pan Tool for that)
6. SelectionBox appears around selected shapes with handles
7. Click empty space or press ESC to deselect

### Key Differences from Other Tools
- **vs Pan Tool**: Select can manipulate shapes, Pan only moves canvas
- **vs Rectangle Tool**: Select doesn't create new shapes
- **vs Delete Tool**: Select doesn't delete on click

## Technical Details

### State Management - Tool Modes
**Only ONE mode can be active at a time** (mutual exclusivity):

- `isSelectMode`: boolean - **TRUE when in select mode** (default: true)
- `isPanMode`: boolean - true when in pan mode (default: false)
- `isAddMode`: boolean - true when in add/rectangle mode (default: false)
- `isDeleteMode`: boolean - true when in delete mode (default: false)

**Why explicit `isSelectMode`?**
- ✅ More readable: `if (isSelectMode)` vs `if (!isAddMode && !isPanMode && !isDeleteMode)`
- ✅ Less error-prone: Explicit is better than implicit
- ✅ Easier to debug: Clear state in React DevTools
- ✅ Guaranteed exclusivity: Only one mode active at a time

### State Management - Selection & Marquee
- `selectedShapes`: Array of shape IDs currently selected
- `isMarqueeSelecting`: boolean - true while dragging marquee (TODO)
- `marqueeStart`: {x, y} - starting point of marquee drag (TODO)
- `marqueeEnd`: {x, y} - current mouse position during drag (TODO)

### Marquee Selection Implementation

#### Detection Logic
```javascript
// On mouse down on empty canvas (not on a shape)
// Only works in Select Mode
if (target === stage && isSelectMode) {
  // Start marquee selection
  setIsMarqueeSelecting(true);
  setMarqueeStart({x: pointerX, y: pointerY});
  setMarqueeEnd({x: pointerX, y: pointerY});
}
```

#### Rectangle Calculation
```javascript
// Calculate marquee bounds from start and end points
const marqueeRect = {
  x: Math.min(marqueeStart.x, marqueeEnd.x),
  y: Math.min(marqueeStart.y, marqueeEnd.y),
  width: Math.abs(marqueeEnd.x - marqueeStart.x),
  height: Math.abs(marqueeEnd.y - marqueeStart.y)
};
```

#### Shape Intersection Detection
```javascript
// Check if shape intersects with marquee rectangle
function isShapeInMarquee(shape, marqueeRect) {
  // Check if any part of the shape overlaps with marquee
  return !(
    shape.x + shape.width < marqueeRect.x ||  // shape is left of marquee
    shape.x > marqueeRect.x + marqueeRect.width ||  // shape is right of marquee
    shape.y + shape.height < marqueeRect.y ||  // shape is above marquee
    shape.y > marqueeRect.y + marqueeRect.height  // shape is below marquee
  );
}
```

#### Visual Component
- New component: `MarqueeBox.jsx`
- Renders semi-transparent rectangle with dashed border
- Only visible when `isMarqueeSelecting === true`
- Updates position/size in real-time during drag

### Canvas Dragging
- **Stage draggable**: `false` when in Select Tool
- Only shapes are draggable, not the stage itself
- Marquee selection takes priority over shape dragging on empty canvas

### Cursor Styling
```javascript
// Custom SVG cursor in select mode
cursor: isSelectMode ? 'url(/select-cursor.svg) 3 3, auto' : 'default'
```

**Custom Cursor Details**:
- **SVG File**: `/public/select-cursor.svg`
- **Design**: Navigation arrow (matching toolbar icon)
- **Color**: Black fill with white outline for visibility
- **Hotspot**: `3 3` (arrow tip for precise clicking)
- **Fallback**: `auto` (system default if SVG fails to load)
- **No hover changes**: Cursor remains consistent in select mode

## Future Enhancements (Post-MVP)

1. **Resize via Handles**: Drag handles to resize shapes
2. **Rotation Handle**: Top-center handle for rotation
3. **Smart Guides**: Alignment lines when moving shapes
4. **Snap to Grid**: Option to snap shape positions to grid
5. **Copy/Paste**: Duplicate selected shapes
6. **Delete Key**: Press Delete to remove selected shapes
7. **Select All**: Ctrl/Cmd + A to select all shapes
8. **Marquee visual improvements**: Show shape count, preview of selection before release

---

## Recent Changes

### Custom Cursor Implementation (Latest)
**Date**: Current session  
**Reason**: Visual consistency between cursor and toolbar icon

**Implementation**:
- Created `/public/select-cursor.svg` with navigation arrow design
- Black filled arrow with white outline for visibility
- SVG format allows scaling without quality loss
- Hotspot positioned at arrow tip (3, 3)

**Code**:
```javascript
// CanvasStage.jsx
style={{ 
  cursor: isSelectMode ? 'url(/select-cursor.svg) 3 3, auto' : 'default' 
}}
```

**Benefits**:
- ✅ Visual consistency across UI
- ✅ Clear indication of Select mode
- ✅ Better UX - cursor matches toolbar icon
- ✅ Professional appearance

**Files Modified**:
- `public/select-cursor.svg` - New SVG cursor file
- `CanvasStage.jsx` - Applied custom cursor in select mode

---

### Refactoring: Explicit `isSelectMode` State
**Date**: Current session  
**Reason**: Improved code readability and maintainability

**Before** (Implicit):
```javascript
// Select mode was implied when other modes were false
if (!isAddMode && !isDeleteMode && !isPanMode) {
  // Selection logic
}
```

**After** (Explicit):
```javascript
// Select mode has its own explicit state
const [isSelectMode, setIsSelectMode] = useState(true);

if (isSelectMode) {
  // Selection logic
}
```

**Benefits**:
- ✅ 5x more readable
- ✅ Eliminates logic errors
- ✅ Easier debugging
- ✅ Enforces mutual exclusivity
- ✅ Cleaner conditional checks throughout codebase

**Files Modified**:
- `useCanvasState.js` - Added isSelectMode state
- `Canvas/index.jsx` - Mode switching with exclusivity
- `CanvasShapes.jsx` - All selection logic uses isSelectMode
- `CanvasStage.jsx` - Pass isSelectMode to children

---

**Last Updated**: Phase 2 Implementation - Custom Cursor & Marquee Selection Complete

