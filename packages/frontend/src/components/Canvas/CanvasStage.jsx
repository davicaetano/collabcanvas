import React, { useState, useEffect } from 'react';
import { Stage, Layer } from 'react-konva';
import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '../../utils/canvas';
import CanvasGrid from './CanvasGrid';
import CanvasPreview from './CanvasPreview';
import { MarqueeBox } from './MarqueeBox';
import CanvasShapes from './CanvasShapes';
import CanvasCursors from './CanvasCursors';

const CanvasStage = React.memo(({ 
  canvasState, 
  handlers, 
  currentUser,
  onlineUsers,
  onShapeSelect,
  shapeManager,
  cursorManager
}) => {
  const {
    stageRef,
    canvasBackgroundColor,
    stageScale,
    stageX,
    stageY,
    isSelectMode,
    addMode,
    isPanMode,
    isDraggingShape,
    isDraggingCanvas,
    previewRect,
    selectedColor,
    isMarqueeSelecting,
    marqueeStart,
    marqueeEnd,
    marqueePreviewShapes,
    setIsSelectMode,
    setAddMode,
    newlyCreatedTextId,
    setNewlyCreatedTextId,
  } = canvasState;

  const {
    handleWheel,
    handleStageDragStart,
    handleDragEnd,
    handleShapeDragStart,
    handleShapeDragEnd,
    handleMouseMove,
    handleCanvasMouseDown,
    handleCanvasMouseUp,
    sessionId,
    handleCanvasClick,
  } = handlers;

  const isDevMode = import.meta.env.VITE_DEV_MODE === 'true';

  // Dynamic viewport dimensions that update on window resize
  const [viewportDimensions, setViewportDimensions] = useState({
    width: VIEWPORT_WIDTH,
    height: VIEWPORT_HEIGHT
  });

  // Update viewport dimensions on window resize
  useEffect(() => {
    const handleResize = () => {
      // AIPanel is position:fixed (doesn't affect layout), so we only subtract PropertiesToolbar
      const PROPERTIES_TOOLBAR_WIDTH = 320; // PropertiesToolbar width
      const HEADER_HEIGHT = 64; // Header height
      
      setViewportDimensions({
        width: window.innerWidth - PROPERTIES_TOOLBAR_WIDTH,
        height: window.innerHeight - HEADER_HEIGHT
      });
    };

    // Set initial dimensions
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  return (
    <div 
      className="flex-1 overflow-hidden"
      style={{
        backgroundColor: canvasBackgroundColor || '#ffffff',
      }}
    >
      <Stage
        ref={stageRef}
        width={viewportDimensions.width}
        height={viewportDimensions.height}
        draggable={isPanMode && !isDraggingShape}
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
          cursor: isPanMode 
            ? (isDraggingCanvas ? 'grabbing' : 'grab')
            : addMode !== 'none'
            ? 'crosshair'
            : isSelectMode
            ? 'url(/select-cursor.svg) 3 3, auto'
            : 'default'
        }}
      >
        <Layer>
          {/* Grid background - infinite grid */}
          <CanvasGrid 
            stageX={stageX}
            stageY={stageY}
            stageScale={stageScale}
            viewportWidth={viewportDimensions.width}
            viewportHeight={viewportDimensions.height}
          />
          
          {/* Preview shape while drawing */}
          <CanvasPreview addMode={addMode} previewRect={previewRect} selectedColor={selectedColor} />
          
          {/* Marquee selection box */}
          {isMarqueeSelecting && (
            <MarqueeBox marqueeStart={marqueeStart} marqueeEnd={marqueeEnd} />
          )}
          
          {/* Shapes */}
          <CanvasShapes
            shapes={shapeManager.shapes}
            isSelectMode={isSelectMode}
            addMode={addMode}
            isPanMode={isPanMode}
            isDraggingCanvas={isDraggingCanvas}
            onShapeDragStart={handleShapeDragStart}
            onShapeDragEnd={handleShapeDragEnd}
            currentUser={currentUser}
            stageRef={stageRef}
            stageX={stageX}
            stageY={stageY}
            stageScale={stageScale}
            sessionId={sessionId}
            shapeManager={shapeManager}
            cursorManager={cursorManager}
            selectedShapes={shapeManager.selectedShapeIds}
            marqueePreviewShapes={marqueePreviewShapes}
            onShapeSelect={onShapeSelect}
            newlyCreatedTextId={newlyCreatedTextId}
            setNewlyCreatedTextId={setNewlyCreatedTextId}
          />
          
          {/* Cursors */}
          <CanvasCursors 
            cursors={cursorManager.cursors} 
            onlineUsers={onlineUsers}
            currentUser={currentUser} 
            stageScale={stageScale} 
          />
        </Layer>
      </Stage>
    </div>
  );
});

CanvasStage.displayName = 'CanvasStage';

export default CanvasStage;
