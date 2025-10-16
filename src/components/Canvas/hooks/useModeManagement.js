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
    isAddMode,
    setIsAddMode,
    isDeleteMode,
    setIsDeleteMode,
    setIsDrawing,
    setDrawStartPos,
    setPreviewRect,
  } = canvasState;

  // Toggle add mode (for creating shapes)
  const toggleAddMode = useCallback(() => {
    setIsAddMode(prev => !prev);
    if (isDeleteMode) setIsDeleteMode(false);
    
    // Reset drawing state when toggling add mode
    setIsDrawing(false);
    setDrawStartPos(null);
    setPreviewRect(null);
  }, [isDeleteMode, setIsAddMode, setIsDeleteMode, setIsDrawing, setDrawStartPos, setPreviewRect]);

  // Toggle delete mode (for deleting shapes)
  const toggleDeleteMode = useCallback(() => {
    setIsDeleteMode(prev => !prev);
    if (isAddMode) {
      setIsAddMode(false);
      // Reset drawing state when switching from add mode
      setIsDrawing(false);
      setDrawStartPos(null);
      setPreviewRect(null);
    }
  }, [isAddMode, setIsAddMode, setIsDeleteMode, setIsDrawing, setDrawStartPos, setPreviewRect]);

  return {
    toggleAddMode,
    toggleDeleteMode,
  };
};

