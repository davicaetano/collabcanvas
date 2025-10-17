import { useState, useRef, useEffect, useCallback } from 'react';
import { subscribeToCanvasSettings, updateCanvasBackgroundColor } from '../../../utils/firestore';

export const useCanvasState = (currentUser, sessionId) => {
  const stageRef = useRef();
  
  // Canvas background color
  const [canvasBackgroundColor, setCanvasBackgroundColor] = useState('#ffffff');
  
  // Canvas state
  const [stageScale, setStageScale] = useState(1);
  const [stageX, setStageX] = useState(0);
  const [stageY, setStageY] = useState(0);
  
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
