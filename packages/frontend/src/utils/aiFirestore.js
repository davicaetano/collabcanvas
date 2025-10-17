/**
 * AI Firestore Utility
 * 
 * Functions for saving AI-generated shapes to Firestore with proper metadata.
 */

import { collection, addDoc, serverTimestamp, writeBatch, doc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Save AI-generated shapes to Firestore
 * 
 * @param {string} canvasId - ID of the canvas (defaults to 'main-canvas')
 * @param {string} userId - ID of the user who triggered the AI command
 * @param {Array<Object>} shapes - Array of shape objects from AI
 * @returns {Promise<Array<string>>} Array of created shape IDs
 */
export const saveAIShapesToFirestore = async (canvasId = 'main-canvas', userId, shapes) => {
  if (!shapes || shapes.length === 0) {
    console.warn('No shapes to save');
    return [];
  }

  try {
    const batch = writeBatch(db);
    const createdIds = [];
    // FIXED: Save to correct collection path that the listener is watching
    const shapesCollection = collection(db, 'canvases', canvasId, 'shapes');

    for (const shape of shapes) {
      // Skip command-type responses (move, resize) - these need different handling
      if (shape.command) {
        console.log('Skipping command-type shape:', shape.command);
        continue;
      }

      // Prepare shape data with AI metadata
      const shapeData = {
        ...shape,
        canvasId,
        createdBy: userId,
        isAIGenerated: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Create new document reference
      const docRef = doc(shapesCollection);
      batch.set(docRef, shapeData);
      createdIds.push(docRef.id);
    }

    // Commit all writes in a single batch
    await batch.commit();

    console.log(`✓ Saved ${createdIds.length} AI-generated shapes to Firestore`);
    return createdIds;

  } catch (error) {
    console.error('Error saving AI shapes to Firestore:', error);
    throw error;
  }
};

/**
 * Save a single AI-generated shape to Firestore
 * 
 * @param {string} canvasId - ID of the canvas
 * @param {string} userId - ID of the user
 * @param {Object} shape - Shape object from AI
 * @returns {Promise<string>} ID of created shape
 */
export const saveAIShapeToFirestore = async (canvasId = 'main-canvas', userId, shape) => {
  if (!shape || shape.command) {
    console.warn('Invalid shape or command-type shape');
    return null;
  }

  try {
    const shapeData = {
      ...shape,
      canvasId,
      createdBy: userId,
      isAIGenerated: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // FIXED: Save to correct collection path that the listener is watching
    const docRef = await addDoc(collection(db, 'canvases', canvasId, 'shapes'), shapeData);
    console.log(`✓ Saved AI shape to Firestore: ${docRef.id}`);
    return docRef.id;

  } catch (error) {
    console.error('Error saving AI shape to Firestore:', error);
    throw error;
  }
};

