import { useCallback } from 'react';

/**
 * Hook to manage canvas mode toggles (Add, Delete, Select, Pan)
 * Ensures only one mode is active at a time and handles state cleanup
 * 
 * @param {Object} canvasState - Canvas state object from useCanvasState
 * @returns {Object} - Mode toggle functions
 */
export const useModeManagement = (canvasState) => {
  const {
    setAddMode,
    setIsDrawing,
    setDrawStartPos,
    setPreviewRect,
  } = canvasState;

  // Set add mode with specific shape type ('rectangle', 'circle', 'text', or 'none')
  const setAddModeWithShape = useCallback((shapeType) => {
    setAddMode(shapeType);
    
    // Reset drawing state when changing add mode
    setIsDrawing(false);
    setDrawStartPos(null);
    setPreviewRect(null);
  }, [setAddMode, setIsDrawing, setDrawStartPos, setPreviewRect]);

  return {
    setAddModeWithShape,
  };
};

