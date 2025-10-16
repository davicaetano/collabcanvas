import { useCallback } from 'react';
import { 
  createShape as createShapeInFirestore,
  deleteShape as deleteShapeInFirestore,
  updateCursor,
  addShapesBatch,
  deleteAllShapes as deleteAllShapesInFirestore
} from '../../../utils/firestore';
import { getUserColor } from '../../../utils/colors';
import { rectanglesIntersect } from '../../../utils/geometry';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { 
  ZOOM_MIN, 
  ZOOM_MAX, 
  CURSOR_UPDATE_THROTTLE,
  DEFAULT_SHAPE_WIDTH,
  DEFAULT_SHAPE_HEIGHT,
  SHAPE_STROKE_WIDTH,
  STRESS_TEST_SHAPE_COUNT,
  MIN_DRAG_DISTANCE,
  MIN_SHAPE_SIZE,
  ZOOM_INTENSITY_MOUSE,
  ZOOM_SENSITIVITY_TRACKPAD,
  MOUSE_WHEEL_THRESHOLD,
  STATE_UPDATE_DELAY
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

  // Create shape at specific position
  const createShapeAt = useCallback(async (x, y, width = DEFAULT_SHAPE_WIDTH, height = DEFAULT_SHAPE_HEIGHT) => {
    if (!currentUser) return;
    
    const newShape = {
      id: Date.now().toString(),
      x,
      y,
      width,
      height,
      fill: selectedColor,
      stroke: selectedColor,
      strokeWidth: SHAPE_STROKE_WIDTH,
    };
    
    await createShapeInFirestore(newShape, currentUser.uid);
  }, [currentUser, selectedColor]);

  // Delete all shapes
  const deleteAllShapes = useCallback(async () => {
    await deleteAllShapesInFirestore();
  }, []);

  // Add rectangles for stress testing
  const add500Rectangles = useCallback(async () => {
    if (!currentUser) return;
    const shapes = [];
    const baseTimestamp = Date.now();
    
    for (let i = 0; i < STRESS_TEST_SHAPE_COUNT; i++) {
      // Generate random positions across the canvas
      const x = Math.random() * 2500; // Spread across canvas width
      const y = Math.random() * 2500; // Spread across canvas height
      const width = 50 + Math.random() * 100; // Random width between 50-150
      const height = 50 + Math.random() * 100; // Random height between 50-150
      
      // Generate random color using the same system as cursors
      const randomUserId = `user-${Math.floor(Math.random() * 1000)}`;
      const randomColor = getUserColor(randomUserId);
      
      const newShape = {
        id: `${baseTimestamp}-${i}`,
        x,
        y,
        width,
        height,
        fill: randomColor,
        stroke: randomColor,
        strokeWidth: 2,
        userId: currentUser.uid,
      };
      
      shapes.push(newShape);
    }
    
    // Use batch write for much faster performance
    await addShapesBatch(shapes);
  }, [currentUser]);

  // Toggle modes
  const toggleAddMode = useCallback(() => {
    setIsAddMode(prev => !prev);
    if (isDeleteMode) setIsDeleteMode(false);
    
    // Reset drawing state when toggling add mode
    setIsDrawing(false);
    setDrawStartPos(null);
    setPreviewRect(null);
  }, [isDeleteMode, setIsAddMode, setIsDeleteMode, setIsDrawing, setDrawStartPos, setPreviewRect]);

  const toggleDeleteMode = useCallback(() => {
    setIsDeleteMode(prev => !prev);
    if (isAddMode) {
      setIsAddMode(false);
      // Reset drawing state when switching from add mode
      setIsDrawing(false);
      setDrawStartPos(null);
      setPreviewRect(null);
    }
  }, [isAddMode, setIsAddMode, setIsDeleteMode, setIsDrawing, setDrawStartPos, setPreviewRect]);

  // Handle wheel zoom
  const handleWheel = useCallback((e) => {
    e.evt.preventDefault();
    
    const stage = stageRef.current;
    const oldScale = stageScale;
    const pointer = stage.getPointerPosition();
    
    // Improve zoom sensitivity for different input devices
    // Mouse wheels typically have larger deltaY values (100+)
    // Trackpads have smaller, more granular deltaY values (1-10)
    const deltaY = e.evt.deltaY;
    const isMouse = Math.abs(deltaY) > MOUSE_WHEEL_THRESHOLD; // Likely mouse wheel if large delta
    
    // Adjust zoom factor based on input device and delta magnitude
    let zoomIntensity;
    if (isMouse) {
      // For mouse wheels: use a more aggressive zoom factor
      zoomIntensity = deltaY > 0 ? 0.9 : 1.1; // 10% zoom per scroll
    } else {
      // For trackpads: use the existing smooth zoom factor but scale with deltaY
      const scaleFactor = 1 + (Math.abs(deltaY) * 0.01); // Scale with deltaY magnitude
      zoomIntensity = deltaY > 0 ? 1 / scaleFactor : scaleFactor;
    }
    
    const newScale = Math.min(Math.max(oldScale * zoomIntensity, ZOOM_MIN), ZOOM_MAX);
    
    setStageScale(newScale);
    
    const mousePointTo = {
      x: (pointer.x - stageX) / oldScale,
      y: (pointer.y - stageY) / oldScale,
    };
    
    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    
    setStageX(newPos.x);
    setStageY(newPos.y);
  }, [stageRef, stageScale, stageX, stageY, setStageScale, setStageX, setStageY]);

  // Handle stage drag
  const handleStageDragStart = useCallback((e) => {
    // Prevent stage dragging if we're dragging a shape, drawing, in add mode, or in delete mode
    if (isDraggingShape || isDrawing || isAddMode || isDeleteMode) {
      e.evt.preventDefault();
      return false;
    }
    setIsDraggingShape(false);
    setIsDraggingCanvas(true); // Set canvas dragging state
  }, [isDraggingShape, isDrawing, isAddMode, isDeleteMode, setIsDraggingShape, setIsDraggingCanvas]);

  const handleDragEnd = useCallback((e) => {
    // Only update stage position if it's actually the stage being dragged
    if (e.target === e.target.getStage()) {
      setStageX(e.target.x());
      setStageY(e.target.y());
    }
    setIsDraggingCanvas(false); // Reset canvas dragging state
  }, [setStageX, setStageY, setIsDraggingCanvas]);

  // Handle shape drag
  const handleShapeDragStart = useCallback((e) => {
    setIsDraggingShape(true);
  }, [setIsDraggingShape]);

  const handleShapeDragEnd = useCallback(async (e, shapeId, newPosition) => {
    setIsDraggingShape(false);
    // Final position update is handled in CanvasShapes component
  }, [setIsDraggingShape]);

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
    if (isAddMode && isDrawing && drawStartPos) {
      setPreviewRect({
        x: Math.min(drawStartPos.x, canvasPos.x),
        y: Math.min(drawStartPos.y, canvasPos.y),
        width: Math.abs(canvasPos.x - drawStartPos.x),
        height: Math.abs(canvasPos.y - drawStartPos.y),
      });
    }
    
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
    isAddMode, 
    isDrawing, 
    drawStartPos, 
    setPreviewRect,
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
    if (isAddMode) {
      e.evt.stopPropagation();
      setIsDrawing(true);
      setDrawStartPos(canvasPos);
      setPreviewRect({
        x: canvasPos.x,
        y: canvasPos.y,
        width: 0,
        height: 0,
      });
      return;
    }
    
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
    isAddMode, 
    isSelectMode,
    stageRef, 
    stageX, 
    stageY, 
    stageScale, 
    setIsDrawing, 
    setDrawStartPos, 
    setPreviewRect,
    setIsMarqueeSelecting,
    setMarqueeStart,
    setMarqueeEnd,
    selectedShapes,
    setSelectedShapes
  ]);

  // Handle canvas mouse up
  const handleCanvasMouseUp = useCallback(async () => {
    // Handle add mode (rectangle creation)
    if (isAddMode && isDrawing && drawStartPos && previewRect) {
      const dragDistance = Math.sqrt(
        Math.pow(previewRect.width, 2) + Math.pow(previewRect.height, 2)
      );
      
      // Exit add mode immediately (before async operations)
      setIsAddMode(false);
      
      if (dragDistance < 10) {
        // Small drag or click - create default size rectangle
        try {
          await createShapeAt(drawStartPos.x, drawStartPos.y);
        } catch (error) {
          console.error('Failed to create shape (offline?):', error);
        }
      } else if (previewRect.width > 5 && previewRect.height > 5) {
        // Actual drag - create rectangle with drawn dimensions
        try {
          await createShapeAt(
            previewRect.x,
            previewRect.y,
            previewRect.width,
            previewRect.height
          );
        } catch (error) {
          console.error('Failed to create shape (offline?):', error);
        }
      }
    }
    
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
    setIsDrawing(false);
    setDrawStartPos(null);
    setPreviewRect(null);
  }, [
    isAddMode, 
    isDrawing, 
    drawStartPos, 
    previewRect, 
    createShapeAt, 
    setIsDrawing, 
    setDrawStartPos, 
    setPreviewRect, 
    setIsAddMode,
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
