import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  serverTimestamp,
  updateDoc,
  writeBatch,
  getDocs,
  getDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { FIRESTORE_BATCH_SIZE } from './canvas';

// Canvas ID - for MVP, we'll use a single canvas
const CANVAS_ID = 'main-canvas';

// Shape operations
export const createShape = async (shape, userId, sessionId) => {
  const shapeWithMetadata = {
    ...shape,
    userId,
    sessionId, // Add session ID to identify which window created it
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  
  const shapeRef = doc(collection(db, 'canvases', CANVAS_ID, 'shapes'), shape.id);
  await setDoc(shapeRef, shapeWithMetadata);
  return shapeWithMetadata;
};

export const updateShape = async (shapeId, updates, sessionId) => {
  const shapeRef = doc(db, 'canvases', CANVAS_ID, 'shapes', shapeId);
  await updateDoc(shapeRef, {
    ...updates,
    sessionId, // Track which session made the update
    updatedAt: serverTimestamp(),
  });
};

export const deleteShape = async (shapeId) => {
  const shapeRef = doc(db, 'canvases', CANVAS_ID, 'shapes', shapeId);
  await deleteDoc(shapeRef);
};

// Delete multiple shapes in a batch operation
export const deleteShapesBatch = async (shapeIds) => {
  if (!shapeIds || shapeIds.length === 0) return;
  
  const BATCH_SIZE = FIRESTORE_BATCH_SIZE; // Firestore batch limit (500)
  
  // Split deletes into batches
  const batches = [];
  for (let i = 0; i < shapeIds.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const batchIds = shapeIds.slice(i, i + BATCH_SIZE);
    
    batchIds.forEach((shapeId) => {
      const shapeRef = doc(db, 'canvases', CANVAS_ID, 'shapes', shapeId);
      batch.delete(shapeRef);
    });
    
    batches.push(batch.commit());
  }
  
  // Execute all batches in parallel
  await Promise.all(batches);
};

// Subscribe to shapes
export const subscribeToShapes = (callback) => {
  const shapesRef = collection(db, 'canvases', CANVAS_ID, 'shapes');
  return onSnapshot(shapesRef, (snapshot) => {
    const shapes = [];
    snapshot.forEach((doc) => {
      shapes.push({ id: doc.id, ...doc.data() });
    });
    callback(shapes);
  });
};

// Cursor operations
export const updateCursor = async (userId, cursorData) => {
  const cursorRef = doc(db, 'canvases', CANVAS_ID, 'cursors', userId);
  await setDoc(cursorRef, {
    ...cursorData,
    updatedAt: serverTimestamp(),
  });
};

export const subscribeToCursors = (callback) => {
  const cursorsRef = collection(db, 'canvases', CANVAS_ID, 'cursors');
  return onSnapshot(cursorsRef, (snapshot) => {
    const cursors = {};
    snapshot.forEach((doc) => {
      cursors[doc.id] = doc.data();
    });
    callback(cursors);
  });
};

export const removeCursor = async (userId) => {
  const cursorRef = doc(db, 'canvases', CANVAS_ID, 'cursors', userId);
  await deleteDoc(cursorRef);
};

// Batch write multiple shapes at once for better performance
export const addShapesBatch = async (shapes) => {
  const shapesRef = collection(db, 'canvases', CANVAS_ID, 'shapes');
  const BATCH_SIZE = FIRESTORE_BATCH_SIZE; // Firestore batch limit
  
  // Split shapes into batches
  const batches = [];
  for (let i = 0; i < shapes.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const batchShapes = shapes.slice(i, i + BATCH_SIZE);
    
    batchShapes.forEach((shape) => {
      const docRef = doc(shapesRef, shape.id);
      batch.set(docRef, {
        ...shape,
        createdAt: serverTimestamp(),
      });
    });
    
    batches.push(batch.commit());
  }
  
  // Execute all batches in parallel
  await Promise.all(batches);
};

// Batch delete all shapes for better performance
export const deleteAllShapes = async () => {
  const shapesRef = collection(db, 'canvases', CANVAS_ID, 'shapes');
  const snapshot = await getDocs(shapesRef);
  
  if (snapshot.empty) return; // No shapes to delete
  
  const BATCH_SIZE = FIRESTORE_BATCH_SIZE; // Firestore batch limit
  const docs = snapshot.docs;
  
  // Split deletes into batches of 500
  const batches = [];
  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const batchDocs = docs.slice(i, i + BATCH_SIZE);
    
    batchDocs.forEach((docSnapshot) => {
      batch.delete(docSnapshot.ref);
    });
    
    batches.push(batch.commit());
  }
  
  // Execute all batches in parallel
  await Promise.all(batches);
};

