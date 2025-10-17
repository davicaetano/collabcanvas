import { useCallback, useRef, useEffect } from 'react';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { useModeManagement } from './useModeManagement';
import { useShapeDrag } from './useShapeDrag';
import { useZoomPan } from './useZoomPan';
import { useShapeOperations } from './useShapeOperations';
import { useDrawing } from './useDrawing';
import { useShapeSelection } from './useShapeSelection';

export const useCanvasHandlers = (canvasState, currentUser, sessionId, shapeManager, cursorManager, handleToolChange) => {
  const {
    stageRef,
    stageX,
    stageY,
    stageScale,
    selectedColor,
    isPanMode,
    setIsPanMode,
    setIsDraggingCanvas,
  } = canvasState;
  
  // Track previous pan mode state for middle mouse button
  const previousPanModeRef = useRef(false);
  const isMiddleMousePanningRef = useRef(false);
  
  // Global mouse up listener for middle mouse button
  useEffect(() => {
    const handleGlobalMouseUp = (e) => {
      // Check if middle mouse button was released
      if (e.button === 1 && isMiddleMousePanningRef.current) {
        // Restore previous pan mode state
        setIsPanMode(previousPanModeRef.current);
        setIsDraggingCanvas(false);
        isMiddleMousePanningRef.current = false;
      }
    };
    
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [setIsPanMode, setIsDraggingCanvas]);

  // Keyboard shortcuts handler
  useKeyboardShortcuts(canvasState, shapeManager, handleToolChange);

  // Mode management
  const { setAddModeWithShape } = useModeManagement(canvasState);

  // Shape drag handlers
  const { handleShapeDragStart, handleShapeDragEnd } = useShapeDrag(canvasState);

  // Zoom and pan handlers
  const { handleWheel, handleStageDragStart, handleDragEnd } = useZoomPan(canvasState);

  // Shape operations (CRUD)
  const { createShapeAt, deleteAllShapes, add500Rectangles } = useShapeOperations(currentUser, selectedColor, shapeManager);

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
    
    // Track cursor position for multiplayer
    cursorManager.trackCursorPosition(canvasPos);
  }, [
    currentUser,
    stageRef, 
    stageX, 
    stageY, 
    stageScale,
    handleDrawingMouseMove,
    handleSelectionMouseMove,
    cursorManager
  ]);

  // Handle canvas mouse down for drawing and marquee selection
  const handleCanvasMouseDown = useCallback((e) => {
    // Check if middle mouse button (button === 1)
    if (e.evt.button === 1) {
      e.evt.preventDefault();
      // Save current pan mode state and activate pan temporarily
      previousPanModeRef.current = isPanMode;
      isMiddleMousePanningRef.current = true;
      setIsPanMode(true);
      setIsDraggingCanvas(true); // Show grabbing cursor immediately
      
      // Start dragging the stage immediately
      const stage = stageRef.current;
      if (stage) {
        stage.startDrag();
      }
      return;
    }
    
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
    stageScale,
    isPanMode,
    setIsPanMode,
    setIsDraggingCanvas
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
    setAddModeWithShape,
    handleWheel,
    handleStageDragStart,
    handleDragEnd,
    handleShapeDragStart,
    handleShapeDragEnd,
    handleMouseMove,
    handleCanvasMouseDown,
    handleCanvasMouseUp,
    handleCanvasClick,
    sessionId, // Pass sessionId down to components that need it
  };
};
