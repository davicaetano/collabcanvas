import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Stage, Layer, Rect, Group, Text as KonvaText } from 'react-konva';
import { useAuth } from '../../contexts/AuthContext';
import { 
  subscribeToShapes, 
  createShape as createShapeInFirestore,
  updateShape as updateShapeInFirestore,
  deleteShape as deleteShapeInFirestore,
  updateCursor,
  subscribeToCursors,
  removeCursor,
  updatePresence,
  subscribeToPresence,
  removePresence
} from '../../utils/firestore';
import CanvasHeader from './CanvasHeader';
import { getUserColor } from '../../utils/colors';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  VIEWPORT_WIDTH, 
  VIEWPORT_HEIGHT,
  GRID_SIZE,
  ZOOM_MIN,
  ZOOM_MAX,
  ZOOM_SCALE_FACTOR,
  CURSOR_UPDATE_THROTTLE,
  MOUSE_POS_UPDATE_THROTTLE
} from '../../utils/canvas';

const Canvas = () => {
  const { currentUser, logout } = useAuth();
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
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isDraggingShape, setIsDraggingShape] = useState(false);

  // Subscribe to real-time data
  useEffect(() => {
    if (!currentUser) return;

    // Subscribe to shapes
    const unsubscribeShapes = subscribeToShapes((shapesData) => {
      setShapes(shapesData);
    });

    // Subscribe to cursors
    const unsubscribeCursors = subscribeToCursors((cursorsData) => {
      // Filter out current user's cursor
      const { [currentUser.uid]: _, ...otherCursors } = cursorsData;
      setCursors(otherCursors);
    });

    // Subscribe to presence (no filtering - show all users)
    const unsubscribePresence = subscribeToPresence((presenceData) => {
      setOnlineUsers(presenceData);
    });

    // Initial presence update
    updatePresence(currentUser.uid, {
      name: currentUser.displayName,
      photo: currentUser.photoURL,
    });

    // Handle page unload - remove user immediately when closing app
    const handleBeforeUnload = async () => {
      try {
        await removePresence(currentUser.uid);
        await removeCursor(currentUser.uid);
      } catch (error) {
        console.error('Error cleaning up on page unload:', error);
      }
    };

    // Add event listeners for page unload
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleBeforeUnload);

    // Cleanup on unmount
    return () => {
      unsubscribeShapes();
      unsubscribeCursors();
      unsubscribePresence();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleBeforeUnload);
      
      // Remove presence and cursor
      removeCursor(currentUser.uid);
      removePresence(currentUser.uid);
    };
  }, [currentUser]);
  
  // Handle wheel zoom
  const handleWheel = useCallback((e) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    const oldScale = stage.scaleX();
    const mousePointTo = {
      x: stage.getPointerPosition().x / oldScale - stage.x() / oldScale,
      y: stage.getPointerPosition().y / oldScale - stage.y() / oldScale,
    };

    const newScale = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, e.evt.deltaY > 0 ? oldScale / ZOOM_SCALE_FACTOR : oldScale * ZOOM_SCALE_FACTOR));
    
    setStageScale(newScale);
    setStageX(-(mousePointTo.x - stage.getPointerPosition().x / newScale) * newScale);
    setStageY(-(mousePointTo.y - stage.getPointerPosition().y / newScale) * newScale);
  }, []);
  
  // Handle drag move for panning
  const handleStageDragStart = (e) => {
    // Prevent stage dragging if we're dragging a shape, drawing, in add mode, or in delete mode
    if (isDraggingShape || isDrawing || isAddMode || isDeleteMode) {
      e.evt.preventDefault();
      return false;
    }
  };

  const handleDragEnd = (e) => {
    // Only update stage position if it's actually the stage being dragged
    if (e.target === e.target.getStage()) {
      setStageX(e.target.x());
      setStageY(e.target.y());
    }
  };
  
  // Toggle add mode (for button click)
  const toggleAddMode = useCallback(() => {
    setIsAddMode(!isAddMode);
    // Exit delete mode if entering add mode
    if (!isAddMode) {
      setIsDeleteMode(false);
    }
  }, [isAddMode]);

  // Toggle delete mode (for button click)
  const toggleDeleteMode = useCallback(() => {
    setIsDeleteMode(!isDeleteMode);
    // Exit add mode if entering delete mode
    if (!isDeleteMode) {
      setIsAddMode(false);
    }
  }, [isDeleteMode]);

  // Create new shape at specific position and size
  const createShapeAt = useCallback(async (x, y, width = 100, height = 100) => {
    const newShape = {
      id: Date.now().toString(),
      x: width === 100 ? x - 50 : x, // Center default rectangles, use exact position for drawn ones
      y: height === 100 ? y - 50 : y,
      width,
      height,
      fill: '#3B82F6',
    };
    
    try {
      await createShapeInFirestore(newShape, currentUser?.uid);
      setIsAddMode(false); // Exit add mode after placing rectangle
      // Shape will be added to local state via Firestore subscription
    } catch (error) {
      console.error('Error creating shape:', error);
    }
  }, [currentUser]);

  // Delete all shapes
  const deleteAllShapes = useCallback(async () => {
    if (shapes.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete all ${shapes.length} shapes? This action cannot be undone.`)) {
      try {
        const deletePromises = shapes.map(shape => deleteShapeInFirestore(shape.id));
        await Promise.all(deletePromises);
      } catch (error) {
        console.error('Error deleting shapes:', error);
      }
    }
  }, [shapes]);

  // Handle shape operations
  const handleShapeDragStart = (e) => {
    setIsDraggingShape(true);
  };

  const handleShapeDragEnd = async (e, shapeId, updates) => {
    setIsDraggingShape(false);
    
    try {
      await updateShapeInFirestore(shapeId, updates);
    } catch (error) {
      console.error('Error updating shape:', error);
    }
  };
  
  // Handle mouse move for cursor tracking
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

    // Handle rectangle drawing when in add mode and drawing
    if (isAddMode && isDrawing && drawStartPos) {
      const width = canvasPos.x - drawStartPos.x;
      const height = canvasPos.y - drawStartPos.y;
      
      setPreviewRect({
        x: width < 0 ? canvasPos.x : drawStartPos.x,
        y: height < 0 ? canvasPos.y : drawStartPos.y,
        width: Math.abs(width),
        height: Math.abs(height),
      });
    }
    
    // Only update mouse position state occasionally to avoid excessive re-renders
    if (Date.now() - (handleMouseMove.lastPosUpdate || 0) > MOUSE_POS_UPDATE_THROTTLE) {
      setMousePos(canvasPos);
      handleMouseMove.lastPosUpdate = Date.now();
    }
    
    // Throttle cursor updates
    if (Date.now() - (handleMouseMove.lastUpdate || 0) > CURSOR_UPDATE_THROTTLE) {
      updateCursor(currentUser.uid, {
        x: canvasPos.x,
        y: canvasPos.y,
        name: currentUser.displayName,
        color: getUserColor(currentUser.uid),
      });
      handleMouseMove.lastUpdate = Date.now();
    }
  }, [currentUser, stageX, stageY, stageScale, isAddMode, isDrawing, drawStartPos]);

  // Handle canvas click and mouse down for drawing
  const handleCanvasMouseDown = useCallback((e) => {
    // In add mode, always handle mouse down for drawing, regardless of target
    if (isAddMode) {
      // Stop event from propagating to shapes
      e.evt.stopPropagation();
      
      const stage = stageRef.current;
      const pos = stage.getPointerPosition();
      if (!pos) return;
      
      const canvasPos = {
        x: (pos.x - stageX) / stageScale,
        y: (pos.y - stageY) / stageScale,
      };
      
      // Start drawing
      setIsDrawing(true);
      setDrawStartPos(canvasPos);
      setPreviewRect({
        x: canvasPos.x,
        y: canvasPos.y,
        width: 0,
        height: 0,
      });
    }
  }, [isAddMode, stageX, stageY, stageScale]);

  // Handle mouse up to finish drawing
  const handleCanvasMouseUp = useCallback(async () => {
    if (isAddMode && isDrawing && drawStartPos && previewRect) {
      // Check if it was a click (small drag) or actual drag
      const dragDistance = Math.sqrt(
        Math.pow(previewRect.width, 2) + Math.pow(previewRect.height, 2)
      );
      
      if (dragDistance < 10) {
        // Small drag or click - create default size rectangle
        await createShapeAt(drawStartPos.x, drawStartPos.y);
      } else if (previewRect.width > 5 && previewRect.height > 5) {
        // Actual drag - create rectangle with drawn dimensions
        await createShapeAt(
          previewRect.x,
          previewRect.y,
          previewRect.width,
          previewRect.height
        );
      }
    }
    
    // Reset drawing state
    setIsDrawing(false);
    setDrawStartPos(null);
    setPreviewRect(null);
  }, [isAddMode, isDrawing, drawStartPos, previewRect, createShapeAt]);

  // Handle canvas click (for non-drawing interactions)
  const handleCanvasClick = useCallback(async (e) => {
    // Only handle clicks on empty canvas (not on shapes)
    if (e.target === e.target.getStage()) {
      if (isAddMode && !isDrawing) {
        // Quick click without drag - handled by mouse up
        return;
      }
    }
  }, [isAddMode, isDrawing]);

  // Handle escape key to exit add mode or delete mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isAddMode) {
          setIsAddMode(false);
        }
        if (isDeleteMode) {
          setIsDeleteMode(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAddMode, isDeleteMode]);
  
  return (
    <div className="h-screen flex flex-col">
      <CanvasHeader
        isAddMode={isAddMode}
        isDeleteMode={isDeleteMode}
        onToggleAddMode={toggleAddMode}
        onToggleDeleteMode={toggleDeleteMode}
        onDeleteAllShapes={deleteAllShapes}
        shapesCount={shapes.length}
        currentUser={currentUser}
        onlineUsers={onlineUsers}
        onLogout={logout}
      />
      
      {/* Canvas */}
      <div className="flex-1 overflow-hidden bg-gray-100">
        <Stage
          ref={stageRef}
          width={VIEWPORT_WIDTH}
          height={VIEWPORT_HEIGHT}
          draggable={!isAddMode && !isDeleteMode && !isDraggingShape}
          onDragStart={handleStageDragStart}
          onWheel={handleWheel}
          onDragEnd={handleDragEnd}
          onMouseMove={handleMouseMove}
          onMouseDown={handleCanvasMouseDown}
          onMouseUp={handleCanvasMouseUp}
          onClick={handleCanvasClick}
          scaleX={stageScale}
          scaleY={stageScale}
          x={stageX}
          y={stageY}
          style={{ 
            cursor: isAddMode ? 'crosshair' : isDeleteMode ? 'not-allowed' : 'default' 
          }}
        >
          <Layer>
            {/* Grid background - optimized rendering */}
            {Array.from({ length: Math.ceil(CANVAS_WIDTH / GRID_SIZE) }, (_, i) => (
              <React.Fragment key={`grid-v-${i}`}>
                <Rect
                  x={i * GRID_SIZE}
                  y={0}
                  width={1}
                  height={CANVAS_HEIGHT}
                  fill="#e5e5e5"
                />
              </React.Fragment>
            ))}
            {Array.from({ length: Math.ceil(CANVAS_HEIGHT / GRID_SIZE) }, (_, i) => (
              <React.Fragment key={`grid-h-${i}`}>
                <Rect
                  x={0}
                  y={i * GRID_SIZE}
                  width={CANVAS_WIDTH}
                  height={1}
                  fill="#e5e5e5"
                />
              </React.Fragment>
            ))}
            
            {/* Preview rectangle while drawing in add mode */}
            {isAddMode && previewRect && (
              <Rect
                x={previewRect.x}
                y={previewRect.y}
                width={previewRect.width}
                height={previewRect.height}
                fill="rgba(59, 130, 246, 0.2)"
                stroke="#3B82F6"
                strokeWidth={2}
                dash={[5, 5]}
                listening={false}
              />
            )}
            
            {/* Shapes */}
            {shapes.map((shape) => (
              <Rect
                key={shape.id}
                id={shape.id}
                x={shape.x}
                y={shape.y}
                width={shape.width}
                height={shape.height}
                fill={shape.fill}
                draggable={!isAddMode && !isDeleteMode}
                onClick={async (e) => {
                  if (isDeleteMode) {
                    // Delete shape when in delete mode
                    e.evt.stopPropagation();
                    try {
                      await deleteShapeInFirestore(shape.id);
                      // Exit delete mode after deleting a shape
                      setIsDeleteMode(false);
                    } catch (error) {
                      console.error('Error deleting shape:', error);
                    }
                  }
                }}
                onDragStart={(e) => {
                  if (isAddMode || isDeleteMode) {
                    e.evt.preventDefault();
                    return false;
                  }
                  handleShapeDragStart(e);
                }}
                onDragMove={(e) => {
                  if (isAddMode || isDeleteMode) return;
                  
                  // Update shape position in real-time for other users
                  const newPosition = {
                    x: e.target.x(),
                    y: e.target.y(),
                  };
                  
                  // Throttle shape updates during drag
                  const now = Date.now();
                  if (now - (e.target._lastShapeUpdate || 0) > 50) { // 20fps updates
                    updateShapeInFirestore(shape.id, {
                      ...shape,
                      x: newPosition.x,
                      y: newPosition.y,
                    });
                    e.target._lastShapeUpdate = now;
                  }
                  
                  // Update cursor position while dragging shapes
                  if (currentUser) {
                    const stage = stageRef.current;
                    const pos = stage.getPointerPosition();
                    if (pos) {
                      const canvasPos = {
                        x: (pos.x - stageX) / stageScale,
                        y: (pos.y - stageY) / stageScale,
                      };
                      
                      // Throttle cursor updates during drag
                      if (now - (handleMouseMove.lastUpdate || 0) > CURSOR_UPDATE_THROTTLE) {
                        updateCursor(currentUser.uid, {
                          x: canvasPos.x,
                          y: canvasPos.y,
                          name: currentUser.displayName,
                          color: getUserColor(currentUser.uid),
                        });
                        handleMouseMove.lastUpdate = now;
                      }
                    }
                  }
                }}
                onDragEnd={(e) => {
                  if (isAddMode || isDeleteMode) return;
                  handleShapeDragEnd(e, shape.id, {
                    x: e.target.x(),
                    y: e.target.y(),
                  });
                }}
                onMouseEnter={(e) => {
                  if (isDeleteMode) {
                    e.target.getStage().container().style.cursor = 'pointer';
                  } else if (!isAddMode) {
                    e.target.getStage().container().style.cursor = 'pointer';
                  }
                }}
                onMouseLeave={(e) => {
                  if (isDeleteMode) {
                    e.target.getStage().container().style.cursor = 'not-allowed';
                  } else if (!isAddMode) {
                    e.target.getStage().container().style.cursor = 'default';
                  }
                }}
              />
            ))}
            
            {/* Other users' cursors */}
            {Object.entries(cursors).map(([userId, cursor]) => (
              <Group key={userId} x={cursor.x} y={cursor.y}>
                <KonvaText
                  text="↖"
                  fontSize={20}
                  fill={cursor.color}
                />
                <KonvaText
                  text={cursor.name}
                  fontSize={12}
                  fill={cursor.color}
                  x={15}
                  y={-5}
                />
              </Group>
            ))}
          </Layer>
        </Stage>
      </div>
    </div>
  );
};

export default Canvas;