// Batch update multiple shapes at once for better performance
export const updateShapesBatch = async (shapeUpdates, sessionId) => {
  const BATCH_SIZE = FIRESTORE_BATCH_SIZE; // Firestore batch limit (500)
  
  // Split updates into batches
  const batches = [];
  const updateArray = Object.entries(shapeUpdates); // Convert to array of [shapeId, updates]
  
  for (let i = 0; i < updateArray.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const batchUpdates = updateArray.slice(i, i + BATCH_SIZE);
    
    batchUpdates.forEach(([shapeId, updates]) => {
      const shapeRef = doc(db, 'canvases', CANVAS_ID, 'shapes', shapeId);
      batch.update(shapeRef, {
        ...updates,
        sessionId, // Track which session made the update
        updatedAt: serverTimestamp(),
      });
    });
    
    batches.push(batch.commit());
  }
  
  // Execute all batches in parallel
  await Promise.all(batches);
};

// ==================== CANVAS SETTINGS ====================

/**
 * Subscribe to canvas settings changes in real-time
 */
export const subscribeToCanvasSettings = (callback) => {
  const settingsRef = doc(db, 'canvases', CANVAS_ID, 'settings', 'config');
  
  return onSnapshot(settingsRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data());
    } else {
      // Return default settings if none exist
      callback({
        backgroundColor: '#ffffff',
      });
    }
  });
};

/**
 * Update canvas background color
 */
export const updateCanvasBackgroundColor = async (backgroundColor, userId, sessionId) => {
  const settingsRef = doc(db, 'canvases', CANVAS_ID, 'settings', 'config');
  
  await setDoc(settingsRef, {
    backgroundColor,
    userId,
    sessionId,
    updatedAt: serverTimestamp(),
  }, { merge: true });
};

// ==================== USER PREFERENCES ====================

/**
 * Get user's favorite colors
 * @param {string} userId - User ID
 * @returns {Promise<string[]>} Array of hex color codes
 */
export const getUserFavoriteColors = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      return data.favColors || [];
    }
    return [];
  } catch (error) {
    return [];
  }
};

/**
 * Subscribe to user's favorite colors in real-time
 * @param {string} userId - User ID
 * @param {Function} callback - Callback function that receives the colors array
 * @returns {Function} Unsubscribe function
 */
export const subscribeToUserFavoriteColors = (userId, callback) => {
  const userRef = doc(db, 'users', userId);
  
  return onSnapshot(
    userRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        callback(data.favColors || []);
      } else {
        callback([]);
      }
    },
    (error) => {
      callback([]);
    }
  );
};

/**
 * Add a color to user's favorite colors (max 10, most recent first)
 * @param {string} userId - User ID
 * @param {string} color - Hex color code (e.g., "#FF5733")
 */
