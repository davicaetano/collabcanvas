import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Stage, Layer, Rect, Group, Text as KonvaText } from 'react-konva';
import { useAuth } from '../contexts/AuthContext';
import { 
  subscribeToShapes, 
  createShape as createShapeInFirestore,
  updateShape as updateShapeInFirestore,
  updateCursor,
  subscribeToCursors,
  removeCursor,
  updatePresence,
  subscribeToPresence,
  removePresence,
  updateHeartbeat,
  cleanupInactiveUsers,
  filterActiveUsers
} from '../utils/firestore';

// Canvas constants
const CANVAS_WIDTH = 3000;
const CANVAS_HEIGHT = 3000;
const VIEWPORT_WIDTH = window.innerWidth;
const VIEWPORT_HEIGHT = window.innerHeight - 60; // Account for header

// Helper function to get user initials (Google style - prefer 1 initial)
const getUserInitials = (name) => {
  if (!name) return '?';
  const names = name.trim().split(' ');
  // Google style: prefer first initial only, unless it's a very short name
  return names[0].charAt(0).toUpperCase();
};

// Helper function to generate Google-like colors for user based on name
const getUserColor = (name) => {
  if (!name) return '#9CA3AF'; // gray-400
  
  // Google-like color palette
  const googleColors = [
    '#DB4437', // Red
    '#4285F4', // Blue  
    '#0F9D58', // Green
    '#F4B400', // Yellow
    '#AB47BC', // Purple
    '#FF7043', // Orange
    '#00ACC1', // Cyan
    '#7B1FA2', // Deep Purple
    '#689F38', // Light Green
    '#FF5722', // Deep Orange
    '#795548', // Brown
    '#607D8B'  // Blue Grey
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return googleColors[Math.abs(hash) % googleColors.length];
};

// Current User Avatar component
const CurrentUserAvatar = ({ user }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const initials = getUserInitials(user?.displayName);
  const bgColor = getUserColor(user?.displayName);
  
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
            fontSize: '14px',
            backgroundColor: bgColor,
            fontWeight: '500',
            lineHeight: '32px' // Match container height for perfect centering
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
          onError={(e) => {
            console.log('Current user image failed to load');
            setImageError(true);
            setImageLoaded(false);
          }}
          onLoad={(e) => {
            console.log('Current user image loaded successfully');
            setImageError(false);
            setImageLoaded(true);
          }}
        />
      )}
    </div>
  );
};

// Avatar component for online users
const AvatarComponent = ({ user, index }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const initials = getUserInitials(user.name);
  const bgColor = getUserColor(user.name);
  
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
            fontSize: '14px',
            backgroundColor: bgColor,
            fontWeight: '500',
            lineHeight: '32px' // Match container height for perfect centering
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
          onError={(e) => {
            console.log('Image failed to load for:', user.name);
            setImageError(true);
            setImageLoaded(false);
          }}
          onLoad={(e) => {
            console.log('Image loaded successfully for:', user.name);
            setImageError(false);
            setImageLoaded(true);
          }}
        />
      )}
    </div>
  );
};

