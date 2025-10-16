import { useCallback } from 'react';
import { 
  updateCursor
} from '../../../utils/firestore';
import { getUserColor } from '../../../utils/colors';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { useModeManagement } from './useModeManagement';
import { useShapeDrag } from './useShapeDrag';
import { useZoomPan } from './useZoomPan';
import { useShapeOperations } from './useShapeOperations';
import { useDrawing } from './useDrawing';
import { useShapeSelection } from './useShapeSelection';
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

  // Selection handlers (Select Mode with Marquee)
  const {
    handleSelectionMouseDown,
    handleSelectionMouseMove,
    handleSelectionMouseUp,
    handleSelectionClick,
  } = useShapeSelection(canvasState);

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
    handleSelectionMouseMove(canvasPos);
    
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
    handleSelectionMouseMove
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
    handleSelectionMouseDown(e, canvasPos);
  }, [
    handleDrawingMouseDown,
    handleSelectionMouseDown,
    stageRef, 
    stageX, 
    stageY, 
    stageScale
  ]);

  // Handle canvas mouse up
  const handleCanvasMouseUp = useCallback(async () => {
    // Handle add mode (rectangle creation)
    await handleDrawingMouseUp();
    
    // Handle marquee selection
    handleSelectionMouseUp();
    
    // Reset drawing state
    resetDrawingState();
  }, [
    handleDrawingMouseUp,
    handleSelectionMouseUp,
    resetDrawingState
  ]);

  // Handle canvas click (delegated to selection handler)
  const handleCanvasClick = handleSelectionClick;

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
