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
    addMode,
    setAddMode,
    isDeleteMode,
    setIsDeleteMode,
    setIsDrawing,
    setDrawStartPos,
    setPreviewRect,
  } = canvasState;

  // Set add mode with specific shape type ('rectangle', 'circle', 'text', or 'none')
  const setAddModeWithShape = useCallback((shapeType) => {
    setAddMode(shapeType);
    if (isDeleteMode) setIsDeleteMode(false);
    
    // Reset drawing state when changing add mode
    setIsDrawing(false);
    setDrawStartPos(null);
    setPreviewRect(null);
  }, [isDeleteMode, setAddMode, setIsDeleteMode, setIsDrawing, setDrawStartPos, setPreviewRect]);

  // Toggle delete mode (for deleting shapes)
  const toggleDeleteMode = useCallback(() => {
    setIsDeleteMode(prev => !prev);
    if (addMode !== 'none') {
      setAddMode('none');
      // Reset drawing state when switching from add mode
      setIsDrawing(false);
      setDrawStartPos(null);
      setPreviewRect(null);
    }
  }, [addMode, setAddMode, setIsDeleteMode, setIsDrawing, setDrawStartPos, setPreviewRect]);

  return {
    setAddModeWithShape,
    toggleDeleteMode,
  };
};

