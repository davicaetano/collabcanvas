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
  // Ensures only ONE mode is active at a time
  const handleToolChange = useCallback((toolId) => {
    setSelectedTool(toolId);
    
    // Map toolbar tools to canvas modes (mutual exclusivity)
    switch (toolId) {
      case 'select':
        // Activate select mode, deactivate all others
        canvasState.setIsSelectMode(true);
        canvasState.setIsPanMode(false);
        if (canvasState.isAddMode) handlers.toggleAddMode();
        if (canvasState.isDeleteMode) handlers.toggleDeleteMode();
        break;
        
      case 'pan':
        // Activate pan mode, deactivate all others
        canvasState.setIsSelectMode(false);
        canvasState.setIsPanMode(true);
        if (canvasState.isAddMode) handlers.toggleAddMode();
        if (canvasState.isDeleteMode) handlers.toggleDeleteMode();
        // Deselect all shapes when entering pan mode
        if (canvasState.selectedShapes.length > 0) {
          canvasState.setSelectedShapes([]);
        }
        break;
        
      case 'rectangle':
        // Activate add mode, deactivate all others
        canvasState.setIsSelectMode(false);
        canvasState.setIsPanMode(false);
        if (!canvasState.isAddMode) handlers.toggleAddMode();
        if (canvasState.isDeleteMode) handlers.toggleDeleteMode();
        break;
        
      case 'delete':
        // Activate delete mode, deactivate all others
        canvasState.setIsSelectMode(false);
        canvasState.setIsPanMode(false);
        if (!canvasState.isDeleteMode) handlers.toggleDeleteMode();
        if (canvasState.isAddMode) handlers.toggleAddMode();
        break;
        
      default:
        console.warn('Unknown tool selected:', toolId);
    }
  }, [canvasState, handlers]);

  // Shape selection handler
  const handleShapeSelect = useCallback((shapeIds) => {
    canvasState.setSelectedShapes(shapeIds);
  }, [canvasState]);

  // Sync toolbar selection when canvas modes change externally (e.g., header buttons)
  useEffect(() => {
    if (canvasState.isAddMode) {
      setSelectedTool('rectangle');
    } else if (canvasState.isDeleteMode) {
      setSelectedTool('delete');
    } else if (canvasState.isPanMode) {
      setSelectedTool('pan');
    } else if (canvasState.isSelectMode) {
      setSelectedTool('select');
    }
  }, [canvasState.isSelectMode, canvasState.isAddMode, canvasState.isDeleteMode, canvasState.isPanMode]);
  
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
            onShapeSelect={handleShapeSelect}
          />
          
          <FloatingToolbar 
            selectedTool={selectedTool}
            onToolChange={handleToolChange}
          />
        </div>
        
        {/* Right properties panel - starts below header */}
        <PropertiesToolbar 
          selectedShapes={canvasState.selectedShapes}
          shapes={canvasState.shapes}
        />
      </div>
    </div>
  );
};

export default Canvas;