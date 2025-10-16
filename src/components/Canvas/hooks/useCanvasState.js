import { useState, useRef } from 'react';

export const useCanvasState = () => {
  const stageRef = useRef();
  
  // Canvas state
  const [stageScale, setStageScale] = useState(1);
  const [stageX, setStageX] = useState(0);
  const [stageY, setStageY] = useState(0);
  
  // Shapes state
  const [shapes, setShapes] = useState([]);
  
  // UI state - Tool modes (only one can be active at a time)
  const [isSelectMode, setIsSelectMode] = useState(true); // Default mode
  const [addMode, setAddMode] = useState('none'); // 'none', 'rectangle', 'circle', 'text'
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [isPanMode, setIsPanMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStartPos, setDrawStartPos] = useState(null);
  const [previewRect, setPreviewRect] = useState(null);
  
  // Shape creation state
  const [selectedColor, setSelectedColor] = useState('#3B82F6'); // Default blue
  
  // Selection state
  const [selectedShapes, setSelectedShapes] = useState([]);
  
  // Marquee selection state
  const [isMarqueeSelecting, setIsMarqueeSelecting] = useState(false);
  const [marqueeStart, setMarqueeStart] = useState(null);
  const [marqueeEnd, setMarqueeEnd] = useState(null);
  const [marqueePreviewShapes, setMarqueePreviewShapes] = useState([]); // Shapes being previewed during marquee drag
  
  // Multiplayer state
  const [cursors, setCursors] = useState({});
  const [onlineUsers, setOnlineUsers] = useState({});
  const [isDraggingShape, setIsDraggingShape] = useState(false);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);

  return {
    stageRef,
    // Canvas state
    stageScale,
    setStageScale,
    stageX,
    setStageX,
    stageY,
    setStageY,
    // Shapes state
    shapes,
    setShapes,
    // UI state
    isSelectMode,
    setIsSelectMode,
    addMode,
    setAddMode,
    isDeleteMode,
    setIsDeleteMode,
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
    // Selection state
    selectedShapes,
    setSelectedShapes,
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
    cursors,
    setCursors,
    onlineUsers,
    setOnlineUsers,
    isDraggingShape,
    setIsDraggingShape,
    isDraggingCanvas,
    setIsDraggingCanvas,
  };
};
