import { useState, useRef, useEffect, useCallback } from 'react';
import { subscribeToCanvasSettings, updateCanvasBackgroundColor } from '../../../utils/firestore';

// localStorage key for viewport state
const VIEWPORT_STORAGE_KEY = 'collabcanvas-viewport';

// Load saved viewport state from localStorage
const loadViewportState = () => {
  try {
    const saved = localStorage.getItem(VIEWPORT_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        scale: parsed.scale || 1,
        x: parsed.x || 0,
        y: parsed.y || 0,
      };
    }
  } catch (error) {
    console.warn('Failed to load viewport state from localStorage:', error);
  }
  return { scale: 1, x: 0, y: 0 };
};

// Save viewport state to localStorage
const saveViewportState = (scale, x, y) => {
  try {
    localStorage.setItem(VIEWPORT_STORAGE_KEY, JSON.stringify({ scale, x, y }));
  } catch (error) {
    console.warn('Failed to save viewport state to localStorage:', error);
  }
};

export const useCanvasState = (currentUser, sessionId) => {
  const stageRef = useRef();
  
  // Canvas background color
  const [canvasBackgroundColor, setCanvasBackgroundColor] = useState('#ffffff');
  
  // Load initial viewport state from localStorage
  const initialViewport = loadViewportState();
  
  // Canvas state - initialize from localStorage
  const [stageScale, setStageScale] = useState(initialViewport.scale);
  const [stageX, setStageX] = useState(initialViewport.x);
  const [stageY, setStageY] = useState(initialViewport.y);
  
  // UI state - Tool modes (only one can be active at a time)
  const [isSelectMode, setIsSelectMode] = useState(true); // Default mode
  const [addMode, setAddMode] = useState('none'); // 'none', 'rectangle', 'circle', 'text'
  const [isPanMode, setIsPanMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStartPos, setDrawStartPos] = useState(null);
  const [previewRect, setPreviewRect] = useState(null);
  
  // Shape creation state
  const [selectedColor, setSelectedColor] = useState('#3B82F6'); // Default blue
  
  // Marquee selection state
  const [isMarqueeSelecting, setIsMarqueeSelecting] = useState(false);
  const [marqueeStart, setMarqueeStart] = useState(null);
  const [marqueeEnd, setMarqueeEnd] = useState(null);
  const [marqueePreviewShapes, setMarqueePreviewShapes] = useState([]); // Shapes being previewed during marquee drag
  
  // Multiplayer state
  const [onlineUsers, setOnlineUsers] = useState({});
  const [isDraggingShape, setIsDraggingShape] = useState(false);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  
  // Text editing state
  const [newlyCreatedTextId, setNewlyCreatedTextId] = useState(null);

  // Subscribe to canvas settings changes
  useEffect(() => {
    if (!currentUser) return;
    
    const unsubscribe = subscribeToCanvasSettings((settings) => {
      setCanvasBackgroundColor(settings.backgroundColor || '#ffffff');
    });
    
    return () => unsubscribe();
  }, [currentUser]);

  // Save viewport state to localStorage whenever it changes (with throttle)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveViewportState(stageScale, stageX, stageY);
    }, 500); // Throttle saves to every 500ms
    
    return () => clearTimeout(timeoutId);
  }, [stageScale, stageX, stageY]);

  // Update canvas background color in Firestore
  const updateBackgroundColor = useCallback(async (color) => {
    if (!currentUser || !sessionId) return;
    
    try {
      await updateCanvasBackgroundColor(color, currentUser.uid, sessionId);
    } catch (error) {
      console.error('Failed to update canvas background color:', error);
    }
  }, [currentUser, sessionId]);

  return {
    stageRef,
    // Canvas background
    canvasBackgroundColor,
    updateBackgroundColor,
    // Canvas state
    stageScale,
    setStageScale,
    stageX,
    setStageX,
    stageY,
    setStageY,
    // UI state
    isSelectMode,
    setIsSelectMode,
    addMode,
    setAddMode,
    isPanMode,
    setIsPanMode,
    isDrawing,
    setIsDrawing,
    drawStartPos,
    setDrawStartPos,
    previewRect,
    setPreviewRect,
    // Shape creation state
    selectedColor,
    setSelectedColor,
    // Marquee selection state
    isMarqueeSelecting,
    setIsMarqueeSelecting,
    marqueeStart,
    setMarqueeStart,
    marqueeEnd,
    setMarqueeEnd,
    marqueePreviewShapes,
    setMarqueePreviewShapes,
    // Multiplayer state
    onlineUsers,
    setOnlineUsers,
    isDraggingShape,
    setIsDraggingShape,
    isDraggingCanvas,
    setIsDraggingCanvas,
    // Text editing state
    newlyCreatedTextId,
    setNewlyCreatedTextId,
  };
};
