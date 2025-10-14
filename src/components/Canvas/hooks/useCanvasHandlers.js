import { useCallback, useEffect } from 'react';
import { 
  createShape as createShapeInFirestore,
  deleteShape as deleteShapeInFirestore,
  updateCursor
} from '../../../utils/firestore';
import { getUserColor } from '../../../utils/colors';
import { 
  ZOOM_MIN, 
  ZOOM_MAX, 
  ZOOM_SCALE_FACTOR,
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
    setMousePos,
    isDraggingShape,
    setIsDraggingShape,
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
      fill: 'blue',
      stroke: 'blue',
      strokeWidth: 2,
    };
    
    await createShapeInFirestore(newShape, currentUser.uid);
  }, [currentUser]);

  // Delete all shapes
  const deleteAllShapes = useCallback(async () => {
    const deletePromises = shapes.map(shape => deleteShapeInFirestore(shape.id));
    await Promise.all(deletePromises);
  }, [shapes]);

  // Toggle modes
  const toggleAddMode = useCallback(() => {
    setIsAddMode(prev => !prev);
    if (isDeleteMode) setIsDeleteMode(false);
  }, [isDeleteMode, setIsAddMode, setIsDeleteMode]);

  const toggleDeleteMode = useCallback(() => {
    setIsDeleteMode(prev => !prev);
    if (isAddMode) setIsAddMode(false);
  }, [isAddMode, setIsAddMode, setIsDeleteMode]);

  // Handle wheel zoom
  const handleWheel = useCallback((e) => {
    e.evt.preventDefault();
    
    const stage = stageRef.current;
    const oldScale = stageScale;
    const pointer = stage.getPointerPosition();
    
    const scaleBy = e.evt.deltaY > 0 ? 1 / ZOOM_SCALE_FACTOR : ZOOM_SCALE_FACTOR;
    const newScale = Math.min(Math.max(oldScale * scaleBy, ZOOM_MIN), ZOOM_MAX);
    
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
  }, [isDraggingShape, isDrawing, isAddMode, isDeleteMode, setIsDraggingShape]);

  const handleDragEnd = useCallback((e) => {
    // Only update stage position if it's actually the stage being dragged
    if (e.target === e.target.getStage()) {
      setStageX(e.target.x());
      setStageY(e.target.y());
    }
  }, [setStageX, setStageY]);

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
    
    setMousePos(canvasPos);
    
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
    setMousePos, 
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
      
      if (dragDistance < 10) {
        // Small drag or click - create default size rectangle
        await createShapeAt(drawStartPos.x, drawStartPos.y);
        // Exit add mode after creating rectangle
        setIsAddMode(false);
      } else if (previewRect.width > 5 && previewRect.height > 5) {
        // Actual drag - create rectangle with drawn dimensions
        await createShapeAt(
          previewRect.x,
          previewRect.y,
          previewRect.width,
          previewRect.height
        );
        // Exit add mode after creating rectangle
        setIsAddMode(false);
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
        if (isAddMode) setIsAddMode(false);
        if (isDeleteMode) setIsDeleteMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAddMode, isDeleteMode, setIsAddMode, setIsDeleteMode]);

  return {
    createShapeAt,
    deleteAllShapes,
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
