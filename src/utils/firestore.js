import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  serverTimestamp,
  updateDoc,
  writeBatch,
  getDocs
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

// Presence operations
export const updatePresence = async (userId, userData) => {
  const presenceRef = doc(db, 'canvases', CANVAS_ID, 'presence', userId);
  await setDoc(presenceRef, {
    ...userData,
    lastSeen: serverTimestamp(),
    online: true,
  });
};

export const subscribeToPresence = (callback) => {
  const presenceRef = collection(db, 'canvases', CANVAS_ID, 'presence');
  return onSnapshot(presenceRef, (snapshot) => {
    const users = {};
    snapshot.forEach((doc) => {
      users[doc.id] = doc.data();
    });
    callback(users);
  });
};

export const removePresence = async (userId) => {
  const presenceRef = doc(db, 'canvases', CANVAS_ID, 'presence', userId);
  await deleteDoc(presenceRef);
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
