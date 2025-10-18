import { useEffect } from 'react';

/**
 * Hook to handle keyboard shortcuts for the canvas
 * Currently handles:
 * - ESC: Exit current mode and deselect shapes
 * - Backspace/Delete: Delete selected shapes
 * - Command+A/Ctrl+A: Select all shapes
 * - Command+C/Ctrl+C: Copy selected shapes
 * - Command+V/Ctrl+V: Paste shapes
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
    isMarqueeSelecting,
    setIsMarqueeSelecting,
    setMarqueeStart,
    setMarqueeEnd,
    setMarqueePreviewShapes,
  } = canvasState;

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't process shortcuts if modifier keys are pressed (Command/Ctrl/Alt)
      // This allows browser shortcuts like Command+R (refresh) to work
      const hasModifier = e.metaKey || e.ctrlKey || e.altKey;
      
      // Don't process tool shortcuts if user is typing in an input field
      const isTyping = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
      
      // Tool shortcuts (V, H, R, C, T) - only without modifiers
      if (!isTyping && !hasModifier && onToolChange) {
        const key = e.key.toLowerCase();
        
        if (key === 'v') {
          e.preventDefault();
          onToolChange('select');
          return;
        }
        if (key === 'h') {
          e.preventDefault();
          // Deselect shapes when entering pan mode
          if (shapeManager.selectedShapeIds && shapeManager.selectedShapeIds.length > 0) {
            shapeManager.clearSelection();
          }
          onToolChange('pan');
          return;
        }
        if (key === 'r') {
          e.preventDefault();
          // Deselect shapes when entering draw mode
          if (shapeManager.selectedShapeIds && shapeManager.selectedShapeIds.length > 0) {
            shapeManager.clearSelection();
          }
          onToolChange('rectangle');
          return;
        }
        if (key === 'c') {
          e.preventDefault();
          // Deselect shapes when entering draw mode
          if (shapeManager.selectedShapeIds && shapeManager.selectedShapeIds.length > 0) {
            shapeManager.clearSelection();
          }
          onToolChange('circle');
          return;
        }
        if (key === 't') {
          e.preventDefault();
          // Deselect shapes when entering draw mode
          if (shapeManager.selectedShapeIds && shapeManager.selectedShapeIds.length > 0) {
            shapeManager.clearSelection();
          }
          onToolChange('text');
          return;
        }
      }
      
      // Copy & Paste & Select All shortcuts (Command/Ctrl + C/V/A)
      if ((e.metaKey || e.ctrlKey) && !isTyping) {
        const key = e.key.toLowerCase();
        
        // Command+A / Ctrl+A: Select All
        if (key === 'a') {
          e.preventDefault(); // Always prevent default browser behavior
          const allShapes = shapeManager.getAllShapes();
          if (allShapes && allShapes.length > 0) {
            const allShapeIds = allShapes.map(s => s.id);
            shapeManager.selectShapes(allShapeIds);
          }
          return;
        }
        
        // Command+C / Ctrl+C: Copy
        if (key === 'c') {
          if (shapeManager.selectedShapeIds && shapeManager.selectedShapeIds.length > 0) {
            e.preventDefault();
            const count = shapeManager.copySelectedShapes();
          }
          return;
        }
        
        // Command+V / Ctrl+V: Paste
        if (key === 'v') {
          if (shapeManager.hasClipboard) {
            e.preventDefault();
            shapeManager.pasteShapes();
          }
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
        
        // Cancel marquee selection if active
        if (isMarqueeSelecting) {
          setIsMarqueeSelecting(false);
          setMarqueeStart(null);
          setMarqueeEnd(null);
          setMarqueePreviewShapes([]);
          return; // Don't process other ESC actions
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
    isMarqueeSelecting,
    shapeManager,
    onToolChange,
    setAddMode, 
    setIsPanMode,
    setIsSelectMode,
    setIsDrawing, 
    setDrawStartPos, 
    setPreviewRect,
    setIsMarqueeSelecting,
    setMarqueeStart,
    setMarqueeEnd,
    setMarqueePreviewShapes
  ]);
};

