import { useState, useRef } from 'react';

export const useCanvasState = () => {
  const stageRef = useRef();
  
  // Canvas state
  const [stageScale, setStageScale] = useState(1);
  const [stageX, setStageX] = useState(0);
  const [stageY, setStageY] = useState(0);
  
  // Shapes state
  const [shapes, setShapes] = useState([]);
  
  // UI state
  const [isAddMode, setIsAddMode] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStartPos, setDrawStartPos] = useState(null);
  const [previewRect, setPreviewRect] = useState(null);
  
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
