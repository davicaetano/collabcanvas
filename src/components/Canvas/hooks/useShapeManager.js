import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { validateProperty } from '../../../utils/propertyValidation';
import { 
  createShape as createShapeInFirestore,
  updateShape as updateShapeInFirestore,
  deleteShape as deleteShapeInFirestore,
  updateShapesBatch as updateShapesBatchInFirestore,
  addShapesBatch as addShapesBatchInFirestore,
  deleteShapesBatch as deleteShapesBatchInFirestore,
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
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup logic if needed
    };
  }, []);
  
  // ==================== CRUD OPERATIONS ====================
  
  /**
   * Create a single shape
   * @param {Object} shapeData - Shape properties (x, y, width, height, fill, stroke, type, etc.)
   * @returns {Promise<Object>} Created shape
   */
  const createShape = useCallback(async (shapeData) => {
    if (!currentUser) {
      return null;
    }
    
    // Generate unique ID
    const newShape = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: shapeData.type || 'rectangle', // Default to rectangle for backward compatibility
      x: shapeData.x || 0,
      y: shapeData.y || 0,
      width: shapeData.width || DEFAULT_SHAPE_WIDTH,
      height: shapeData.height || DEFAULT_SHAPE_HEIGHT,
      fill: shapeData.fill || '#3B82F6',
      stroke: shapeData.stroke || '#3B82F6',
      strokeWidth: shapeData.strokeWidth || SHAPE_STROKE_WIDTH,
      ...shapeData,
    };
    
    // Optimistic update - add to local state immediately
    setShapes(prev => [...prev, newShape]);
    
    // Sync to Firestore
    try {
      await createShapeInFirestore(newShape, currentUser.uid, sessionId);
      return newShape;
    } catch (error) {
      console.error('[ShapeManager] createShape: Failed to sync to Firestore', error);
      
      // Rollback optimistic update
      setShapes(prev => prev.filter(s => s.id !== newShape.id));
      
      throw error;
    }
  }, [currentUser, sessionId]);
  
  /**
   * Create multiple shapes at once (batch operation)
   * @param {Array<Object>} shapesData - Array of shape properties
   * @returns {Promise<Array<Object>>} Created shapes
   */
  const createShapeBatch = useCallback(async (shapesData) => {
    if (!currentUser) {
      return [];
    }
    
    // Generate shapes with IDs
    const baseTimestamp = Date.now();
    const newShapes = shapesData.map((shapeData, index) => ({
      id: `${baseTimestamp}-${index}-${Math.random().toString(36).substr(2, 9)}`,
      type: shapeData.type || 'rectangle', // Default to rectangle for backward compatibility
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
    
    // Optimistic update - add all to local state immediately
    setShapes(prev => [...prev, ...newShapes]);
    
    // Sync to Firestore
    try {
      await addShapesBatchInFirestore(newShapes);
      return newShapes;
    } catch (error) {
      console.error('[ShapeManager] createShapeBatch: Failed to sync to Firestore', error);
      
      // Rollback optimistic update - remove all created shapes
      const createdIds = newShapes.map(s => s.id);
      setShapes(prev => prev.filter(s => !createdIds.includes(s.id)));
      
      throw error;
    }
  }, [currentUser, sessionId]);
  
  /**
   * Update a single shape
   * @param {string} shapeId - Shape ID
   * @param {Object} updates - Properties to update
   * @returns {Promise<void>}
   */
  const updateShape = useCallback(async (shapeId, updates) => {
    // Validate all updates
    const validatedUpdates = {};
    for (const [key, value] of Object.entries(updates)) {
      const validated = validateProperty(key, value);
      if (validated !== null) {
        validatedUpdates[key] = validated;
      }
    }
    
    // If no valid updates, return early
    if (Object.keys(validatedUpdates).length === 0) {
      return;
    }
    
    // Optimistic update - update local state immediately
    setShapes(prev => prev.map(shape =>
      shape.id === shapeId ? { ...shape, ...validatedUpdates } : shape
    ));
    
    // Sync to Firestore
    try {
      await updateShapeInFirestore(shapeId, validatedUpdates, sessionId);
    } catch (error) {
      console.error('[ShapeManager] updateShape: Failed to sync to Firestore', error);
      
      // Note: We don't rollback on error because Firestore might be temporarily offline
      // The next Firestore sync will correct the state if needed
      
      throw error;
    }
  }, [sessionId]);
  
  /**
   * Update multiple shapes at once (batch operation)
   * @param {Object} updatesMap - Map of shapeId -> updates
   * @returns {Promise<void>}
   */
  const updateShapeBatch = useCallback(async (updatesMap) => {
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
      return;
    }
    
    // Optimistic update - update all shapes in local state immediately
    setShapes(prev => prev.map(shape => {
      const updates = validatedUpdatesMap[shape.id];
      return updates ? { ...shape, ...updates } : shape;
    }));
    
    // Sync to Firestore
    try {
      await updateShapesBatchInFirestore(validatedUpdatesMap, sessionId);
    } catch (error) {
      console.error('[ShapeManager] updateShapeBatch: Failed to sync to Firestore', error);
      throw error;
    }
  }, [sessionId]);
  
  /**
   * Delete a single shape
   * @param {string} shapeId - Shape ID to delete
   * @returns {Promise<void>}
   */
  const deleteShape = useCallback(async (shapeId) => {
    // Store deleted shape for potential rollback
    const deletedShape = shapes.find(s => s.id === shapeId);
    
    // Optimistic update - remove from local state immediately
    setShapes(prev => prev.filter(s => s.id !== shapeId));
    
    // Also remove from selection if selected
    setSelectedShapeIds(prev => prev.filter(id => id !== shapeId));
    
    // Sync to Firestore
    try {
      await deleteShapeInFirestore(shapeId);
    } catch (error) {
      console.error('[ShapeManager] deleteShape: Failed to sync to Firestore', error);
      
      // Rollback optimistic update
      if (deletedShape) {
        setShapes(prev => [...prev, deletedShape]);
      }
      
      throw error;
    }
  }, [shapes]);
  
  /**
   * Delete multiple shapes in a batch operation
   * Optimistically removes shapes from local state and syncs to Firestore
   * 
   * @param {string[]} shapeIds - Array of shape IDs to delete
   * @returns {Promise<void>}
   */
  const deleteShapeBatch = useCallback(async (shapeIds) => {
    if (!shapeIds || shapeIds.length === 0) return;
    
    // Optimistic update - remove shapes immediately
    setShapes(prev => prev.filter(shape => !shapeIds.includes(shape.id)));
    
    // Clear selection
    setSelectedShapeIds([]);
    
    // Sync to Firestore
    try {
      await deleteShapesBatchInFirestore(shapeIds);
    } catch (error) {
      console.error('[ShapeManager] deleteShapeBatch: Failed to sync to Firestore', error);
      // Note: We don't revert optimistic update here
      // Firestore listener will sync the correct state
    }
  }, []);
  
  /**
   * Delete all shapes in the canvas
   * @returns {Promise<void>}
   */
  const deleteAllShapes = useCallback(async () => {
    // Store all shapes for potential rollback
    const allShapes = [...shapes];
    
    // Optimistic update - clear all shapes immediately
    setShapes([]);
    setSelectedShapeIds([]);
    
    // Sync to Firestore
    try {
      await deleteAllShapesInFirestore();
    } catch (error) {
      console.error('[ShapeManager] deleteAllShapes: Failed to sync to Firestore', error);
      
      // Rollback optimistic update
      setShapes(allShapes);
      
      throw error;
    }
  }, [shapes]);
  
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
    if (additive) {
      // Add to selection (merge and deduplicate)
      setSelectedShapeIds(prev => [...new Set([...prev, ...shapeIds])]);
    } else {
      // Replace selection
      setSelectedShapeIds(shapeIds);
    }
  }, []);
  
  /**
   * Clear selection (deselect all shapes)
   */
  const clearSelection = useCallback(() => {
    setSelectedShapeIds([]);
  }, []);
  
  // ==================== FIRESTORE SYNCHRONIZATION ====================
  
  /**
   * Sync shapes from Firestore
   * This is called by the multiplayer hook when Firestore sends updates
   * 
   * Strategy: Only apply changes from other users (different sessionId)
   * If a shape has my sessionId, keep my local version (already applied optimistically)
   * 
   * @param {Array<Object>} firestoreShapes - Shapes from Firestore
   */
  const syncFromFirestore = useCallback((firestoreShapes) => {
    setShapes(prev => {
      const result = [];
      
      // For each shape from Firestore
      firestoreShapes.forEach(firestoreShape => {
        // If the shape was last modified by ME (my sessionId)
        if (firestoreShape.sessionId === sessionId) {
          // Check if I have a local version
          const localShape = prev.find(s => s.id === firestoreShape.id);
          if (localShape) {
            // Use my local version (already updated optimistically)
            result.push(localShape);
          } else {
            // No local version, accept from Firestore (creation confirmation)
            result.push(firestoreShape);
          }
        } else {
          // Shape modified by ANOTHER user, always accept from Firestore
          result.push(firestoreShape);
        }
      });
      
      return result;
    });
  }, [sessionId]);
  
  // ==================== PUBLIC API ====================
  
  // Memoize the returned object to prevent unnecessary re-renders
  // Only recreate when actual dependencies change
  return useMemo(() => ({
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
    deleteShapeBatch,
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
  }), [
    // State dependencies
    shapes,
    selectedShapeIds,
    
    // Function dependencies (all useCallback functions)
    createShape,
    createShapeBatch,
    updateShape,
    updateShapeBatch,
    deleteShape,
    deleteShapeBatch,
    deleteAllShapes,
    getShape,
    getAllShapes,
    getSelectedShapes,
    selectShapes,
    clearSelection,
    syncFromFirestore,
  ]);
};

