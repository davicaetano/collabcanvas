import { useCallback } from 'react';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { useModeManagement } from './useModeManagement';
import { useShapeDrag } from './useShapeDrag';
import { useZoomPan } from './useZoomPan';
import { useShapeOperations } from './useShapeOperations';
import { useDrawing } from './useDrawing';
import { useShapeSelection } from './useShapeSelection';
import { useCursorTracking } from './useCursorTracking';

export const useCanvasHandlers = (canvasState, currentUser) => {
  const {
    stageRef,
    stageX,
    stageY,
    stageScale,
    selectedColor,
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

  // Cursor tracking for multiplayer
  const trackCursor = useCursorTracking(currentUser);

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
    
    // Track cursor position for multiplayer
    trackCursor(canvasPos);
  }, [
    stageRef, 
    stageX, 
    stageY, 
    stageScale,
    handleDrawingMouseMove,
    handleSelectionMouseMove,
    trackCursor
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
