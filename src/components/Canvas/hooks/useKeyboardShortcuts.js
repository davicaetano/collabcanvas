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
    addMode,
    setAddMode,
    isDeleteMode,
    setIsDeleteMode,
    isPanMode,
    setIsPanMode,
    setIsSelectMode,
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
        if (selectedShapes && selectedShapes.length > 0) {
          setSelectedShapes([]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    addMode, 
    isDeleteMode,
    isPanMode,
    selectedShapes, 
    setAddMode, 
    setIsDeleteMode,
    setIsPanMode,
    setIsSelectMode,
    setIsDrawing, 
    setDrawStartPos, 
    setPreviewRect, 
    setSelectedShapes
  ]);
};

