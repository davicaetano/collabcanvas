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
  
  // Generate unique session ID for this browser tab/window
  // This persists for the lifetime of the component (page session)
  const [sessionId] = useState(() => crypto.randomUUID());
  
  // Custom hooks for state management
  const canvasState = useCanvasState();
  const handlers = useCanvasHandlers(canvasState, currentUser, sessionId);
  
  // Floating toolbar state - lifted up to sync with canvas modes
  const [selectedTool, setSelectedTool] = useState('select');
  
  // ============== DEBUG: Track renders (ORIGINAL CODE - NO REFACTORING) ==============
  const renderCount = React.useRef(0);
  renderCount.current++;
  const isDevMode = import.meta.env.VITE_DEV_MODE === 'true';
  
  const prevValues = React.useRef({
    shapesLength: 0,
    selectedShapesLength: 0,
    selectedTool: '',
    isSelectMode: false,
    addMode: '',
    isDraggingShape: false,
    cursorsCount: 0,
    onlineUsersCount: 0,
    cursorsRef: null,
    onlineUsersRef: null,
    canvasStateRef: null,
    handlersRef: null,
  });
  
  if (isDevMode) {
    const changes = [];
    
    if (prevValues.current.shapesLength !== canvasState.shapes.length) {
      changes.push(`shapes: ${prevValues.current.shapesLength} → ${canvasState.shapes.length}`);
    }
    if (prevValues.current.selectedShapesLength !== canvasState.selectedShapes.length) {
      changes.push(`selectedShapes: ${prevValues.current.selectedShapesLength} → ${canvasState.selectedShapes.length}`);
    }
    if (prevValues.current.selectedTool !== selectedTool) {
      changes.push(`selectedTool: ${prevValues.current.selectedTool} → ${selectedTool}`);
    }
    if (prevValues.current.isSelectMode !== canvasState.isSelectMode) {
      changes.push(`isSelectMode: ${prevValues.current.isSelectMode} → ${canvasState.isSelectMode}`);
    }
    if (prevValues.current.addMode !== canvasState.addMode) {
      changes.push(`addMode: ${prevValues.current.addMode} → ${canvasState.addMode}`);
    }
    if (prevValues.current.isDraggingShape !== canvasState.isDraggingShape) {
      changes.push(`isDraggingShape: ${prevValues.current.isDraggingShape} → ${canvasState.isDraggingShape}`);
    }
    
    const cursorsCount = Object.keys(canvasState.cursors || {}).length;
    const onlineUsersCount = Object.keys(canvasState.onlineUsers || {}).length;
    
    if (prevValues.current.cursorsCount !== cursorsCount) {
      changes.push(`cursors COUNT: ${prevValues.current.cursorsCount} → ${cursorsCount}`);
    }
    if (prevValues.current.onlineUsersCount !== onlineUsersCount) {
      changes.push(`onlineUsers COUNT: ${prevValues.current.onlineUsersCount} → ${onlineUsersCount}`);
    }
    
    // Check if cursors object reference changed (even if count is same)
    if (prevValues.current.cursorsRef !== canvasState.cursors) {
      changes.push(`cursors OBJECT ref changed (${cursorsCount} cursors)`);
    }
    if (prevValues.current.onlineUsersRef !== canvasState.onlineUsers) {
      changes.push(`onlineUsers OBJECT ref changed (${onlineUsersCount} users)`);
    }
    
    // Check if object references changed
    if (prevValues.current.canvasStateRef !== canvasState) {
      changes.push('canvasState OBJECT CHANGED');
    }
    if (prevValues.current.handlersRef !== handlers) {
      changes.push('handlers OBJECT CHANGED');
    }
    
    console.log('🚀 [WITH DEEP COMPARE] Render #' + renderCount.current, changes.length > 0 ? changes : 'no tracked changes');
    
    prevValues.current = {
      shapesLength: canvasState.shapes.length,
      selectedShapesLength: canvasState.selectedShapes.length,
      selectedTool: selectedTool,
      isSelectMode: canvasState.isSelectMode,
      addMode: canvasState.addMode,
      isDraggingShape: canvasState.isDraggingShape,
      cursorsCount: cursorsCount,
      onlineUsersCount: onlineUsersCount,
      cursorsRef: canvasState.cursors,
      onlineUsersRef: canvasState.onlineUsers,
      canvasStateRef: canvasState,
      handlersRef: handlers,
    };
  }
  // ============== END DEBUG ==============
  
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
        if (canvasState.selectedShapes.length > 0) {
          canvasState.setSelectedShapes([]);
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
    canvasState.setSelectedShapes(shapeIds);
  }, [canvasState]);

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
    canvasState.setShapes, 
    canvasState.setCursors, 
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
        shapesCount={canvasState.shapes.length}
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
          onShapesChange={canvasState.setShapes}
        />
      </div>
    </div>
  );
};

export default Canvas;