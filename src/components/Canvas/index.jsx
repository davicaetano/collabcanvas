import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import CanvasHeader from './CanvasHeader';
import CanvasStage from './CanvasStage';
import FloatingToolbar from './FloatingToolbar';
import PropertiesToolbar from './PropertiesToolbar';
import { useCanvasState } from './hooks/useCanvasState';
import { useCanvasHandlers } from './hooks/useCanvasHandlers';
import { useMultiplayer } from './hooks/useMultiplayer';
import { useShapeManager } from './hooks/useShapeManager';
import { useCursorManager } from './hooks/useCursorManager';

const Canvas = () => {
  const { currentUser, logout } = useAuth();
  
  // Generate unique session ID for this browser tab/window
  // This persists for the lifetime of the component (page session)
  const [sessionId] = useState(() => crypto.randomUUID());
  
  // Shape manager - centralized shape state and operations
  const shapeManager = useShapeManager(currentUser, sessionId);
  
  // Cursor manager - centralized cursor and presence operations
  const cursorManager = useCursorManager(currentUser, sessionId);
  
  // Custom hooks for state management
  const canvasState = useCanvasState();
  const handlers = useCanvasHandlers(canvasState, currentUser, sessionId, shapeManager, cursorManager);
  
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
        canvasState.setAddMode('none');
        if (canvasState.isDeleteMode) handlers.toggleDeleteMode();
        break;
        
      case 'pan':
        // Activate pan mode, deactivate all others
        canvasState.setIsSelectMode(false);
        canvasState.setIsPanMode(true);
        canvasState.setAddMode('none');
        if (canvasState.isDeleteMode) handlers.toggleDeleteMode();
        // Deselect all shapes when entering pan mode
        if (shapeManager.selectedShapeIds.length > 0) {
          shapeManager.clearSelection();
        }
        break;
        
      case 'rectangle':
        // Activate add mode with rectangle, deactivate all others
        canvasState.setIsSelectMode(false);
        canvasState.setIsPanMode(false);
        canvasState.setAddMode('rectangle');
        if (canvasState.isDeleteMode) handlers.toggleDeleteMode();
        break;
        
      case 'circle':
        // Activate add mode with circle, deactivate all others
        canvasState.setIsSelectMode(false);
        canvasState.setIsPanMode(false);
        canvasState.setAddMode('circle');
        if (canvasState.isDeleteMode) handlers.toggleDeleteMode();
        break;
        
      case 'text':
        // Activate add mode with text, deactivate all others
        canvasState.setIsSelectMode(false);
        canvasState.setIsPanMode(false);
        canvasState.setAddMode('text');
        if (canvasState.isDeleteMode) handlers.toggleDeleteMode();
        break;
        
      case 'delete':
        // Activate delete mode, deactivate all others
        canvasState.setIsSelectMode(false);
        canvasState.setIsPanMode(false);
        canvasState.setAddMode('none');
        if (!canvasState.isDeleteMode) handlers.toggleDeleteMode();
        break;
        
      default:
        console.warn('Unknown tool selected:', toolId);
    }
  }, [canvasState, handlers]);

  // Shape selection handler
  const handleShapeSelect = useCallback((shapeIds) => {
    shapeManager.selectShapes(shapeIds);
  }, [shapeManager]);

  // Sync toolbar selection when canvas modes change externally (e.g., ESC key)
  useEffect(() => {
    // Check modes in priority order and update toolbar selection
    if (canvasState.addMode === 'rectangle') {
      setSelectedTool('rectangle');
    } else if (canvasState.addMode === 'circle') {
      setSelectedTool('circle');
    } else if (canvasState.addMode === 'text') {
      setSelectedTool('text');
    } else if (canvasState.isDeleteMode) {
      setSelectedTool('delete');
    } else if (canvasState.isPanMode) {
      setSelectedTool('pan');
    } else {
      // Default to select mode when no other mode is active
      setSelectedTool('select');
    }
  }, [canvasState.isSelectMode, canvasState.addMode, canvasState.isDeleteMode, canvasState.isPanMode]);
  
  // Real-time multiplayer features
  useMultiplayer(
    currentUser, 
    shapeManager, 
    canvasState.setOnlineUsers,
    sessionId,
    canvasState.isDraggingShape
  );

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden">
      {/* Header spans full width */}
      <CanvasHeader
        onDeleteAllShapes={handlers.deleteAllShapes}
        onAdd500Rectangles={handlers.add500Rectangles}
        shapesCount={shapeManager.shapes.length}
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
            shapeManager={shapeManager}
            cursorManager={cursorManager}
          />
          
          <FloatingToolbar 
            selectedTool={selectedTool}
            onToolChange={handleToolChange}
          />
        </div>
        
        {/* Right properties panel - starts below header */}
        <PropertiesToolbar 
          selectedShapes={shapeManager.selectedShapeIds}
          shapes={shapeManager.shapes}
          shapeManager={shapeManager}
        />
      </div>
    </div>
  );
};

export default Canvas;