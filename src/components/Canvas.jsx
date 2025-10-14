import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Stage, Layer, Rect, Group, Text as KonvaText } from 'react-konva';
import { useAuth } from '../contexts/AuthContext';
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
} from '../utils/firestore';

// Canvas constants
const CANVAS_WIDTH = 3000;
const CANVAS_HEIGHT = 3000;
const VIEWPORT_WIDTH = window.innerWidth;
const VIEWPORT_HEIGHT = window.innerHeight - 60; // Account for header

// Performance constants
const GRID_SIZE = 50;
const ZOOM_MIN = 0.1;
const ZOOM_MAX = 5;
const ZOOM_SCALE_FACTOR = 1.02;
const CURSOR_UPDATE_THROTTLE = 50; // ms
const MOUSE_POS_UPDATE_THROTTLE = 100; // ms

// Avatar constants
const AVATAR_SIZE = 32; // 8 * 4 (w-8 h-8 in Tailwind)
const AVATAR_FONT_SIZE = 14;

// Helper function to generate consistent unique colors for all user elements
const getUserColor = (userId) => {
  if (!userId) return '#9CA3AF'; // gray-400 fallback
  
  // Unified color palette with excellent contrast and visibility
  // Works well for both cursors and avatar backgrounds
  const colors = [
    '#E53E3E', // Red
    '#3182CE', // Blue
    '#38A169', // Green
    '#D69E2E', // Yellow/Orange
    '#805AD5', // Purple
    '#DD6B20', // Orange
    '#319795', // Teal
    '#E53E3E', // Red variant
    '#2B6CB0', // Blue variant
    '#2F855A', // Green variant
    '#B7791F', // Yellow variant
    '#6B46C1', // Purple variant
    '#C05621', // Orange variant
    '#2C7A7B', // Teal variant
    '#9F1239', // Rose
    '#1E40AF', // Indigo
    '#059669', // Emerald
    '#DC2626', // Red-600
    '#7C3AED', // Violet
    '#0891B2'  // Cyan
  ];

  // Create robust hash from the entire userId
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Use absolute value and modulo to get consistent color index
  const colorIndex = Math.abs(hash) % colors.length;
  return colors[colorIndex];
};
const getUserInitials = (name) => {
  if (!name) return '?';
  const names = name.trim().split(' ');
  // Google style: prefer first initial only, unless it's a very short name
  return names[0].charAt(0).toUpperCase();
};

// Current User Avatar component
const CurrentUserAvatar = React.memo(({ user }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const initials = getUserInitials(user?.displayName);
  const bgColor = getUserColor(user?.uid);
  
  return (
    <div 
      className="w-8 h-8 rounded-full relative shadow-sm overflow-hidden"
      style={{ backgroundColor: bgColor }}
    >
      {/* Initials - only show when no photo or photo failed */}
      {(!user?.photoURL || imageError || !imageLoaded) && (
        <div 
          className="absolute inset-0 flex items-center justify-center text-white font-medium"
          style={{ 
            fontSize: `${AVATAR_FONT_SIZE}px`,
            backgroundColor: bgColor,
            fontWeight: '500',
            lineHeight: `${AVATAR_SIZE}px` // Match container height for perfect centering
          }}
        >
          {initials}
        </div>
      )}
      
      {/* Photo - only render if user has photo AND no error AND loaded */}
      {user?.photoURL && !imageError && (
        <img
          src={user.photoURL}
          alt={user.displayName}
          className="w-full h-full rounded-full object-cover absolute inset-0"
          onError={() => {
            setImageError(true);
            setImageLoaded(false);
          }}
          onLoad={() => {
            setImageError(false);
            setImageLoaded(true);
          }}
        />
      )}
    </div>
  );
});

