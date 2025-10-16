import { useCallback } from 'react';
import { rectanglesIntersect } from '../../../utils/geometry';

/**
 * Hook to handle shape selection with marquee (drag to select multiple shapes)
 * Manages selection state, marquee preview, and modifier keys for multi-select
 * 
 * @param {Object} canvasState - Canvas state object from useCanvasState
 * @returns {Object} - Selection handlers and state
 */
export const useShapeSelection = (canvasState) => {
  const {
    stageRef,
    stageX,
    stageY,
    stageScale,
    isSelectMode,
    isAddMode,
    isDrawing,
    shapes,
    selectedShapes,
    setSelectedShapes,
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
    if (!hasModifierKey && selectedShapes.length > 0) {
      setSelectedShapes([]);
    }
    
    setIsMarqueeSelecting(true);
    setMarqueeStart(canvasPos);
    setMarqueeEnd(canvasPos);
    // Store modifier key state for later use in mouse up
    e.target._marqueeModifierKey = hasModifierKey;
    
    return true; // Handled
  }, [isSelectMode, selectedShapes, setSelectedShapes, setIsMarqueeSelecting, setMarqueeStart, setMarqueeEnd]);

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
    const intersectingShapes = shapes.filter(shape => {
      const shapeRect = {
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height,
      };
      return rectanglesIntersect(marqueeRect, shapeRect);
    });
    
    // Update preview shapes (IDs only)
    setMarqueePreviewShapes(intersectingShapes.map(shape => shape.id));
    
    return true; // Handled
  }, [isSelectMode, isMarqueeSelecting, marqueeStart, setMarqueeEnd, shapes, setMarqueePreviewShapes]);

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
    const intersectingShapes = shapes.filter(shape => {
      const shapeRect = {
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height,
      };
      return rectanglesIntersect(marqueeRect, shapeRect);
    });
    
    // Check if modifier key was held during marquee selection
    const stage = stageRef.current;
    const wasModifierKeyHeld = stage?._marqueeModifierKey || false;
    
    // Update selection
    if (wasModifierKeyHeld) {
      // ADD to selection: merge with existing selection
      const newShapeIds = intersectingShapes.map(shape => shape.id);
      const mergedSelection = [...new Set([...selectedShapes, ...newShapeIds])];
      setSelectedShapes(mergedSelection);
    } else {
      // REPLACE selection
      setSelectedShapes(intersectingShapes.map(shape => shape.id));
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
    shapes,
    selectedShapes,
    setSelectedShapes,
    setIsMarqueeSelecting,
    setMarqueeStart,
    setMarqueeEnd,
    setMarqueePreviewShapes,
    stageRef
  ]);

  // Handle canvas click to deselect shapes
  const handleSelectionClick = useCallback((e) => {
    const isDevMode = import.meta.env.VITE_DEV_MODE === 'true';
    
    if (isDevMode) {
      console.log('Canvas click:', {
        targetClassName: e.target.className,
        isStage: e.target === e.target.getStage(),
        selectedShapes
      });
    }
    
    // Only handle clicks on empty canvas (not on shapes)
    if (e.target === e.target.getStage()) {
      if (isAddMode && !isDrawing) {
        // Quick click without drag - handled by mouse up
        return;
      }
      
      // Deselect all shapes when clicking on empty canvas
      if (selectedShapes && selectedShapes.length > 0) {
        if (isDevMode) console.log('Deselecting shapes');
        setSelectedShapes([]);
      }
    }
  }, [isAddMode, isDrawing, selectedShapes, setSelectedShapes]);

  return {
    handleSelectionMouseDown,
    handleSelectionMouseMove,
    handleSelectionMouseUp,
    handleSelectionClick,
  };
};