const Canvas = () => {
  const { currentUser, logout } = useAuth();
  const stageRef = useRef();
  
  // Viewport state
  const [stageScale, setStageScale] = useState(1);
  const [stageX, setStageX] = useState(0);
  const [stageY, setStageY] = useState(0);
  
  // Shapes state
  const [shapes, setShapes] = useState([]);
  
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

    // Subscribe to presence with active user filtering
    const unsubscribePresence = subscribeToPresence((presenceData) => {
      const activeUsers = filterActiveUsers(presenceData);
      setOnlineUsers(activeUsers);
    });

    // Initial presence update
    updatePresence(currentUser.uid, {
      name: currentUser.displayName,
      photo: currentUser.photoURL,
    });

    // Set up heartbeat to update presence every 60 seconds (reduced frequency)
    const heartbeatInterval = setInterval(async () => {
      try {
        await updateHeartbeat(currentUser.uid);
      } catch (error) {
        console.error('Error updating heartbeat:', error);
      }
    }, 60000); // 60 seconds instead of 30

    // Set up cleanup to remove inactive users every 2 minutes
    const cleanupInterval = setInterval(async () => {
      try {
        await cleanupInactiveUsers();
      } catch (error) {
        console.error('Error cleaning up inactive users:', error);
      }
    }, 120000); // 2 minutes instead of 1

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
      clearInterval(heartbeatInterval);
      clearInterval(cleanupInterval);
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
    
    const scaleBy = 1.02;
    const stage = stageRef.current;
    const oldScale = stage.scaleX();
    const mousePointTo = {
      x: stage.getPointerPosition().x / oldScale - stage.x() / oldScale,
      y: stage.getPointerPosition().y / oldScale - stage.y() / oldScale,
    };
    
    const newScale = e.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    
    // Limit zoom
    if (newScale < 0.1 || newScale > 5) return;
    
    setStageScale(newScale);
    setStageX(-(mousePointTo.x - stage.getPointerPosition().x / newScale) * newScale);
    setStageY(-(mousePointTo.y - stage.getPointerPosition().y / newScale) * newScale);
  }, []);
  
  // Handle drag move for panning
  const handleStageDragStart = (e) => {
    // Prevent stage dragging if we're dragging a shape
    if (isDraggingShape) {
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
  
  // Create new shape
  const createShape = useCallback(async () => {
    const newShape = {
      id: Date.now().toString(),
      x: -stageX / stageScale + 100,
      y: -stageY / stageScale + 100,
      width: 100,
      height: 100,
      fill: '#3B82F6',
    };
    
    try {
      await createShapeInFirestore(newShape, currentUser?.uid);
      // Shape will be added to local state via Firestore subscription
    } catch (error) {
      console.error('Error creating shape:', error);
    }
  }, [stageX, stageY, stageScale, currentUser]);
  
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
    
    // Only update mouse position state occasionally to avoid excessive re-renders
    if (Date.now() - (handleMouseMove.lastPosUpdate || 0) > 100) {
      setMousePos(canvasPos);
      handleMouseMove.lastPosUpdate = Date.now();
    }
    
    // Throttle cursor updates (update every 50ms)
    if (Date.now() - (handleMouseMove.lastUpdate || 0) > 50) {
      updateCursor(currentUser.uid, {
        x: canvasPos.x,
        y: canvasPos.y,
        name: currentUser.displayName,
        color: `hsl(${currentUser.uid.charCodeAt(0) * 137.508 % 360}, 70%, 50%)`,
      });
      handleMouseMove.lastUpdate = Date.now();
    }
  }, [currentUser, stageX, stageY, stageScale]);
  
  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="h-15 bg-gray-800 text-white flex items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">CollabCanvas</h1>
          <button
            onClick={createShape}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm"
          >
            Add Rectangle
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-300">
              Online: {Object.keys(onlineUsers).length}
            </span>
            <div className="flex -space-x-2">
              {Object.values(onlineUsers).slice(0, 5).map((user, index) => (
                <AvatarComponent key={`${user.uid}-${index}`} user={user} index={index} />
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
          draggable={true}
          onDragStart={handleStageDragStart}
          onWheel={handleWheel}
          onDragEnd={handleDragEnd}
          onMouseMove={handleMouseMove}
          scaleX={stageScale}
          scaleY={stageScale}
          x={stageX}
          y={stageY}
        >
          <Layer>
            {/* Grid background */}
            {Array.from({ length: Math.ceil(CANVAS_WIDTH / 50) }, (_, i) => (
              <React.Fragment key={`grid-${i}`}>
                <Rect
                  x={i * 50}
                  y={0}
                  width={1}
                  height={CANVAS_HEIGHT}
                  fill="#e5e5e5"
                />
                <Rect
                  x={0}
                  y={i * 50}
                  width={CANVAS_WIDTH}
                  height={1}
                  fill="#e5e5e5"
                />
              </React.Fragment>
            ))}
            
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
                draggable
                onDragStart={handleShapeDragStart}
                onDragEnd={(e) => {
                  handleShapeDragEnd(e, shape.id, {
                    x: e.target.x(),
                    y: e.target.y(),
                  });
                }}
                onMouseEnter={(e) => {
                  e.target.getStage().container().style.cursor = 'pointer';
                }}
                onMouseLeave={(e) => {
                  e.target.getStage().container().style.cursor = 'default';
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
