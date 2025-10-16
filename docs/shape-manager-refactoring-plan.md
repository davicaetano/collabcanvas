# Shape Manager Refactoring Plan

## Overview
This document outlines the plan to refactor the shape management system by creating a centralized `useShapeManager` hook that will be the single source of truth for all shape-related operations.

## Current Architecture Issues

### Scattered Responsibilities
Currently, shape operations are spread across multiple files:

1. **useCanvasState.js** - Stores shapes state (`shapes`, `setShapes`)
2. **useShapeOperations.js** - Handles creation and batch operations
3. **CanvasShapes.jsx** - Directly updates Firestore for position changes
4. **PropertiesToolbar.jsx** - Directly updates Firestore for property changes
5. **useMultiplayer.js** - Syncs shapes from Firestore to local state
6. **useShapeSelection.js** - Manages selection state
7. **useShapeDrag.js** - Manages drag state

### Problems with Current Architecture

1. **Multiple Sources of Truth**: Shape updates happen in various places, making it hard to track data flow
2. **Direct Firestore Calls**: Components call Firestore directly, bypassing any centralized logic
3. **No Centralized Validation**: Each component must handle its own validation
4. **Difficult to Add Features**: Adding features like undo/redo, history, or local-first would require changes in many places
5. **No Optimistic Updates Strategy**: Each component implements its own optimistic update logic
6. **Hard to Debug**: Shape state changes are hard to trace across multiple files

## Proposed Architecture

### New Component: `useShapeManager`

Create a new hook `useShapeManager` that will:
- **Store** all shape-related state
- **Expose** all shape operations through a clean API
- **Handle** all Firestore synchronization internally
- **Provide** optimistic updates automatically
- **Validate** all shape changes centrally
- **Track** changes for future features (undo/redo, history)

### Data Flow

```
User Action
    ↓
Component calls useShapeManager method
    ↓
useShapeManager validates & updates local state (optimistic)
    ↓
useShapeManager syncs to Firestore
    ↓
Firestore realtime listener updates (via useMultiplayer)
    ↓
useShapeManager reconciles local vs remote state
```

## Implementation Plan

### Phase 1: Create Core ShapeManager Hook

**File**: `src/components/Canvas/hooks/useShapeManager.js`

#### Core Responsibilities:
1. **State Management**
   - Maintain shapes array
   - Maintain selection state
   - Maintain local pending changes

2. **CRUD Operations**
   - `createShape(shapeData)` - Create single shape
   - `createShapeBatch(shapesArray)` - Create multiple shapes
   - `updateShape(shapeId, updates)` - Update single shape
   - `updateShapeBatch(updatesMap)` - Update multiple shapes
   - `deleteShape(shapeId)` - Delete single shape
   - `deleteShapeBatch(shapeIds)` - Delete multiple shapes
   - `deleteAllShapes()` - Clear all shapes

3. **Query Operations**
   - `getShape(shapeId)` - Get single shape by ID
   - `getShapes(shapeIds)` - Get multiple shapes
   - `getAllShapes()` - Get all shapes
   - `getSelectedShapes()` - Get currently selected shapes

4. **Selection Management**
   - `selectShapes(shapeIds, additive)` - Select shapes (replace or add to selection)
   - `deselectShapes(shapeIds)` - Deselect specific shapes
   - `clearSelection()` - Clear all selection
   - `selectAll()` - Select all shapes
   - `getSelection()` - Get selected shape IDs

5. **Firestore Synchronization**
   - Internal: Handle optimistic updates
   - Internal: Sync local changes to Firestore
   - Internal: Reconcile Firestore updates with local state
   - Internal: Handle conflict resolution

6. **Validation**
   - Validate all shape property changes
   - Ensure shape data integrity

#### API Design:

```javascript
const shapeManager = useShapeManager(currentUser, sessionId);

// Shape operations
await shapeManager.createShape({ x, y, width, height, fill, stroke });
await shapeManager.updateShape(shapeId, { x: 100, y: 200 });
await shapeManager.deleteShape(shapeId);

// Batch operations
await shapeManager.updateShapeBatch({ 
  'shape1': { x: 100 }, 
  'shape2': { x: 200 } 
});

// Query operations
const shape = shapeManager.getShape(shapeId);
const shapes = shapeManager.getAllShapes();
const selected = shapeManager.getSelectedShapes();

// Selection operations
shapeManager.selectShapes([shapeId1, shapeId2], false); // Replace selection
shapeManager.selectShapes([shapeId3], true); // Add to selection
shapeManager.deselectShapes([shapeId1]);
shapeManager.clearSelection();
```

