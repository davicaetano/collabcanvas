# Properties Toolbar Implementation Plan

## Overview

Create a comprehensive properties panel on the right side of the canvas interface, similar to design tools like Figma and Adobe XD. This toolbar will handle property editing for selected canvas objects and global canvas settings.

## Visual Design & Positioning

### Layout Integration

```
Canvas (main container - fixed inset-0, flex flex-row)
├── Left Content (flex-1)
│   ├── CanvasHeader (full width header)
│   ├── CanvasStage (main canvas area)
│   └── FloatingToolbar (bottom center)
└── PropertiesToolbar (fixed width right panel)
```

### Positioning Specifications

- **Position**: Fixed right side panel
- **Width**: 320px (standard properties panel width)
- **Height**: Full viewport height minus header
- **Background**: Light gray/white with subtle border
- **Scroll**: Vertical scrolling for long content
- **Responsive**: Collapsible on smaller screens

## Architecture & State Management

### Property Categories

#### 1. Canvas Properties
- **Background**: Color, patterns, images
- **Grid Settings**: Size, color, visibility, snap-to-grid
- **Zoom**: Current zoom level, fit-to-screen controls
- **Canvas Size**: Viewport dimensions, infinite canvas toggle

#### 2. Shape Properties (when shapes selected)
- **Position**: X, Y coordinates with precision controls
- **Size**: Width, height, lock aspect ratio
- **Appearance**: Fill color, stroke color, stroke width
- **Transform**: Rotation, opacity, blend modes
- **Advanced**: Corner radius (rectangles), shadow effects

#### 3. Selection Properties
- **Multi-select**: Show common properties when multiple shapes selected
- **No Selection**: Show canvas properties by default
- **Mixed Values**: Handle different values across selected objects

### State Integration

#### Current Canvas State Connection
```javascript
// From existing useCanvasState
- shapes (for selected object properties)
- selectedColor (current fill/stroke color)
- stageScale, stageX, stageY (zoom and position)
- Additional state needed:
  - selectedShapes: Array of selected shape IDs
  - canvasSettings: Grid, background, etc.
```

#### Property Update Flow
1. **User changes property** → PropertiesToolbar component
2. **Validate input** → Property validation logic  
3. **Update local state** → Optimistic UI updates
4. **Sync to Firestore** → Real-time collaboration
5. **Update canvas rendering** → Immediate visual feedback

## Component Structure

### 1. PropertiesToolbar (Main Container)
**File**: `src/components/Canvas/PropertiesToolbar.jsx`
- **Collapsible sections** for different property categories
- **Responsive design** with mobile considerations
- **Scroll container** for long property lists

### 2. Property Section Components

#### CanvasProperties.jsx
- Grid settings (size, color, snap)
- Background color/pattern selection
- Zoom controls and canvas size
- View options (rulers, guides)

#### ShapeProperties.jsx
- Position and size inputs with live preview
- Color pickers for fill and stroke
- Style controls (stroke width, corner radius)
- Transform controls (rotation, opacity)

#### SelectionProperties.jsx
- Handle single vs multi-selection
- Show common properties when multiple objects selected
- Batch update capabilities

### 3. Property Input Components

#### ColorPicker.jsx
- **Modern color picker** with HSL, RGB, HEX inputs
- **Recent colors** and **canvas color palette**
- **Eyedropper tool** for sampling colors

#### NumericInput.jsx
- **Precise number inputs** with step controls
- **Unit support** (px, %, degrees)
- **Keyboard shortcuts** (arrow keys for increment/decrement)

#### SliderInput.jsx
- **Visual sliders** for properties like opacity, rotation
- **Real-time preview** while dragging
- **Snap points** for common values (0°, 90°, 180°, etc.)

## Layout Changes Required

### Canvas Component Restructure
**File**: `src/components/Canvas/index.jsx`

```jsx
// New layout structure
<div className="fixed inset-0 w-screen h-screen flex flex-row">
  {/* Left content area */}
  <div className="flex-1 flex flex-col">
    <CanvasHeader /> {/* Full width */}
    <CanvasStage />  {/* Flexible height */}
    <FloatingToolbar />
  </div>
  
  {/* Right properties panel */}
  <PropertiesToolbar 
    selectedShapes={selectedShapes}
    canvasSettings={canvasSettings}
    onUpdateShape={handleShapeUpdate}
    onUpdateCanvas={handleCanvasUpdate}
  />
</div>
```

### Responsive Considerations
- **Desktop** (>1024px): Always visible 320px panel
- **Tablet** (768px-1024px): 280px panel, collapsible
- **Mobile** (<768px): Hidden by default, slide-over modal

## Property Types & Controls

### 1. Position & Size Properties
```javascript
{
  x: { type: 'number', unit: 'px', step: 1 },
  y: { type: 'number', unit: 'px', step: 1 },
  width: { type: 'number', unit: 'px', step: 1, min: 1 },
  height: { type: 'number', unit: 'px', step: 1, min: 1 },
  lockAspectRatio: { type: 'boolean' }
}
```

