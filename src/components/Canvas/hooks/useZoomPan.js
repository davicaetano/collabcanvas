import { useCallback } from 'react';
import { 
  ZOOM_MIN, 
  ZOOM_MAX, 
  MOUSE_WHEEL_THRESHOLD
} from '../../../utils/canvas';

/**
 * Hook to handle canvas zoom and pan functionality
 * Manages wheel zoom (mouse wheel and trackpad) and canvas dragging (pan)
 * 
 * @param {Object} canvasState - Canvas state object from useCanvasState
 * @returns {Object} - Zoom and pan handlers
 */
export const useZoomPan = (canvasState) => {
  const {
    stageRef,
    stageScale,
    setStageScale,
    stageX,
    setStageX,
    stageY,
    setStageY,
    isDraggingShape,
    setIsDraggingShape,
    isDrawing,
    addMode,
    setIsDraggingCanvas,
  } = canvasState;

  // Handle wheel zoom (mouse wheel and trackpad)
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

  // Handle stage drag start (pan)
  const handleStageDragStart = useCallback((e) => {
    // Prevent stage dragging if we're dragging a shape, drawing, or in add mode
    if (isDraggingShape || isDrawing || addMode !== 'none') {
      e.evt.preventDefault();
      return false;
    }
    setIsDraggingShape(false);
    setIsDraggingCanvas(true); // Set canvas dragging state
  }, [isDraggingShape, isDrawing, addMode, setIsDraggingShape, setIsDraggingCanvas]);

  // Handle drag end (pan)
  const handleDragEnd = useCallback((e) => {
    // Only update stage position if it's actually the stage being dragged
    if (e.target === e.target.getStage()) {
      setStageX(e.target.x());
      setStageY(e.target.y());
    }
    setIsDraggingCanvas(false); // Reset canvas dragging state
  }, [setStageX, setStageY, setIsDraggingCanvas]);

  return {
    handleWheel,
    handleStageDragStart,
    handleDragEnd,
  };
};

