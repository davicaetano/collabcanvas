import { useEffect } from 'react';

/**
 * Hook to handle keyboard shortcuts for the canvas
 * Currently handles:
 * - ESC: Exit current mode and deselect shapes
 * 
 * @param {Object} canvasState - Canvas state object from useCanvasState
 * @param {Object} shapeManager - Shape manager from useShapeManager
 */
export const useKeyboardShortcuts = (canvasState, shapeManager) => {
  const {
    addMode,
    setAddMode,
    isDeleteMode,
    setIsDeleteMode,
    isPanMode,
    setIsPanMode,
    setIsSelectMode,
    setIsDrawing,
    setDrawStartPos,
    setPreviewRect,
  } = canvasState;

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        // Remove focus from any focused element (e.g., toolbar buttons)
        // This prevents the CSS :focus state from staying on the button
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        
        // Exit any active mode and return to select tool
        if (addMode !== 'none') {
          setAddMode('none');
          // Reset drawing state when exiting add mode
          setIsDrawing(false);
          setDrawStartPos(null);
          setPreviewRect(null);
        }
        if (isDeleteMode) setIsDeleteMode(false);
        if (isPanMode) setIsPanMode(false);
        
        // Always activate select mode when ESC is pressed
        setIsSelectMode(true);
        
        // Deselect all shapes
        if (shapeManager.selectedShapeIds && shapeManager.selectedShapeIds.length > 0) {
          shapeManager.clearSelection();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    addMode, 
    isDeleteMode,
    isPanMode,
    shapeManager,
    setAddMode, 
    setIsDeleteMode,
    setIsPanMode,
    setIsSelectMode,
    setIsDrawing, 
    setDrawStartPos, 
    setPreviewRect
  ]);
};

