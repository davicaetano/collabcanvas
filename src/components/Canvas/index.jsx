import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import CanvasHeader from './CanvasHeader';
import CanvasStage from './CanvasStage';
import FloatingToolbar from './FloatingToolbar';
import PropertiesToolbar from './PropertiesToolbar';
import { useCanvasState } from './hooks/useCanvasState';
import { useCanvasHandlers } from './hooks/useCanvasHandlers';
import { useMultiplayer } from './hooks/useMultiplayer';

const Canvas = () => {
  const { currentUser, logout } = useAuth();
  
  // Custom hooks for state management
  const canvasState = useCanvasState();
  const handlers = useCanvasHandlers(canvasState, currentUser);
  
  // Floating toolbar state - lifted up to sync with canvas modes
  const [selectedTool, setSelectedTool] = useState('select');
  
  // Tool change handler - maps toolbar selections to canvas modes
  const handleToolChange = useCallback((toolId) => {
    setSelectedTool(toolId);
    
    // Map toolbar tools to canvas modes
    switch (toolId) {
      case 'select':
      case 'pan':
        // Default state - no special modes active
        if (canvasState.isAddMode) handlers.toggleAddMode();
        if (canvasState.isDeleteMode) handlers.toggleDeleteMode();
        break;
      case 'rectangle':
        // Activate add mode for rectangle drawing
        if (!canvasState.isAddMode) handlers.toggleAddMode();
        if (canvasState.isDeleteMode) handlers.toggleDeleteMode();
        break;
      case 'delete':
        // Activate delete mode
        if (!canvasState.isDeleteMode) handlers.toggleDeleteMode();
        if (canvasState.isAddMode) handlers.toggleAddMode();
        break;
      default:
        console.warn('Unknown tool selected:', toolId);
    }
  }, [canvasState.isAddMode, canvasState.isDeleteMode, handlers]);

  // Sync toolbar selection when canvas modes change externally (e.g., header buttons)
  useEffect(() => {
    if (canvasState.isAddMode) {
      setSelectedTool('rectangle');
    } else if (canvasState.isDeleteMode) {
      setSelectedTool('delete');
    } else {
      // Default to select tool when no modes are active
      if (selectedTool !== 'select' && selectedTool !== 'pan') {
        setSelectedTool('select');
      }
    }
  }, [canvasState.isAddMode, canvasState.isDeleteMode, selectedTool]);
  
  // Real-time multiplayer features
  useMultiplayer(
    currentUser, 
    canvasState.setShapes, 
    canvasState.setCursors, 
    canvasState.setOnlineUsers
  );

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden">
      {/* Header spans full width */}
      <CanvasHeader
        isAddMode={canvasState.isAddMode}
        isDeleteMode={canvasState.isDeleteMode}
        onToggleAddMode={handlers.toggleAddMode}
        onToggleDeleteMode={handlers.toggleDeleteMode}
        onDeleteAllShapes={handlers.deleteAllShapes}
        onAdd500Rectangles={handlers.add500Rectangles}
        shapesCount={canvasState.shapes.length}
        selectedColor={canvasState.selectedColor}
        onColorChange={canvasState.setSelectedColor}
        currentUser={currentUser}
        onlineUsers={canvasState.onlineUsers}
        onLogout={logout}
      />
      
      {/* Content area below header */}
      <div className="flex-1 flex flex-row overflow-hidden">
        {/* Left content area */}
        <div className="flex-1 min-w-0 flex flex-col">
          <CanvasStage 
            canvasState={canvasState}
            handlers={handlers}
            currentUser={currentUser}
          />
          
          <FloatingToolbar 
            selectedTool={selectedTool}
            onToolChange={handleToolChange}
          />
        </div>
        
        {/* Right properties panel - starts below header */}
        <PropertiesToolbar />
      </div>
    </div>
  );
};

export default Canvas;