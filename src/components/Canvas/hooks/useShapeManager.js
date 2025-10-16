import { useState, useCallback, useRef } from 'react';
import { validateProperty } from '../../../utils/propertyValidation';
import { 
  createShape as createShapeInFirestore,
  updateShape as updateShapeInFirestore,
  deleteShape as deleteShapeInFirestore,
  updateShapesBatch as updateShapesBatchInFirestore,
  addShapesBatch as addShapesBatchInFirestore,
  deleteAllShapes as deleteAllShapesInFirestore,
} from '../../../utils/firestore';
import { 
  DEFAULT_SHAPE_WIDTH,
  DEFAULT_SHAPE_HEIGHT,
  SHAPE_STROKE_WIDTH,
} from '../../../utils/canvas';

/**
 * Central Shape Manager Hook
 * 
 * This hook is the single source of truth for all shape-related operations.
 * It manages shape state, selection, CRUD operations, and Firestore synchronization.
 * 
 * Features:
 * - Optimistic updates (update local state immediately, sync to Firestore after)
 * - Automatic rollback on Firestore errors
 * - Conflict resolution (doesn't overwrite pending local changes with stale Firestore data)
 * - Centralized validation
 * - Clean API for all shape operations
 * 
 * @param {Object} currentUser - Current authenticated user
 * @param {string} sessionId - Unique session ID for this browser tab
 * @returns {Object} Shape manager API
 */
