import { useCallback } from 'react';

/**
 * Hook to handle shape dragging state
 * Manages the isDraggingShape flag to prevent conflicts between
 * shape dragging and canvas panning
 * 
 * @param {Object} canvasState - Canvas state object from useCanvasState
 * @returns {Object} - Shape drag handlers
 */
export const useShapeDrag = (canvasState) => {
  const { setIsDraggingShape } = canvasState;

  // Handle shape drag start
  const handleShapeDragStart = useCallback((e) => {
    setIsDraggingShape(true);
  }, [setIsDraggingShape]);

  // Handle shape drag end
  const handleShapeDragEnd = useCallback(async (e, shapeId, newPosition) => {
    setIsDraggingShape(false);
    // Final position update is handled in CanvasShapes component
  }, [setIsDraggingShape]);

  return {
    handleShapeDragStart,
    handleShapeDragEnd,
  };
};