// Avatar component for online users
const AvatarComponent = React.memo(({ user }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const initials = getUserInitials(user.name);
  const bgColor = getUserColor(user.uid);
  
  return (
    <div
      className="w-8 h-8 rounded-full border-2 border-gray-800 relative shadow-sm overflow-hidden"
      title={user.name}
      style={{ backgroundColor: bgColor }}
    >
      {/* Initials - only show when no photo or photo failed */}
      {(!user.photo || imageError || !imageLoaded) && (
        <div 
          className="absolute inset-0 flex items-center justify-center text-white font-medium"
          style={{ 
            fontSize: `${AVATAR_FONT_SIZE}px`,
            backgroundColor: bgColor,
            fontWeight: '500',
            lineHeight: `${AVATAR_SIZE}px` // Match container height for perfect centering
          }}
        >
          {initials}
        </div>
      )}
      
      {/* Photo - only render if user has photo AND no error */}
      {user.photo && !imageError && (
        <img
          src={user.photo}
          alt={user.name}
          className="w-full h-full rounded-full object-cover absolute inset-0"
          onError={() => {
            setImageError(true);
            setImageLoaded(false);
          }}
          onLoad={() => {
            setImageError(false);
            setImageLoaded(true);
          }}
        />
      )}
    </div>
  );
});

const Canvas = () => {
  const { currentUser, logout } = useAuth();
  const stageRef = useRef();
  
  // Viewport state
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
  
  // Dragging state
  const [isDraggingShape, setIsDraggingShape] = useState(false);
  
  // Set up real-time subscriptions
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
    
    const newScale = e.evt.deltaY > 0 ? oldScale * ZOOM_SCALE_FACTOR : oldScale / ZOOM_SCALE_FACTOR;
    
    // Limit zoom
    if (newScale < ZOOM_MIN || newScale > ZOOM_MAX) return;
    
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
    
    // Confirm before deleting all shapes
    if (window.confirm(`Are you sure you want to delete all ${shapes.length} shapes? This action cannot be undone.`)) {
      try {
        // Delete all shapes from Firestore
        const deletePromises = shapes.map(shape => deleteShapeInFirestore(shape.id));
        await Promise.all(deletePromises);
        // Shapes will be removed from local state via Firestore subscription
      } catch (error) {
        console.error('Error deleting shapes:', error);
      }
    }
  }, [shapes]);
  
  // Handle shape drag
  const handleShapeDragStart = (e) => {
    setIsDraggingShape(true);
    // Stop event propagation to prevent stage drag
    e.evt.stopPropagation();
    // Directly disable stage dragging
    if (stageRef.current) {
      stageRef.current.draggable(false);
    }
  };

  const handleShapeDragEnd = async (e, id, newAttrs) => {
    setIsDraggingShape(false);
    // Stop event propagation
    e.evt.stopPropagation();
    // Directly enable stage dragging
    if (stageRef.current) {
      stageRef.current.draggable(true);
    }
    try {
      await updateShapeInFirestore(id, newAttrs);
      // Shape will be updated in local state via Firestore subscription
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
      {/* Header */}
      <header className="h-15 bg-gray-800 text-white flex items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">CollabCanvas</h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleAddMode}
              className={`px-4 py-2 rounded text-sm transition-colors ${
                isAddMode 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
              title={isAddMode ? "Click on canvas to place rectangle" : "Click to enter add mode"}
            >
              {isAddMode ? '📍 Click to Place' : 'Add Rectangle'}
            </button>
            <button
              onClick={toggleDeleteMode}
              className={`px-4 py-2 rounded text-sm transition-colors ${
                isDeleteMode 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-orange-600 hover:bg-orange-700'
              }`}
              title={isDeleteMode ? "Click on shapes to delete them" : "Click to enter delete mode"}
            >
              {isDeleteMode ? '🗑️ Click to Delete' : 'Delete Shape'}
            </button>
            <button
              onClick={deleteAllShapes}
              disabled={shapes.length === 0}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded text-sm"
              title={shapes.length === 0 ? "No shapes to delete" : `Delete all ${shapes.length} shapes`}
            >
              Clear All
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-300">
              Online: {Object.keys(onlineUsers).length}
            </span>
            <div className="flex -space-x-2">
              {Object.entries(onlineUsers).slice(0, 5).map(([userId, user], index) => (
                <AvatarComponent key={`${userId}-${index}`} user={{...user, uid: userId}} />
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <CurrentUserAvatar user={currentUser} />
            <span className="text-sm">{currentUser?.displayName}</span>
          </div>
          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
          >
            Sign Out
          </button>
        </div>
      </header>
      
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