### Phase 2: Migrate Shape State

**Files to modify:**
- `src/components/Canvas/hooks/useCanvasState.js`
- `src/components/Canvas/index.jsx`

#### Changes:
1. Move `shapes` and `setShapes` from `useCanvasState` to `useShapeManager`
2. Move `selectedShapes` and `setSelectedShapes` from `useCanvasState` to `useShapeManager`
3. Update `Canvas/index.jsx` to use `useShapeManager` instead of direct state
4. Keep `useCanvasState` for UI state only (modes, zoom, pan, etc.)

### Phase 3: Refactor Shape Operations Hook

**File**: `src/components/Canvas/hooks/useShapeOperations.js`

#### Changes:
1. **Option A**: Deprecate this hook and move all operations to `useShapeManager`
2. **Option B**: Make this hook a thin wrapper around `useShapeManager`

**Recommendation**: Option A - consolidate everything into `useShapeManager`

### Phase 4: Refactor CanvasShapes Component

**File**: `src/components/Canvas/CanvasShapes.jsx`

#### Current Issues:
- Directly calls `updateShapeInFirestore` for drag operations
- Directly calls `deleteShapeInFirestore` for delete operations
- Manages local positions for drag preview
- Handles selection logic

#### Changes:
1. Remove direct Firestore imports
2. Use `shapeManager.updateShape()` for position updates
3. Use `shapeManager.deleteShape()` for deletions
4. Use `shapeManager.selectShapes()` for selection
5. Keep local position tracking for smooth drag preview
6. On drag end, call `shapeManager.updateShapeBatch()` for final position

#### New Props:
```javascript
<CanvasShapes
  shapeManager={shapeManager}  // Pass manager instead of shapes array
  isSelectMode={isSelectMode}
  isDeleteMode={isDeleteMode}
  isPanMode={isPanMode}
  // ... other props
/>
```

### Phase 5: Refactor PropertiesToolbar Component

**File**: `src/components/Canvas/PropertiesToolbar.jsx`

#### Current Issues:
- Directly calls `updateShapeInFirestore`
- Implements own optimistic update logic
- Manually updates shapes array via `onShapesChange`

#### Changes:
1. Remove direct Firestore imports
2. Remove `onShapesChange` prop
3. Use `shapeManager.updateShape()` for all property changes
4. Remove manual optimistic update logic (handled by manager)
5. Get shapes from `shapeManager.getSelectedShapes()`

#### New Props:
```javascript
<PropertiesToolbar
  shapeManager={shapeManager}  // Pass manager instead of individual props
/>
```

### Phase 6: Refactor Selection Hook

**File**: `src/components/Canvas/hooks/useShapeSelection.js`

#### Changes:
1. Remove `selectedShapes` and `setSelectedShapes` from params
2. Get selection state from `shapeManager`
3. Use `shapeManager.selectShapes()`, `clearSelection()`, etc.
4. Keep marquee logic but delegate final selection to manager

### Phase 7: Update Multiplayer Hook

**File**: `src/components/Canvas/hooks/useMultiplayer.js`

