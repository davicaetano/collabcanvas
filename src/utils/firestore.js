import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { db } from './firebase';

// Canvas ID - for MVP, we'll use a single canvas
const CANVAS_ID = 'main-canvas';

// Shape operations
export const createShape = async (shape, userId) => {
  const shapeWithMetadata = {
    ...shape,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  
  const shapeRef = doc(collection(db, 'canvases', CANVAS_ID, 'shapes'), shape.id);
  await setDoc(shapeRef, shapeWithMetadata);
  return shapeWithMetadata;
};

export const updateShape = async (shapeId, updates) => {
  const shapeRef = doc(db, 'canvases', CANVAS_ID, 'shapes', shapeId);
  await updateDoc(shapeRef, {
    ...updates,
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
