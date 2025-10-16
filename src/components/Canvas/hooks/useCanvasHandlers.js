import { useCallback } from 'react';
import { 
  updateCursor
} from '../../../utils/firestore';
import { getUserColor } from '../../../utils/colors';
import { rectanglesIntersect } from '../../../utils/geometry';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { useModeManagement } from './useModeManagement';
import { useShapeDrag } from './useShapeDrag';
import { useZoomPan } from './useZoomPan';
import { useShapeOperations } from './useShapeOperations';
import { useDrawing } from './useDrawing';
import { 
  CURSOR_UPDATE_THROTTLE
} from '../../../utils/canvas';

export const useCanvasHandlers = (canvasState, currentUser) => {
  const {
    stageRef,
    stageScale,
    setStageScale,
    stageX,
    setStageX,
    stageY,
    setStageY,
    shapes,
    isSelectMode,
    isAddMode,
    setIsAddMode,
    isDeleteMode,
    setIsDeleteMode,
    isDrawing,
    setIsDrawing,
    drawStartPos,
    setDrawStartPos,
    previewRect,
    setPreviewRect,
    selectedColor,
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
    isDraggingShape,
    setIsDraggingShape,
    isDraggingCanvas,
    setIsDraggingCanvas,
  } = canvasState;

  // Keyboard shortcuts handler
  useKeyboardShortcuts(canvasState);

  // Mode management
  const { toggleAddMode, toggleDeleteMode } = useModeManagement(canvasState);

  // Shape drag handlers
  const { handleShapeDragStart, handleShapeDragEnd } = useShapeDrag(canvasState);

  // Zoom and pan handlers
  const { handleWheel, handleStageDragStart, handleDragEnd } = useZoomPan(canvasState);

  // Shape operations (CRUD)
  const { createShapeAt, deleteAllShapes, add500Rectangles } = useShapeOperations(currentUser, selectedColor);

  // Drawing handlers (Add Mode)
  const { 
    handleDrawingMouseDown, 
    handleDrawingMouseMove, 
    handleDrawingMouseUp, 
    resetDrawingState 
  } = useDrawing(canvasState, createShapeAt);

  // Handle mouse movement
  const handleMouseMove = useCallback((e) => {
    if (!currentUser) return;
    
    const stage = stageRef.current;
    const pos = stage.getPointerPosition();
    if (!pos) return;
    
    // Convert screen coordinates to canvas coordinates
    const canvasPos = {
      x: (pos.x - stageX) / stageScale,
      y: (pos.y - stageY) / stageScale,
    };
    
    // Update drawing preview in add mode
    handleDrawingMouseMove(canvasPos);
    
    // Update marquee selection in select mode
    if (isSelectMode && isMarqueeSelecting && marqueeStart) {
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
    }
    
    // Throttle cursor updates
    const now = Date.now();
    if (now - (handleMouseMove.lastUpdate || 0) > CURSOR_UPDATE_THROTTLE) {
      updateCursor(currentUser.uid, {
        x: canvasPos.x,
        y: canvasPos.y,
        name: currentUser.displayName,
        color: getUserColor(currentUser.uid),
      });
      handleMouseMove.lastUpdate = now;
    }
  }, [
    currentUser, 
    stageRef, 
    stageX, 
    stageY, 
    stageScale,
    handleDrawingMouseMove,
    isSelectMode,
    isMarqueeSelecting,
    marqueeStart,
    setMarqueeEnd,
    shapes,
    setMarqueePreviewShapes
  ]);

  // Handle canvas mouse down for drawing and marquee selection
  const handleCanvasMouseDown = useCallback((e) => {
    const stage = stageRef.current;
    const pos = stage.getPointerPosition();
    if (!pos) return;
    
    const canvasPos = {
      x: (pos.x - stageX) / stageScale,
      y: (pos.y - stageY) / stageScale,
    };
    
    // Handle add mode (rectangle drawing)
    const drawingHandled = handleDrawingMouseDown(e, canvasPos);
    if (drawingHandled) return;
    
    // Handle select mode (marquee selection)
    // Only start marquee if clicking on empty canvas (not on a shape)
    if (isSelectMode && e.target === e.target.getStage()) {
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
    }
  }, [
    handleDrawingMouseDown,
    isSelectMode,
    stageRef, 
    stageX, 
    stageY, 
    stageScale,
    setIsMarqueeSelecting,
    setMarqueeStart,
    setMarqueeEnd,
    selectedShapes,
    setSelectedShapes
  ]);

  // Handle canvas mouse up
  const handleCanvasMouseUp = useCallback(async () => {
    // Handle add mode (rectangle creation)
    await handleDrawingMouseUp();
    
    // Handle marquee selection
    if (isSelectMode && isMarqueeSelecting && marqueeStart && marqueeEnd) {
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
    }
    
    // Reset drawing state
    resetDrawingState();
  }, [
    handleDrawingMouseUp,
    resetDrawingState,
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

  // Handle canvas click
  const handleCanvasClick = useCallback((e) => {
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
    createShapeAt,
    deleteAllShapes,
    add500Rectangles,
    toggleAddMode,
    toggleDeleteMode,
    handleWheel,
    handleStageDragStart,
    handleDragEnd,
    handleShapeDragStart,
    handleShapeDragEnd,
    handleMouseMove,
    handleCanvasMouseDown,
    handleCanvasMouseUp,
    handleCanvasClick,
  };
};
