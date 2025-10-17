import { useCallback } from 'react';
import { rectangleIntersectsRotatedRectangle } from '../../../utils/geometry';

/**
 * Hook to handle shape selection with marquee (drag to select multiple shapes)
 * Manages selection state, marquee preview, and modifier keys for multi-select
 * 
 * @param {Object} canvasState - Canvas state object from useCanvasState
 * @param {Object} shapeManager - Shape manager from useShapeManager
 * @returns {Object} - Selection handlers and state
 */
export const useShapeSelection = (canvasState, shapeManager) => {
  const {
    stageRef,
    stageX,
    stageY,
    stageScale,
    isSelectMode,
    addMode,
    isDrawing,
    isMarqueeSelecting,
    setIsMarqueeSelecting,
    marqueeStart,
    setMarqueeStart,
    marqueeEnd,
    setMarqueeEnd,
    marqueePreviewShapes,
    setMarqueePreviewShapes,
  } = canvasState;

  // Handle mouse down to start marquee selection
  const handleSelectionMouseDown = useCallback((e, canvasPos) => {
    if (!isSelectMode) return false;
    
    // Only start marquee if clicking on empty canvas (not on a shape)
    if (e.target !== e.target.getStage()) return false;
    
    const hasModifierKey = e.evt.shiftKey || e.evt.metaKey || e.evt.ctrlKey;
    
    // If no modifier key, clear selection immediately to avoid conflict with click event
    if (!hasModifierKey && shapeManager.selectedShapeIds.length > 0) {
      shapeManager.clearSelection();
    }
    
    setIsMarqueeSelecting(true);
    setMarqueeStart(canvasPos);
    setMarqueeEnd(canvasPos);
    // Store modifier key state for later use in mouse up
    e.target._marqueeModifierKey = hasModifierKey;
    
    return true; // Handled
  }, [isSelectMode, shapeManager, setIsMarqueeSelecting, setMarqueeStart, setMarqueeEnd]);

  // Handle mouse move to update marquee selection preview
  const handleSelectionMouseMove = useCallback((canvasPos) => {
    if (!isSelectMode || !isMarqueeSelecting || !marqueeStart) return false;
    
    setMarqueeEnd(canvasPos);
    
    // Calculate marquee bounds for preview
    const marqueeRect = {
      x: Math.min(marqueeStart.x, canvasPos.x),
      y: Math.min(marqueeStart.y, canvasPos.y),
      width: Math.abs(canvasPos.x - marqueeStart.x),
      height: Math.abs(canvasPos.y - marqueeStart.y),
    };
    
    // Find shapes that intersect with marquee in real-time
    const intersectingShapes = shapeManager.shapes.filter(shape => {
      return rectangleIntersectsRotatedRectangle(marqueeRect, shape);
    });
    
    // Update preview shapes (IDs only)
    setMarqueePreviewShapes(intersectingShapes.map(shape => shape.id));
    
    return true; // Handled
  }, [isSelectMode, isMarqueeSelecting, marqueeStart, setMarqueeEnd, shapeManager, setMarqueePreviewShapes]);

  // Handle mouse up to finish marquee selection
  const handleSelectionMouseUp = useCallback(() => {
    if (!isSelectMode || !isMarqueeSelecting || !marqueeStart || !marqueeEnd) return false;
    
    // Calculate marquee bounds
    const marqueeRect = {
      x: Math.min(marqueeStart.x, marqueeEnd.x),
      y: Math.min(marqueeStart.y, marqueeEnd.y),
      width: Math.abs(marqueeEnd.x - marqueeStart.x),
      height: Math.abs(marqueeEnd.y - marqueeStart.y),
    };
    
    // Find shapes that intersect with marquee
    const intersectingShapes = shapeManager.shapes.filter(shape => {
      return rectangleIntersectsRotatedRectangle(marqueeRect, shape);
    });
    
    // Check if modifier key was held during marquee selection
    const stage = stageRef.current;
    const wasModifierKeyHeld = stage?._marqueeModifierKey || false;
    
    // Update selection
    if (wasModifierKeyHeld) {
      // ADD to selection: merge with existing selection
      const newShapeIds = intersectingShapes.map(shape => shape.id);
      shapeManager.selectShapes(newShapeIds, true); // additive = true
    } else {
      // REPLACE selection
      shapeManager.selectShapes(intersectingShapes.map(shape => shape.id));
    }
    
    // Clear modifier key flag
    if (stage) {
      stage._marqueeModifierKey = false;
    }
    
    // Reset marquee state
    setIsMarqueeSelecting(false);
    setMarqueeStart(null);
    setMarqueeEnd(null);
    setMarqueePreviewShapes([]); // Clear preview shapes
    
    return true; // Handled
  }, [
    isSelectMode,
    isMarqueeSelecting,
    marqueeStart,
    marqueeEnd,
    shapeManager,
    setIsMarqueeSelecting,
    setMarqueeStart,
    setMarqueeEnd,
    setMarqueePreviewShapes,
    stageRef
  ]);

  // Handle canvas click to deselect shapes
  const handleSelectionClick = useCallback((e) => {
    // Only handle clicks on empty canvas (not on shapes)
    if (e.target === e.target.getStage()) {
      if (addMode !== 'none' && !isDrawing) {
        // Quick click without drag - handled by mouse up
        return;
      }
      
      // Deselect all shapes when clicking on empty canvas
      if (shapeManager.selectedShapeIds && shapeManager.selectedShapeIds.length > 0) {
        shapeManager.clearSelection();
      }
    }
  }, [isSelectMode, addMode, isDrawing, shapeManager]);

  return {
    handleSelectionMouseDown,
    handleSelectionMouseMove,
    handleSelectionMouseUp,
    handleSelectionClick,
  };
};

