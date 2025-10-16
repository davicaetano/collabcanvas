import { useEffect } from 'react';

/**
 * Hook to handle keyboard shortcuts for the canvas
 * Currently handles:
 * - ESC: Exit current mode and deselect shapes
 * 
 * @param {Object} canvasState - Canvas state object from useCanvasState
 */
export const useKeyboardShortcuts = (canvasState) => {
  const {
    isAddMode,
    setIsAddMode,
    isDeleteMode,
    setIsDeleteMode,
    selectedShapes,
    setSelectedShapes,
    setIsDrawing,
    setDrawStartPos,
    setPreviewRect,
  } = canvasState;

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isAddMode) {
          setIsAddMode(false);
          // Reset drawing state when exiting add mode
          setIsDrawing(false);
          setDrawStartPos(null);
          setPreviewRect(null);
        }
        if (isDeleteMode) setIsDeleteMode(false);
        
        // Deselect all shapes
        if (selectedShapes && selectedShapes.length > 0) {
          setSelectedShapes([]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isAddMode, 
    isDeleteMode, 
    selectedShapes, 
    setIsAddMode, 
    setIsDeleteMode, 
    setIsDrawing, 
    setDrawStartPos, 
    setPreviewRect, 
    setSelectedShapes
  ]);
};