### 2. Appearance Properties
```javascript
{
  fill: { type: 'color', alpha: true },
  stroke: { type: 'color', alpha: true },
  strokeWidth: { type: 'slider', min: 0, max: 50, step: 1 },
  opacity: { type: 'slider', min: 0, max: 1, step: 0.01 }
}
```

### 3. Canvas Properties
```javascript
{
  backgroundColor: { type: 'color' },
  gridSize: { type: 'number', min: 5, max: 100, step: 5 },
  gridColor: { type: 'color', alpha: true },
  gridVisible: { type: 'boolean' },
  snapToGrid: { type: 'boolean' }
}
```

## Implementation Steps

### Phase 1: Basic Structure (2-3 hours)
1. **Create PropertiesToolbar component** with basic layout
2. **Modify Canvas layout** to accommodate right panel
3. **Add responsive design** and collapsible functionality
4. **Test layout changes** don't break existing features

### Phase 2: Selection Management (2-3 hours)
1. **Add selectedShapes state** to canvas state management
2. **Implement shape selection logic** in CanvasStage
3. **Create selection indicators** (highlight, selection box)
4. **Handle click-to-select** and multi-select functionality

### Phase 3: Basic Property Controls (3-4 hours)
1. **Create property input components** (NumericInput, ColorPicker, etc.)
2. **Implement ShapeProperties component** with position/size controls
3. **Add property update handlers** with Firestore sync
4. **Test real-time property updates** across multiple users

### Phase 4: Advanced Properties (2-3 hours)
1. **Add CanvasProperties component** for global settings
2. **Implement advanced shape properties** (rotation, opacity)
3. **Add property validation** and error handling
4. **Create property presets** and batch update functionality

### Phase 5: Polish & Testing (1-2 hours)
1. **Add smooth animations** for property changes
2. **Implement keyboard shortcuts** for property editing
3. **Add undo/redo support** for property changes
4. **Test responsive behavior** and mobile experience

## Files to Create/Modify

### New Files
- `src/components/Canvas/PropertiesToolbar.jsx` - Main properties panel
- `src/components/Canvas/properties/CanvasProperties.jsx` - Canvas settings
- `src/components/Canvas/properties/ShapeProperties.jsx` - Shape editing
- `src/components/Canvas/properties/SelectionProperties.jsx` - Selection handling
- `src/components/Canvas/properties/inputs/ColorPicker.jsx` - Color selection
- `src/components/Canvas/properties/inputs/NumericInput.jsx` - Number inputs
- `src/components/Canvas/properties/inputs/SliderInput.jsx` - Slider controls
- `src/utils/propertyValidation.js` - Property validation logic
- `docs/properties-toolbar-plan.md` - This implementation plan

### Modified Files
- `src/components/Canvas/index.jsx` - Layout restructure for right panel
- `src/components/Canvas/hooks/useCanvasState.js` - Add selection state
- `src/components/Canvas/hooks/useCanvasHandlers.js` - Selection logic
- `src/components/Canvas/CanvasStage.jsx` - Selection interaction
- `src/components/Canvas/CanvasShapes.jsx` - Selection indicators
- `src/utils/canvas.js` - Properties panel constants
- `src/utils/firestore.js` - Property update functions

## Success Criteria

### Core Functionality
- ✅ Properties panel visible on right side without breaking layout
- ✅ Shape selection works with visual feedback
- ✅ Position and size properties update shapes in real-time
- ✅ Color changes sync across all users instantly
- ✅ Canvas properties (grid, background) update globally

### User Experience  
- ✅ Smooth animations when properties change
- ✅ Responsive design works on different screen sizes
- ✅ Properties panel is collapsible and doesn't interfere with canvas
- ✅ Input validation prevents invalid property values
- ✅ Multi-select shows common properties appropriately

### Performance
- ✅ Property updates don't cause canvas performance issues
- ✅ Real-time sync maintains <100ms latency for property changes
- ✅ Panel scrolling is smooth with 100+ properties
- ✅ Selection of 50+ shapes remains responsive

## Future Enhancements (Post-MVP)

### Advanced Property Features
- **Property presets** and style libraries
- **Property animations** and transitions  
- **Advanced transforms** (skew, perspective)
- **Layer effects** (shadows, blur, etc.)
- **Property expressions** and linked values

### Collaboration Features
- **Property locks** (prevent others from editing)
- **Property comments** and annotations
- **Change history** per property
- **Real-time property cursors** showing who's editing what

### Workflow Improvements
- **Keyboard shortcuts** for all property operations
- **Property search** and filtering
- **Custom property panels** per object type
- **Batch operations** on selected objects
- **Property export/import** for reusability

---

This properties toolbar will transform CollabCanvas from a basic drawing tool into a professional design application with precise control over every aspect of the canvas and its contents.

