import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import CanvasHeader from './CanvasHeader';
import CanvasStage from './CanvasStage';
import { useCanvasState } from './hooks/useCanvasState';
import { useCanvasHandlers } from './hooks/useCanvasHandlers';
import { useMultiplayer } from './hooks/useMultiplayer';

const Canvas = () => {
  const { currentUser, logout } = useAuth();
  
  // Custom hooks for state management
  const canvasState = useCanvasState();
  const handlers = useCanvasHandlers(canvasState, currentUser);
  
  // Real-time multiplayer features
  useMultiplayer(
    currentUser, 
    canvasState.setShapes, 
    canvasState.setCursors, 
    canvasState.setOnlineUsers
  );

  return (
    <div className="h-screen flex flex-col">
      <CanvasHeader
        isAddMode={canvasState.isAddMode}
        isDeleteMode={canvasState.isDeleteMode}
        onToggleAddMode={handlers.toggleAddMode}
        onToggleDeleteMode={handlers.toggleDeleteMode}
        onDeleteAllShapes={handlers.deleteAllShapes}
        onAdd500Rectangles={handlers.add500Rectangles}
        shapesCount={canvasState.shapes.length}
        currentUser={currentUser}
        onlineUsers={canvasState.onlineUsers}
        onLogout={logout}
      />
      
      <CanvasStage 
        canvasState={canvasState}
        handlers={handlers}
        currentUser={currentUser}
      />
    </div>
  );
};

export default Canvas;