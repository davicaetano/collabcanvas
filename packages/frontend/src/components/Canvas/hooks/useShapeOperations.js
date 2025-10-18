import { useCallback } from 'react';
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
 * @param {Object} shapeManager - Shape manager instance from useShapeManager
 * @returns {Object} - Shape operation functions
 */
export const useShapeOperations = (currentUser, selectedColor, shapeManager) => {
  // Create shape at specific position with specific type
  const createShapeAt = useCallback(async (x, y, width = DEFAULT_SHAPE_WIDTH, height = DEFAULT_SHAPE_HEIGHT, type = 'rectangle') => {
    if (!currentUser || !shapeManager) return null;
    
    // Text shapes should always have black color by default
    const fillColor = type === 'text' ? '#000000' : selectedColor;
    
    const shapeData = {
      type: type, // 'rectangle', 'circle', or 'text'
      x: x,
      y: y,
      width: width,
      height: height,
      fill: fillColor,
      stroke: '#000000',
      strokeWidth: 0,
      rotation: 0,
    };
    
    const createdShape = await shapeManager.createShape(shapeData);
    return createdShape;
  }, [currentUser, selectedColor, shapeManager]);

  // Delete all shapes
  const deleteAllShapes = useCallback(async () => {
    await shapeManager.deleteAllShapes();
  }, [shapeManager]);

  // Add rectangles for stress testing
  const add500Rectangles = useCallback(async () => {
    if (!currentUser || !shapeManager) return;
    const shapesData = [];
    
    for (let i = 0; i < STRESS_TEST_SHAPE_COUNT; i++) {
      // Generate random positions across the canvas (rounded to integers)
      const x = Math.round(Math.random() * 2500); // Spread across canvas width
      const y = Math.round(Math.random() * 2500); // Spread across canvas height
      const width = Math.round(50 + Math.random() * 100); // Random width between 50-150
      const height = Math.round(50 + Math.random() * 100); // Random height between 50-150
      
      // Generate random color using the same system as cursors
      const randomUserId = `user-${Math.floor(Math.random() * 1000)}`;
      const randomColor = getUserColor(randomUserId);
      
      const shapeData = {
        x,
        y,
        width,
        height,
        fill: randomColor,
        stroke: '#000000',
        strokeWidth: 0,
        rotation: 0,
      };
      
      shapesData.push(shapeData);
    }
    
    // Use batch create for much faster performance
    await shapeManager.createShapeBatch(shapesData);
  }, [currentUser, shapeManager]);

  return {
    createShapeAt,
    deleteAllShapes,
    add500Rectangles,
  };
};

