import { useCallback, useEffect } from 'react';
import { 
  createShape as createShapeInFirestore,
  deleteShape as deleteShapeInFirestore,
  updateCursor,
  addShapesBatch,
  deleteAllShapes as deleteAllShapesInFirestore
} from '../../../utils/firestore';
import { getUserColor } from '../../../utils/colors';
import { 
  ZOOM_MIN, 
  ZOOM_MAX, 
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
    isDraggingShape,
    setIsDraggingShape,
    isDraggingCanvas,
    setIsDraggingCanvas,
  } = canvasState;

  // Create shape at specific position
  const createShapeAt = useCallback(async (x, y, width = 100, height = 100) => {
    if (!currentUser) return;
    
    const newShape = {
      id: Date.now().toString(),
      x,
      y,
      width,
      height,
      fill: selectedColor,
      stroke: selectedColor,
      strokeWidth: 2,
    };
    
    await createShapeInFirestore(newShape, currentUser.uid);
  }, [currentUser, selectedColor]);

  // Delete all shapes
  const deleteAllShapes = useCallback(async () => {
    await deleteAllShapesInFirestore();
  }, []);

  // Add 500 rectangles for stress testing
  const add500Rectangles = useCallback(async () => {
    if (!currentUser) return;
    const shapes = [];
    
    for (let i = 0; i < 500; i++) {
      // Generate random positions across the canvas
      const x = Math.random() * 2500; // Spread across canvas width
      const y = Math.random() * 2500; // Spread across canvas height
      const width = 50 + Math.random() * 100; // Random width between 50-150
      const height = 50 + Math.random() * 100; // Random height between 50-150
      
      // Generate random color using the same system as cursors
      const randomUserId = `user-${Math.floor(Math.random() * 1000)}`;
      const randomColor = getUserColor(randomUserId);
      
      const newShape = {
        id: `stress-${Date.now()}-${i}`,
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
    const isMouse = Math.abs(deltaY) > 50; // Likely mouse wheel if large delta
    
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
    setPreviewRect
  ]);

  // Handle canvas mouse down for drawing
  const handleCanvasMouseDown = useCallback((e) => {
    if (isAddMode) {
      e.evt.stopPropagation();
      
      const stage = stageRef.current;
      const pos = stage.getPointerPosition();
      if (!pos) return;
      
      const canvasPos = {
        x: (pos.x - stageX) / stageScale,
        y: (pos.y - stageY) / stageScale,
      };
      
      setIsDrawing(true);
      setDrawStartPos(canvasPos);
      setPreviewRect({
        x: canvasPos.x,
        y: canvasPos.y,
        width: 0,
        height: 0,
      });
    }
  }, [isAddMode, stageRef, stageX, stageY, stageScale, setIsDrawing, setDrawStartPos, setPreviewRect]);

  // Handle canvas mouse up
  const handleCanvasMouseUp = useCallback(async () => {
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
    
    // Reset drawing state
    setIsDrawing(false);
    setDrawStartPos(null);
    setPreviewRect(null);
  }, [isAddMode, isDrawing, drawStartPos, previewRect, createShapeAt, setIsDrawing, setDrawStartPos, setPreviewRect, setIsAddMode]);

  // Handle canvas click
  const handleCanvasClick = useCallback((e) => {
    // Only handle clicks on empty canvas (not on shapes)
    if (e.target === e.target.getStage()) {
      if (isAddMode && !isDrawing) {
        // Quick click without drag - handled by mouse up
        return;
      }
    }
  }, [isAddMode, isDrawing]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isAddMode) {
          setIsAddMode(false);
          // Reset drawing state when exiting add mode
          setIsDrawing(false);
          setDrawStartPos(null);
          setPreviewRect(null);
        }
        if (isDeleteMode) setIsDeleteMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAddMode, isDeleteMode, setIsAddMode, setIsDeleteMode, setIsDrawing, setDrawStartPos, setPreviewRect]);

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
