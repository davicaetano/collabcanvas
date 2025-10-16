import { useCallback } from 'react';
import { 
  createShape as createShapeInFirestore,
  deleteAllShapes as deleteAllShapesInFirestore,
  addShapesBatch
} from '../../../utils/firestore';
import { getUserColor } from '../../../utils/colors';
import { 
  DEFAULT_SHAPE_WIDTH,
  DEFAULT_SHAPE_HEIGHT,
  SHAPE_STROKE_WIDTH,
  STRESS_TEST_SHAPE_COUNT
} from '../../../utils/canvas';

/**
 * Hook to handle shape CRUD operations
 * Manages creating, deleting, and batch operations for shapes
 * 
 * @param {Object} currentUser - Current authenticated user
 * @param {string} selectedColor - Currently selected color for new shapes
 * @returns {Object} - Shape operation functions
 */
export const useShapeOperations = (currentUser, selectedColor) => {
  // Create shape at specific position
  const createShapeAt = useCallback(async (x, y, width = DEFAULT_SHAPE_WIDTH, height = DEFAULT_SHAPE_HEIGHT) => {
    if (!currentUser) return;
    
    const newShape = {
      id: Date.now().toString(),
      x: Math.round(x), // Round to integer
      y: Math.round(y), // Round to integer
      width: Math.round(width), // Round to integer
      height: Math.round(height), // Round to integer
      fill: selectedColor,
      stroke: selectedColor,
      strokeWidth: SHAPE_STROKE_WIDTH,
    };
    
    await createShapeInFirestore(newShape, currentUser.uid);
  }, [currentUser, selectedColor]);

  // Delete all shapes
  const deleteAllShapes = useCallback(async () => {
    await deleteAllShapesInFirestore();
  }, []);

  // Add rectangles for stress testing
  const add500Rectangles = useCallback(async () => {
    if (!currentUser) return;
    const shapes = [];
    const baseTimestamp = Date.now();
    
    for (let i = 0; i < STRESS_TEST_SHAPE_COUNT; i++) {
      // Generate random positions across the canvas (rounded to integers)
      const x = Math.round(Math.random() * 2500); // Spread across canvas width
      const y = Math.round(Math.random() * 2500); // Spread across canvas height
      const width = Math.round(50 + Math.random() * 100); // Random width between 50-150
      const height = Math.round(50 + Math.random() * 100); // Random height between 50-150
      
      // Generate random color using the same system as cursors
      const randomUserId = `user-${Math.floor(Math.random() * 1000)}`;
      const randomColor = getUserColor(randomUserId);
      
      const newShape = {
        id: `${baseTimestamp}-${i}`,
        x,
        y,
        width,
        height,
        fill: randomColor,
        stroke: randomColor,
        strokeWidth: 2,
        userId: currentUser.uid,
      };
      
      shapes.push(newShape);
    }
    
    // Use batch write for much faster performance
    await addShapesBatch(shapes);
  }, [currentUser]);

  return {
    createShapeAt,
    deleteAllShapes,
    add500Rectangles,
  };
};

