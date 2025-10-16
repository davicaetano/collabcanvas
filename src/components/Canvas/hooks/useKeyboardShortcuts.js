import { useEffect } from 'react';

/**
 * Hook to handle keyboard shortcuts for the canvas
 * Currently handles:
 * - ESC: Exit current mode and deselect shapes
 * - Backspace/Delete: Delete selected shapes
 * 
 * @param {Object} canvasState - Canvas state object from useCanvasState
 * @param {Object} shapeManager - Shape manager from useShapeManager
 */
export const useKeyboardShortcuts = (canvasState, shapeManager) => {
  const {
    addMode,
    setAddMode,
    isPanMode,
    setIsPanMode,
    setIsSelectMode,
    setIsDrawing,
    setDrawStartPos,
    setPreviewRect,
  } = canvasState;

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // ESC key: Exit current mode and deselect shapes
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
        if (isPanMode) setIsPanMode(false);
        
        // Always activate select mode when ESC is pressed
        setIsSelectMode(true);
        
        // Deselect all shapes
        if (shapeManager.selectedShapeIds && shapeManager.selectedShapeIds.length > 0) {
          shapeManager.clearSelection();
        }
      }
      
      // Backspace/Delete key: Delete selected shapes
      if (e.key === 'Backspace' || e.key === 'Delete') {
        // Don't delete if user is typing in an input field
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
          return;
        }
        
        // Delete selected shapes if any
        if (shapeManager.selectedShapeIds && shapeManager.selectedShapeIds.length > 0) {
          e.preventDefault(); // Prevent browser back navigation
          shapeManager.deleteShapeBatch(shapeManager.selectedShapeIds);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    addMode, 
    isPanMode,
    shapeManager,
    setAddMode, 
    setIsPanMode,
    setIsSelectMode,
    setIsDrawing, 
    setDrawStartPos, 
    setPreviewRect
  ]);
};

