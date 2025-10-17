import { useCallback } from 'react';
import { 
  ZOOM_MIN, 
  ZOOM_MAX, 
  MOUSE_WHEEL_THRESHOLD
} from '../../../utils/canvas';

/**
 * Hook to handle canvas zoom and pan functionality
 * 
 * Trackpad:
 * - Pinch gesture (two fingers closer/apart) = Zoom
 * - Two-finger scroll = Pan
 * 
 * Mouse:
 * - Ctrl + Scroll = Zoom
 * - Scroll (without Ctrl) = Pan (vertical/horizontal)
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

  // Handle wheel events (zoom with pinch, pan with two-finger scroll)
  const handleWheel = useCallback((e) => {
    e.evt.preventDefault();
    
    const stage = stageRef.current;
    const evt = e.evt;
    
    // Detect if this is a pinch gesture (zoom) or scroll gesture (pan)
    // Pinch gestures come with ctrlKey = true on most trackpads
    const isPinch = evt.ctrlKey;
    
    if (isPinch) {
      // ZOOM: Pinch gesture
      const oldScale = stageScale;
      const pointer = stage.getPointerPosition();
      const deltaY = evt.deltaY;
      
      // Improve zoom sensitivity for different input devices
      const isMouse = Math.abs(deltaY) > MOUSE_WHEEL_THRESHOLD;
      
      let zoomIntensity;
      if (isMouse) {
        // For mouse wheels with Ctrl: use a more aggressive zoom factor
        zoomIntensity = deltaY > 0 ? 0.9 : 1.1; // 10% zoom per scroll
      } else {
        // For trackpads pinch: use smooth zoom factor scaled with deltaY
        const scaleFactor = 1 + (Math.abs(deltaY) * 0.01);
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
    } else {
      // PAN: Two-finger scroll gesture
      const deltaX = evt.deltaX;
      const deltaY = evt.deltaY;
      
      // Apply pan based on scroll delta
      // Invert direction for natural scrolling feel
      setStageX(stageX - deltaX);
      setStageY(stageY - deltaY);
    }
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