export const addFavoriteColor = async (userId, color) => {
  try {
    console.log('[Firestore] addFavoriteColor called with:', { userId, color });
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    let favColors = [];
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      favColors = data.favColors || [];
    }
    
    // Remove color if it already exists (to move it to front)
    favColors = favColors.filter(c => c.toLowerCase() !== color.toLowerCase());
    
    // Add new color to the beginning
    favColors.unshift(color);
    
    // Keep only last 10 colors
    if (favColors.length > 10) {
      favColors = favColors.slice(0, 10);
    }
    
    console.log('[Firestore] Saving colors to Firestore:', favColors);
    
    // Save to Firestore
    await setDoc(userRef, {
      favColors,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    
    console.log('[Firestore] Colors saved successfully!');
  } catch (error) {
    console.error('[Firestore] Error saving favorite color:', error);
  }
};

// ==================== VERSION HISTORY OPERATIONS ====================

/**
 * Save a version history snapshot
 * @param {string} name - User-provided name for this version
 * @param {Object} user - User object with uid and displayName
 * @param {Array} shapes - Snapshot of all shapes
 * @param {Object} config - Canvas configuration (backgroundColor, etc)
 * @returns {Promise<string>} The ID of the created history document
 */
export const saveVersionHistory = async (name, user, shapes, config) => {
  const historyId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const historyRef = doc(db, 'canvases', CANVAS_ID, 'history', historyId);
  
  const historyData = {
    name,
    savedBy: user?.uid || 'anonymous',
    savedByName: user?.displayName || user?.email || 'Anonymous User',
    savedAt: serverTimestamp(),
    shapes: shapes || [],
    settings: config || {},
  };
  
  await setDoc(historyRef, historyData);
  return historyId;
};

/**
 * Load all version histories for the canvas
 * @returns {Promise<Array>} Array of history objects with id, name, savedBy, savedAt, shapes, settings
 */
export const loadVersionHistories = async () => {
  const historyCollectionRef = collection(db, 'canvases', CANVAS_ID, 'history');
  const snapshot = await getDocs(historyCollectionRef);
  
  const histories = [];
  snapshot.forEach((doc) => {
    histories.push({
      id: doc.id,
      ...doc.data(),
    });
  });
  
  // Sort by savedAt (newest first)
  histories.sort((a, b) => {
    const aTime = a.savedAt?.toMillis() || 0;
    const bTime = b.savedAt?.toMillis() || 0;
    return bTime - aTime;
  });
  
  return histories;
};

/**
 * Subscribe to version history changes in real-time
 * @param {Function} callback - Called with array of histories whenever they change
 * @returns {Function} Unsubscribe function
 */
export const subscribeToVersionHistories = (callback) => {
  const historyCollectionRef = collection(db, 'canvases', CANVAS_ID, 'history');
  
  return onSnapshot(historyCollectionRef, (snapshot) => {
    const histories = [];
    snapshot.forEach((doc) => {
      histories.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    
    // Sort by savedAt (newest first)
    histories.sort((a, b) => {
      const aTime = a.savedAt?.toMillis() || 0;
      const bTime = b.savedAt?.toMillis() || 0;
      return bTime - aTime;
    });
    
    callback(histories);
  });
};

/**
 * Load a specific version history
 * @param {string} historyId - ID of the history to load
 * @returns {Promise<Object>} History object with shapes and settings
 */
export const loadVersionHistory = async (historyId) => {
  const historyRef = doc(db, 'canvases', CANVAS_ID, 'history', historyId);
  const snapshot = await getDoc(historyRef);
  
  if (!snapshot.exists()) {
    throw new Error('Version history not found');
  }
  
  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
};

/**
 * Delete a version history
 * @param {string} historyId - ID of the history to delete
 */
export const deleteVersionHistory = async (historyId) => {
  const historyRef = doc(db, 'canvases', CANVAS_ID, 'history', historyId);
  await deleteDoc(historyRef);
};

/**
 * Restore a version history to the main canvas
 * This replaces all current shapes and settings with the historical snapshot
 * @param {string} historyId - ID of the history to restore
 * @param {string} sessionId - Session ID for the restore operation
 */
export const restoreVersionHistory = async (historyId, sessionId) => {
  const history = await loadVersionHistory(historyId);
  
  // Use batch operations for atomic restore
  const batch = writeBatch(db);
  
  // 1. Delete all current shapes
  const shapesSnapshot = await getDocs(collection(db, 'canvases', CANVAS_ID, 'shapes'));
  shapesSnapshot.forEach((doc) => {
    batch.delete(doc.ref);
  });
  
  // 2. Restore shapes from history
  history.shapes.forEach((shape) => {
    const shapeRef = doc(collection(db, 'canvases', CANVAS_ID, 'shapes'), shape.id);
    batch.set(shapeRef, {
      ...shape,
      sessionId, // Mark as restored by this session
      restoredAt: serverTimestamp(),
    });
  });
  
  // 3. Restore settings/config
  if (history.settings) {
    const configRef = doc(db, 'canvases', CANVAS_ID, 'config', 'main');
    batch.set(configRef, history.settings);
  }
  
  // Execute all operations atomically
  await batch.commit();
};
