import React from 'react';
import { Stage, Layer } from 'react-konva';
import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '../../utils/canvas';
import CanvasGrid from './CanvasGrid';
import CanvasPreview from './CanvasPreview';
import CanvasShapes from './CanvasShapes';
import CanvasCursors from './CanvasCursors';
import { updateCursor } from '../../utils/firestore';

const CanvasStage = React.memo(({ 
  canvasState, 
  handlers, 
  currentUser 
}) => {
  const {
    stageRef,
    stageScale,
    stageX,
    stageY,
    shapes,
    isAddMode,
    isDeleteMode,
    isDraggingShape,
    previewRect,
    cursors,
    setIsDeleteMode,
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
    handleCanvasClick,
  } = handlers;

  return (
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
          {/* Grid background */}
          <CanvasGrid />
          
          {/* Preview rectangle while drawing */}
          <CanvasPreview isAddMode={isAddMode} previewRect={previewRect} />
          
          {/* Shapes */}
          <CanvasShapes
            shapes={shapes}
            isAddMode={isAddMode}
            isDeleteMode={isDeleteMode}
            onShapeDragStart={handleShapeDragStart}
            onShapeDragEnd={handleShapeDragEnd}
            currentUser={currentUser}
            stageRef={stageRef}
            stageX={stageX}
            stageY={stageY}
            stageScale={stageScale}
            updateCursor={updateCursor}
            onDeleteModeExit={() => setIsDeleteMode(false)}
          />
          
          {/* Cursors */}
          <CanvasCursors cursors={cursors} currentUser={currentUser} />
        </Layer>
      </Stage>
    </div>
  );
});

CanvasStage.displayName = 'CanvasStage';

export default CanvasStage;