#### Changes:
1. Instead of calling `setShapes` directly from Firestore listener
2. Call `shapeManager.syncFromFirestore(shapes)` to handle reconciliation
3. Let manager handle merging remote changes with local pending changes
4. Ensure session-based conflict resolution (don't overwrite own pending changes)

### Phase 8: Refactor Drawing Hook

**File**: `src/components/Canvas/hooks/useDrawing.js`

#### Changes:
1. Replace `createShapeAt` parameter with `shapeManager`
2. Use `shapeManager.createShape()` instead of `createShapeAt()`

### Phase 9: Update Canvas Handlers

**File**: `src/components/Canvas/hooks/useCanvasHandlers.js`

#### Changes:
1. Remove `useShapeOperations` import
2. Pass `shapeManager` to hooks that need it
3. Update handler functions to use `shapeManager` methods

### Phase 10: Update Main Canvas Component

**File**: `src/components/Canvas/index.jsx`

#### Changes:
1. Add `const shapeManager = useShapeManager(currentUser, sessionId);`
2. Pass `shapeManager` to all child components
3. Remove individual shape-related props
4. Update `useMultiplayer` to work with `shapeManager`

## Migration Strategy

### Step-by-Step Migration

1. **Create `useShapeManager` with basic structure** (non-breaking)
   - Implement core state and basic CRUD methods
   - Add comprehensive tests

2. **Add `useShapeManager` alongside existing code** (non-breaking)
   - Initialize manager in Canvas component
   - Don't use it yet, just wire it up

3. **Migrate one component at a time** (incremental)
   - Start with PropertiesToolbar (simplest)
   - Then CanvasShapes (most complex)
   - Then hooks one by one

4. **Remove old code** (cleanup)
   - Remove `useShapeOperations` hook
   - Remove shape state from `useCanvasState`
   - Remove direct Firestore calls from components

### Testing Strategy

For each phase:
1. Write unit tests for new manager methods
2. Write integration tests for component interactions
3. Test multiplayer scenarios (multiple users editing simultaneously)
4. Test offline scenarios
5. Test conflict resolution (same shape edited by multiple users)

### Rollback Plan

- Keep old code in place until new code is fully tested
- Use feature flag to switch between old and new implementation
- If issues found, can quickly revert to old code

## Benefits of New Architecture

### Immediate Benefits:
1. **Single Source of Truth**: All shape operations go through one place
2. **Easier Debugging**: Can log all shape changes in one location
3. **Better Testing**: Can test shape logic independently
4. **Cleaner Components**: Components become simpler, just UI logic

### Future Benefits:
1. **Undo/Redo**: Manager can maintain history of all changes
2. **Local-First**: Can implement offline mode with sync queue
3. **Conflict Resolution**: Centralized place to handle conflicts
4. **Optimizations**: Can batch multiple updates, debounce, etc.
5. **Validation**: All validation in one place
6. **Permissions**: Easy to add permission checks for all operations
7. **Audit Log**: Track who changed what and when

## Detailed File Changes

### Files to Create:
1. `src/components/Canvas/hooks/useShapeManager.js` - New main hook

### Files to Modify:
1. `src/components/Canvas/hooks/useCanvasState.js` - Remove shape state
2. `src/components/Canvas/hooks/useShapeOperations.js` - Deprecate or remove
3. `src/components/Canvas/hooks/useShapeSelection.js` - Use manager for selection
4. `src/components/Canvas/hooks/useShapeDrag.js` - Minimal changes
5. `src/components/Canvas/hooks/useDrawing.js` - Use manager for creation
6. `src/components/Canvas/hooks/useCanvasHandlers.js` - Pass manager to hooks
7. `src/components/Canvas/hooks/useMultiplayer.js` - Sync through manager
8. `src/components/Canvas/CanvasShapes.jsx` - Use manager for operations
9. `src/components/Canvas/PropertiesToolbar.jsx` - Use manager for updates
10. `src/components/Canvas/index.jsx` - Initialize and pass manager

### Files to Delete (eventually):
1. `src/components/Canvas/hooks/useShapeOperations.js` - Functionality moved to manager

## Implementation Timeline

### Week 1: Foundation
- Create `useShapeManager` hook with core functionality
- Write comprehensive unit tests
- Document API

### Week 2: Integration
- Wire up manager in Canvas component
- Migrate PropertiesToolbar
- Test and verify

### Week 3: Component Migration
- Migrate CanvasShapes component
- Migrate selection hooks
- Test multiplayer scenarios

### Week 4: Hook Migration
- Migrate remaining hooks
- Remove old code
- Update documentation

### Week 5: Testing & Polish
- End-to-end testing
- Performance testing
- Bug fixes and optimizations

## Risks and Mitigations

### Risk 1: Breaking Existing Functionality
**Mitigation**: 
- Incremental migration
- Feature flag for rollback
- Comprehensive testing at each step

### Risk 2: Performance Degradation
**Mitigation**:
- Benchmark before and after
- Optimize manager implementation
- Use React.memo and useMemo where needed

### Risk 3: Multiplayer Sync Issues
**Mitigation**:
- Test with multiple users from start
- Add conflict resolution early
- Monitor Firestore read/write counts

### Risk 4: Complex State Management
**Mitigation**:
- Keep manager API simple
- Document state flow clearly
- Add debugging tools to manager

## Success Criteria

1. ✅ All shape operations go through `useShapeManager`
2. ✅ No direct Firestore calls from components
3. ✅ All tests passing
4. ✅ No performance degradation
5. ✅ Multiplayer still works correctly
6. ✅ Code is more maintainable (measured by complexity metrics)
7. ✅ Easier to add new features (validate with one new feature)

## Future Enhancements

Once this refactoring is complete, it will be easier to add:

1. **Undo/Redo System**
   - Manager can maintain operation history
   - Can replay or reverse operations

2. **Local-First Architecture**
   - Queue operations when offline
   - Sync when connection restored

3. **Advanced Conflict Resolution**
   - Operational transforms
   - CRDTs for concurrent editing

4. **Shape Locking**
   - Prevent others from editing your shapes
   - Lock shapes during editing

5. **Shape Versioning**
   - Track shape changes over time
   - View shape history

6. **Performance Optimizations**
   - Virtual scrolling for large canvases
   - Lazy loading of shapes
   - Efficient diffing algorithms

## Questions to Resolve

1. **Selection State**: Should selection be part of `useShapeManager` or separate?
   - **Decision**: Include in manager for consistency

2. **Drag State**: Should local drag positions be in manager?
   - **Decision**: Keep in CanvasShapes for 60fps rendering

3. **Validation**: Where should complex validation live?
   - **Decision**: In manager, but expose validation functions

4. **Error Handling**: How to handle Firestore errors?
   - **Decision**: Manager exposes error state, components can display

5. **Type Safety**: Should we add TypeScript?
   - **Decision**: Future enhancement, document types for now

## Appendix: Code Examples

### Example: useShapeManager Implementation (Simplified)

```javascript
import { useState, useCallback, useRef } from 'react';
import { validateProperty } from '../../../utils/propertyValidation';
import { 
  createShape as createShapeInFirestore,
  updateShape as updateShapeInFirestore,
  deleteShape as deleteShapeInFirestore,
  updateShapesBatch as updateShapesBatchInFirestore,
} from '../../../utils/firestore';

export const useShapeManager = (currentUser, sessionId) => {
  // State
  const [shapes, setShapes] = useState([]);
  const [selectedShapes, setSelectedShapes] = useState([]);
  
  // Track pending changes to avoid overwriting with stale Firestore data
  const pendingChanges = useRef(new Map()); // shapeId -> timestamp
  
  // Create shape
  const createShape = useCallback(async (shapeData) => {
    if (!currentUser) return null;
    
    const newShape = {
      id: Date.now().toString(),
      ...shapeData,
    };
    
    // Optimistic update
    setShapes(prev => [...prev, newShape]);
    
    // Sync to Firestore
    try {
      await createShapeInFirestore(newShape, currentUser.uid, sessionId);
      return newShape;
    } catch (error) {
      console.error('Failed to create shape:', error);
      // Rollback optimistic update
      setShapes(prev => prev.filter(s => s.id !== newShape.id));
      throw error;
    }
  }, [currentUser, sessionId]);
  
  // Update shape
  const updateShape = useCallback(async (shapeId, updates) => {
    // Validate updates
    const validatedUpdates = {};
    for (const [key, value] of Object.entries(updates)) {
      const validated = validateProperty(key, value);
      if (validated !== null) {
        validatedUpdates[key] = validated;
      }
    }
    
    // Track pending change
    pendingChanges.current.set(shapeId, Date.now());
    
    // Optimistic update
    setShapes(prev => prev.map(shape =>
      shape.id === shapeId ? { ...shape, ...validatedUpdates } : shape
    ));
    
    // Sync to Firestore
    try {
      await updateShapeInFirestore(shapeId, validatedUpdates, sessionId);
      // Clear pending change after successful sync
      setTimeout(() => {
        pendingChanges.current.delete(shapeId);
      }, 1000);
    } catch (error) {
      console.error('Failed to update shape:', error);
      pendingChanges.current.delete(shapeId);
      throw error;
    }
  }, [sessionId]);
  
  // Delete shape
  const deleteShape = useCallback(async (shapeId) => {
    // Optimistic update
    const deleted = shapes.find(s => s.id === shapeId);
    setShapes(prev => prev.filter(s => s.id !== shapeId));
    setSelectedShapes(prev => prev.filter(id => id !== shapeId));
    
    // Sync to Firestore
    try {
      await deleteShapeInFirestore(shapeId);
    } catch (error) {
      console.error('Failed to delete shape:', error);
      // Rollback optimistic update
      if (deleted) {
        setShapes(prev => [...prev, deleted]);
      }
      throw error;
    }
  }, [shapes]);
  
  // Get shapes
  const getAllShapes = useCallback(() => shapes, [shapes]);
  const getShape = useCallback((shapeId) => shapes.find(s => s.id === shapeId), [shapes]);
  const getSelectedShapes = useCallback(() => {
    return selectedShapes.map(id => shapes.find(s => s.id === id)).filter(Boolean);
  }, [shapes, selectedShapes]);
  
  // Selection
  const selectShapes = useCallback((shapeIds, additive = false) => {
    if (additive) {
      setSelectedShapes(prev => [...new Set([...prev, ...shapeIds])]);
    } else {
      setSelectedShapes(shapeIds);
    }
  }, []);
  
  const clearSelection = useCallback(() => {
    setSelectedShapes([]);
  }, []);
  
  // Sync from Firestore (called by multiplayer hook)
  const syncFromFirestore = useCallback((firestoreShapes) => {
    setShapes(prev => {
      // Merge Firestore shapes with local shapes
      // Don't overwrite shapes with pending changes
      const now = Date.now();
      const merged = [...firestoreShapes];
      
      prev.forEach(localShape => {
        const hasPending = pendingChanges.current.has(localShape.id);
        const pendingAge = now - (pendingChanges.current.get(localShape.id) || 0);
        
        // Keep local version if pending and recent (< 2 seconds)
        if (hasPending && pendingAge < 2000) {
          const index = merged.findIndex(s => s.id === localShape.id);
          if (index >= 0) {
            merged[index] = localShape;
          }
        }
      });
      
      return merged;
    });
  }, []);
  
  return {
    // State
    shapes: getAllShapes(),
    selectedShapeIds: selectedShapes,
    selectedShapes: getSelectedShapes(),
    
    // CRUD
    createShape,
    updateShape,
    deleteShape,
    
    // Query
    getShape,
    getAllShapes,
    getSelectedShapes,
    
    // Selection
    selectShapes,
    clearSelection,
    
    // Sync
    syncFromFirestore,
  };
};
```

### Example: Updated PropertiesToolbar

```javascript
// Before:
const PropertiesToolbar = ({ selectedShapes = [], shapes = [], onShapesChange }) => {
  const handlePropertyUpdate = async (shapeId, propertyName, newValue) => {
    const validatedValue = validateProperty(propertyName, newValue);
    if (validatedValue === null) return;
    
    // Optimistic update
    const updatedShapes = shapes.map(shape => 
      shape.id === shapeId ? { ...shape, [propertyName]: validatedValue } : shape
    );
    onShapesChange(updatedShapes);
    
    // Sync to Firestore
    await updateShapeInFirestore(shapeId, { [propertyName]: validatedValue });
  };
  // ...
};

// After:
const PropertiesToolbar = ({ shapeManager }) => {
  const selectedShapes = shapeManager.getSelectedShapes();
  
  const handlePropertyUpdate = async (shapeId, propertyName, newValue) => {
    // All validation and sync handled by manager
    await shapeManager.updateShape(shapeId, { [propertyName]: newValue });
  };
  // ...
};
```

## Conclusion

This refactoring will significantly improve the maintainability and extensibility of the codebase by centralizing all shape-related logic into a single, well-tested hook. The migration can be done incrementally with minimal risk, and will set the foundation for advanced features like undo/redo and local-first architecture.

