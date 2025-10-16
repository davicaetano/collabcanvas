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
      setViewportDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  return (
    <div 
      className="flex-1 overflow-hidden"
      style={{
        backgroundColor: canvasBackgroundColor || '#ffffff',
        ...(isDevMode && { border: '5px solid blue' }), // DEV MODE: Blue border for canvas area
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
          {/* Grid background */}
          <CanvasGrid />
          
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
          />
          
          {/* Cursors */}
          <CanvasCursors cursors={cursorManager.cursors} currentUser={currentUser} />
        </Layer>
      </Stage>
    </div>
  );
});

CanvasStage.displayName = 'CanvasStage';

export default CanvasStage;
