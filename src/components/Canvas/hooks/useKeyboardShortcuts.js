import { useEffect } from 'react';

/**
 * Hook to handle keyboard shortcuts for the canvas
 * Currently handles:
 * - ESC: Exit current mode and deselect shapes
 * - Backspace/Delete: Delete selected shapes
 * - V: Select tool
 * - H: Pan tool
 * - R: Rectangle tool
 * - C: Circle tool
 * - T: Text tool
 * 
 * @param {Object} canvasState - Canvas state object from useCanvasState
 * @param {Object} shapeManager - Shape manager from useShapeManager
 * @param {Function} onToolChange - Function to change the current tool
 */
export const useKeyboardShortcuts = (canvasState, shapeManager, onToolChange) => {
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
      // Don't process tool shortcuts if user is typing in an input field
      const isTyping = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
      
      // Tool shortcuts (V, H, R, C, T)
      if (!isTyping && onToolChange) {
        const key = e.key.toLowerCase();
        
        if (key === 'v') {
          e.preventDefault();
          onToolChange('select');
          return;
        }
        if (key === 'h') {
          e.preventDefault();
          onToolChange('pan');
          return;
        }
        if (key === 'r') {
          e.preventDefault();
          onToolChange('rectangle');
          return;
        }
        if (key === 'c') {
          e.preventDefault();
          onToolChange('circle');
          return;
        }
        if (key === 't') {
          e.preventDefault();
          onToolChange('text');
          return;
        }
      }
      
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
    onToolChange,
    setAddMode, 
    setIsPanMode,
    setIsSelectMode,
    setIsDrawing, 
    setDrawStartPos, 
    setPreviewRect
  ]);
};