export const useShapeManager = (currentUser, sessionId) => {
  const isDevMode = import.meta.env.VITE_DEV_MODE === 'true';
  
  // ==================== STATE ====================
  
  // All shapes in the canvas
  const [shapes, setShapes] = useState([]);
  
  // Selected shape IDs
  const [selectedShapeIds, setSelectedShapeIds] = useState([]);
  
  // Track pending changes to avoid overwriting with stale Firestore data
  // Map: shapeId -> timestamp of last local change
  const pendingChanges = useRef(new Map());
  
  // Timestamp when last Firestore sync happened
  const lastSyncTimestamp = useRef(0);
  
  if (isDevMode) {
    console.log('[ShapeManager] Initialized', {
      shapesCount: shapes.length,
      selectedCount: selectedShapeIds.length,
      pendingChanges: pendingChanges.current.size,
    });
  }
  
  // ==================== CRUD OPERATIONS ====================
  
  /**
   * Create a single shape
   * @param {Object} shapeData - Shape properties (x, y, width, height, fill, stroke, etc.)
   * @returns {Promise<Object>} Created shape
   */
  const createShape = useCallback(async (shapeData) => {
    if (!currentUser) {
      if (isDevMode) console.warn('[ShapeManager] createShape: No user authenticated');
      return null;
    }
    
    // Generate unique ID
    const newShape = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      x: shapeData.x || 0,
      y: shapeData.y || 0,
      width: shapeData.width || DEFAULT_SHAPE_WIDTH,
      height: shapeData.height || DEFAULT_SHAPE_HEIGHT,
      fill: shapeData.fill || '#3B82F6',
      stroke: shapeData.stroke || '#3B82F6',
      strokeWidth: shapeData.strokeWidth || SHAPE_STROKE_WIDTH,
      ...shapeData,
    };
    
    if (isDevMode) {
      console.log('[ShapeManager] createShape: Creating shape', newShape);
    }
    
    // Optimistic update - add to local state immediately
    setShapes(prev => [...prev, newShape]);
    
    // Sync to Firestore
    try {
      await createShapeInFirestore(newShape, currentUser.uid, sessionId);
      
      if (isDevMode) {
        console.log('[ShapeManager] createShape: Successfully synced to Firestore', newShape.id);
      }
      
      return newShape;
    } catch (error) {
      console.error('[ShapeManager] createShape: Failed to sync to Firestore', error);
      
      // Rollback optimistic update
      setShapes(prev => prev.filter(s => s.id !== newShape.id));
      
      throw error;
    }
  }, [currentUser, sessionId, isDevMode]);
  
  /**
   * Create multiple shapes at once (batch operation)
   * @param {Array<Object>} shapesData - Array of shape properties
   * @returns {Promise<Array<Object>>} Created shapes
   */
  const createShapeBatch = useCallback(async (shapesData) => {
    if (!currentUser) {
      if (isDevMode) console.warn('[ShapeManager] createShapeBatch: No user authenticated');
      return [];
    }
    
    // Generate shapes with IDs
    const baseTimestamp = Date.now();
    const newShapes = shapesData.map((shapeData, index) => ({
      id: `${baseTimestamp}-${index}-${Math.random().toString(36).substr(2, 9)}`,
      x: shapeData.x || 0,
      y: shapeData.y || 0,
      width: shapeData.width || DEFAULT_SHAPE_WIDTH,
      height: shapeData.height || DEFAULT_SHAPE_HEIGHT,
      fill: shapeData.fill || '#3B82F6',
      stroke: shapeData.stroke || '#3B82F6',
      strokeWidth: shapeData.strokeWidth || SHAPE_STROKE_WIDTH,
      userId: currentUser.uid,
      ...shapeData,
    }));
    
    if (isDevMode) {
      console.log('[ShapeManager] createShapeBatch: Creating shapes', newShapes.length);
    }
    
    // Optimistic update - add all to local state immediately
    setShapes(prev => [...prev, ...newShapes]);
    
    // Sync to Firestore
    try {
      await addShapesBatchInFirestore(newShapes);
      
      if (isDevMode) {
        console.log('[ShapeManager] createShapeBatch: Successfully synced to Firestore', newShapes.length);
      }
      
      return newShapes;
    } catch (error) {
      console.error('[ShapeManager] createShapeBatch: Failed to sync to Firestore', error);
      
      // Rollback optimistic update - remove all created shapes
      const createdIds = newShapes.map(s => s.id);
      setShapes(prev => prev.filter(s => !createdIds.includes(s.id)));
      
      throw error;
    }
  }, [currentUser, sessionId, isDevMode]);
  
  /**
   * Update a single shape
   * @param {string} shapeId - Shape ID
   * @param {Object} updates - Properties to update
   * @returns {Promise<void>}
   */
  const updateShape = useCallback(async (shapeId, updates) => {
    if (isDevMode) {
      console.log('[ShapeManager] updateShape: Updating shape', shapeId, updates);
    }
    
    // Validate all updates
    const validatedUpdates = {};
    for (const [key, value] of Object.entries(updates)) {
      const validated = validateProperty(key, value);
      if (validated !== null) {
        validatedUpdates[key] = validated;
      } else {
        if (isDevMode) {
          console.warn('[ShapeManager] updateShape: Invalid property', key, value);
        }
      }
    }
    
    // If no valid updates, return early
    if (Object.keys(validatedUpdates).length === 0) {
      if (isDevMode) {
        console.warn('[ShapeManager] updateShape: No valid updates to apply');
      }
      return;
    }
    
    // Track this change as pending
    pendingChanges.current.set(shapeId, Date.now());
    
    // Optimistic update - update local state immediately
    setShapes(prev => prev.map(shape =>
      shape.id === shapeId ? { ...shape, ...validatedUpdates } : shape
    ));
    
    // Sync to Firestore
    try {
      await updateShapeInFirestore(shapeId, validatedUpdates, sessionId);
      
      if (isDevMode) {
        console.log('[ShapeManager] updateShape: Successfully synced to Firestore', shapeId);
      }
      
      // Clear pending change after successful sync (with delay to ensure Firestore listener has fired)
      setTimeout(() => {
        pendingChanges.current.delete(shapeId);
      }, 1000);
      
    } catch (error) {
      console.error('[ShapeManager] updateShape: Failed to sync to Firestore', error);
      
      // Clear pending change on error
      pendingChanges.current.delete(shapeId);
      
      // Note: We don't rollback on error because Firestore might be temporarily offline
      // The next Firestore sync will correct the state if needed
      
      throw error;
    }
  }, [sessionId, isDevMode]);
  
  /**
   * Update multiple shapes at once (batch operation)
   * @param {Object} updatesMap - Map of shapeId -> updates
   * @returns {Promise<void>}
   */
  const updateShapeBatch = useCallback(async (updatesMap) => {
    if (isDevMode) {
      console.log('[ShapeManager] updateShapeBatch: Updating shapes', Object.keys(updatesMap).length);
    }
    
    // Validate all updates
    const validatedUpdatesMap = {};
    for (const [shapeId, updates] of Object.entries(updatesMap)) {
      const validatedUpdates = {};
      for (const [key, value] of Object.entries(updates)) {
        const validated = validateProperty(key, value);
        if (validated !== null) {
          validatedUpdates[key] = validated;
        }
      }
      if (Object.keys(validatedUpdates).length > 0) {
        validatedUpdatesMap[shapeId] = validatedUpdates;
      }
    }
    
    // If no valid updates, return early
    if (Object.keys(validatedUpdatesMap).length === 0) {
      if (isDevMode) {
        console.warn('[ShapeManager] updateShapeBatch: No valid updates to apply');
      }
      return;
    }
    
    // Track all changes as pending
    const now = Date.now();
    Object.keys(validatedUpdatesMap).forEach(shapeId => {
      pendingChanges.current.set(shapeId, now);
    });
    
    // Optimistic update - update all shapes in local state immediately
    setShapes(prev => prev.map(shape => {
      const updates = validatedUpdatesMap[shape.id];
      return updates ? { ...shape, ...updates } : shape;
    }));
    
    // Sync to Firestore
    try {
      await updateShapesBatchInFirestore(validatedUpdatesMap, sessionId);
      
      if (isDevMode) {
        console.log('[ShapeManager] updateShapeBatch: Successfully synced to Firestore', Object.keys(validatedUpdatesMap).length);
      }
      
      // Clear pending changes after successful sync
      setTimeout(() => {
        Object.keys(validatedUpdatesMap).forEach(shapeId => {
          pendingChanges.current.delete(shapeId);
        });
      }, 1000);
      
    } catch (error) {
      console.error('[ShapeManager] updateShapeBatch: Failed to sync to Firestore', error);
      
      // Clear pending changes on error
      Object.keys(validatedUpdatesMap).forEach(shapeId => {
        pendingChanges.current.delete(shapeId);
      });
      
      throw error;
    }
  }, [sessionId, isDevMode]);
  
  /**
   * Delete a single shape
   * @param {string} shapeId - Shape ID to delete
   * @returns {Promise<void>}
   */
  const deleteShape = useCallback(async (shapeId) => {
    if (isDevMode) {
      console.log('[ShapeManager] deleteShape: Deleting shape', shapeId);
    }
    
    // Store deleted shape for potential rollback
    const deletedShape = shapes.find(s => s.id === shapeId);
    
    // Optimistic update - remove from local state immediately
    setShapes(prev => prev.filter(s => s.id !== shapeId));
    
    // Also remove from selection if selected
    setSelectedShapeIds(prev => prev.filter(id => id !== shapeId));
    
    // Sync to Firestore
    try {
      await deleteShapeInFirestore(shapeId);
      
      if (isDevMode) {
        console.log('[ShapeManager] deleteShape: Successfully synced to Firestore', shapeId);
      }
      
    } catch (error) {
      console.error('[ShapeManager] deleteShape: Failed to sync to Firestore', error);
      
      // Rollback optimistic update
      if (deletedShape) {
        setShapes(prev => [...prev, deletedShape]);
      }
      
      throw error;
    }
  }, [shapes, isDevMode]);
  
  /**
   * Delete all shapes in the canvas
   * @returns {Promise<void>}
   */
  const deleteAllShapes = useCallback(async () => {
    if (isDevMode) {
      console.log('[ShapeManager] deleteAllShapes: Deleting all shapes', shapes.length);
    }
    
    // Store all shapes for potential rollback
    const allShapes = [...shapes];
    
    // Optimistic update - clear all shapes immediately
    setShapes([]);
    setSelectedShapeIds([]);
    
    // Sync to Firestore
    try {
      await deleteAllShapesInFirestore();
      
      if (isDevMode) {
        console.log('[ShapeManager] deleteAllShapes: Successfully synced to Firestore');
      }
      
    } catch (error) {
      console.error('[ShapeManager] deleteAllShapes: Failed to sync to Firestore', error);
      
      // Rollback optimistic update
      setShapes(allShapes);
      
      throw error;
    }
  }, [shapes, isDevMode]);
  
  // ==================== QUERY OPERATIONS ====================
  
  /**
   * Get a single shape by ID
   * @param {string} shapeId - Shape ID
   * @returns {Object|undefined} Shape object or undefined if not found
   */
  const getShape = useCallback((shapeId) => {
    return shapes.find(s => s.id === shapeId);
  }, [shapes]);
  
  /**
   * Get all shapes
   * @returns {Array<Object>} All shapes
   */
  const getAllShapes = useCallback(() => {
    return shapes;
  }, [shapes]);
  
  /**
   * Get selected shapes (full objects, not just IDs)
   * @returns {Array<Object>} Selected shape objects
   */
  const getSelectedShapes = useCallback(() => {
    return selectedShapeIds
      .map(id => shapes.find(s => s.id === id))
      .filter(Boolean); // Remove undefined values
  }, [shapes, selectedShapeIds]);
  
  // ==================== SELECTION OPERATIONS ====================
  
  /**
   * Select shapes
   * @param {Array<string>} shapeIds - Array of shape IDs to select
   * @param {boolean} additive - If true, add to current selection. If false, replace selection
   */
  const selectShapes = useCallback((shapeIds, additive = false) => {
    if (isDevMode) {
      console.log('[ShapeManager] selectShapes:', shapeIds, 'additive:', additive);
    }
    
    if (additive) {
      // Add to selection (merge and deduplicate)
      setSelectedShapeIds(prev => [...new Set([...prev, ...shapeIds])]);
    } else {
      // Replace selection
      setSelectedShapeIds(shapeIds);
    }
  }, [isDevMode]);
  
  /**
   * Clear selection (deselect all shapes)
   */
  const clearSelection = useCallback(() => {
    if (isDevMode) {
      console.log('[ShapeManager] clearSelection');
    }
    
    setSelectedShapeIds([]);
  }, [isDevMode]);
  
  // ==================== FIRESTORE SYNCHRONIZATION ====================
  
  /**
   * Sync shapes from Firestore
   * This is called by the multiplayer hook when Firestore sends updates
   * 
   * @param {Array<Object>} firestoreShapes - Shapes from Firestore
   */
  const syncFromFirestore = useCallback((firestoreShapes) => {
    const now = Date.now();
    lastSyncTimestamp.current = now;
    
    if (isDevMode) {
      console.log('[ShapeManager] syncFromFirestore: Received shapes from Firestore', {
        count: firestoreShapes.length,
        pendingChanges: pendingChanges.current.size,
      });
    }
    
    setShapes(prev => {
      // Merge Firestore shapes with local shapes
      // Strategy: Don't overwrite shapes with pending changes (< 2 seconds old)
      
      const merged = [...firestoreShapes];
      const PENDING_THRESHOLD = 2000; // 2 seconds
      
      // Check each local shape to see if it has pending changes
      prev.forEach(localShape => {
        const pendingTimestamp = pendingChanges.current.get(localShape.id);
        const hasPending = pendingTimestamp !== undefined;
        const pendingAge = hasPending ? now - pendingTimestamp : Infinity;
        
        // Keep local version if pending and recent
        if (hasPending && pendingAge < PENDING_THRESHOLD) {
          const index = merged.findIndex(s => s.id === localShape.id);
          if (index >= 0) {
            // Replace Firestore version with local version
            merged[index] = localShape;
            
            if (isDevMode) {
              console.log('[ShapeManager] syncFromFirestore: Keeping local version due to pending change', {
                shapeId: localShape.id,
                pendingAge,
              });
            }
          } else {
            // Local shape doesn't exist in Firestore yet, keep it
            merged.push(localShape);
          }
        }
      });
      
      return merged;
    });
  }, [isDevMode]);
  
  // ==================== PUBLIC API ====================
  
  return {
    // State
    shapes,
    selectedShapeIds,
    selectedShapes: getSelectedShapes(),
    
    // CRUD operations
    createShape,
    createShapeBatch,
    updateShape,
    updateShapeBatch,
    deleteShape,
    deleteAllShapes,
    
    // Query operations
    getShape,
    getAllShapes,
    getSelectedShapes,
    
    // Selection operations
    selectShapes,
    clearSelection,
    
    // Firestore synchronization
    syncFromFirestore,
  };
};

