import { useCallback } from 'react';

/**
 * Hook to handle shape drawing in Add Mode (rectangle, circle, etc.)
 * Manages the drawing state and preview while user drags to create shapes
 * 
 * @param {Object} canvasState - Canvas state object from useCanvasState
 * @param {Function} createShapeAt - Function to create shape (from useShapeOperations)
 * @param {Object} shapeManager - Shape manager for auto-selecting created shapes
 * @returns {Object} - Drawing handlers and state
 */
export const useDrawing = (canvasState, createShapeAt, shapeManager) => {
  const {
    stageRef,
    stageX,
    stageY,
    stageScale,
    addMode,
    setAddMode,
    setIsSelectMode,
    isDrawing,
    setIsDrawing,
    drawStartPos,
    setDrawStartPos,
    previewRect,
    setPreviewRect,
  } = canvasState;

  // Handle mouse down to start drawing
  const handleDrawingMouseDown = useCallback((e, canvasPos) => {
    if (addMode === 'none') return false;
    
    e.evt.stopPropagation();
    setIsDrawing(true);
    setDrawStartPos(canvasPos);
    setPreviewRect({
      x: canvasPos.x,
      y: canvasPos.y,
      width: 0,
      height: 0,
    });
    return true; // Handled
  }, [addMode, setIsDrawing, setDrawStartPos, setPreviewRect]);

  // Handle mouse move to update drawing preview
  const handleDrawingMouseMove = useCallback((canvasPos) => {
    if (addMode === 'none' || !isDrawing || !drawStartPos) return false;
    
    setPreviewRect({
      x: Math.min(drawStartPos.x, canvasPos.x),
      y: Math.min(drawStartPos.y, canvasPos.y),
      width: Math.abs(canvasPos.x - drawStartPos.x),
      height: Math.abs(canvasPos.y - drawStartPos.y),
    });
    return true; // Handled
  }, [addMode, isDrawing, drawStartPos, setPreviewRect]);

  // Handle mouse up to finish drawing and create shape
  const handleDrawingMouseUp = useCallback(async () => {
    if (addMode === 'none' || !isDrawing || !drawStartPos || !previewRect) return false;
    
    const dragDistance = Math.sqrt(
      Math.pow(previewRect.width, 2) + Math.pow(previewRect.height, 2)
    );
    
    // Exit add mode and return to select mode immediately (before async operations)
    setAddMode('none');
    setIsSelectMode(true);
    
    let createdShape = null;
    
    if (dragDistance < 10) {
      // Small drag or click - create default size shape
      try {
        createdShape = await createShapeAt(drawStartPos.x, drawStartPos.y, undefined, undefined, addMode);
      } catch (error) {
        console.error('Failed to create shape (offline?):', error);
      }
    } else if (previewRect.width > 5 && previewRect.height > 5) {
      // Actual drag - create shape with drawn dimensions
      try {
        createdShape = await createShapeAt(
          previewRect.x,
          previewRect.y,
          previewRect.width,
          previewRect.height,
          addMode
        );
      } catch (error) {
        console.error('Failed to create shape (offline?):', error);
      }
    }
    
    // Select the newly created shape
    if (createdShape && shapeManager) {
      shapeManager.selectShapes([createdShape.id]);
    }
    
    return true; // Handled
  }, [addMode, isDrawing, drawStartPos, previewRect, createShapeAt, setAddMode, setIsSelectMode, shapeManager]);

  // Reset drawing state (called after mouse up)
  const resetDrawingState = useCallback(() => {
    setIsDrawing(false);
    setDrawStartPos(null);
    setPreviewRect(null);
  }, [setIsDrawing, setDrawStartPos, setPreviewRect]);

  return {
    handleDrawingMouseDown,
    handleDrawingMouseMove,
    handleDrawingMouseUp,
    resetDrawingState,
  };
};

