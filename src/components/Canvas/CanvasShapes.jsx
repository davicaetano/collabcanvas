import React from 'react';
import { Rect } from 'react-konva';
import { 
  updateShape as updateShapeInFirestore,
  deleteShape as deleteShapeInFirestore
} from '../../utils/firestore';
import { getUserColor } from '../../utils/colors';
import { CURSOR_UPDATE_THROTTLE } from '../../utils/canvas';

const CanvasShapes = React.memo(({ 
  shapes, 
  isAddMode, 
  isDeleteMode, 
  onShapeDragStart, 
  onShapeDragEnd,
  currentUser,
  stageRef,
  stageX,
  stageY,
  stageScale,
  updateCursor,
  onDeleteModeExit
}) => {
  const handleShapeClick = async (shapeId) => {
    if (isDeleteMode) {
      await deleteShapeInFirestore(shapeId);
      // Auto-exit delete mode after deleting a shape
      onDeleteModeExit();
    }
  };

  const handleShapeDragMove = (e, shape) => {
    if (isAddMode || isDeleteMode) return;
    
    // Stop event propagation to prevent canvas dragging
    e.evt.stopPropagation();
    
    // Throttle both local and remote updates to match cursor speed
    const now = Date.now();
    const shouldUpdate = now - (e.target._lastShapeUpdate || 0) > CURSOR_UPDATE_THROTTLE;
    
    if (shouldUpdate) {
      // Get the current position
      const newPosition = {
        x: e.target.x(),
        y: e.target.y(),
      };
      
      // Update shape position in Firestore
      updateShapeInFirestore(shape.id, {
        ...shape,
        x: newPosition.x,
        y: newPosition.y,
      });
      e.target._lastShapeUpdate = now;
      
      // Update cursor position at the same time for better sync
      if (currentUser) {
        const stage = stageRef.current;
        const pos = stage.getPointerPosition();
        if (pos) {
          const canvasPos = {
            x: (pos.x - stageX) / stageScale,
            y: (pos.y - stageY) / stageScale,
          };
          
          updateCursor(currentUser.uid, {
            x: canvasPos.x,
            y: canvasPos.y,
            name: currentUser.displayName,
            color: getUserColor(currentUser.uid),
          });
        }
      }
    } else {
      // If not time to update, reset position to last updated position to throttle local movement
      if (e.target._lastPosition) {
        e.target.x(e.target._lastPosition.x);
        e.target.y(e.target._lastPosition.y);
      }
    }
    
    // Store the last updated position
    if (shouldUpdate) {
      e.target._lastPosition = {
        x: e.target.x(),
        y: e.target.y(),
      };
    }
  };

  return (
    <>
      {shapes.map((shape) => (
        <Rect
          key={shape.id}
          x={shape.x}
          y={shape.y}
          width={shape.width}
          height={shape.height}
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          draggable={!isAddMode && !isDeleteMode}
          onDragStart={(e) => {
            if (isAddMode || isDeleteMode) {
              e.evt.preventDefault();
              return false;
            }
            // Stop event propagation to prevent canvas dragging
            e.evt.stopPropagation();
            onShapeDragStart(e);
          }}
          onDragMove={(e) => handleShapeDragMove(e, shape)}
          onDragEnd={(e) => {
            if (isAddMode || isDeleteMode) return;
            // Stop event propagation to prevent canvas dragging
            e.evt.stopPropagation();
            onShapeDragEnd(e, shape.id, {
              x: e.target.x(),
              y: e.target.y(),
            });
          }}
          onMouseEnter={(e) => {
            if (isDeleteMode) {
              e.target.getStage().container().style.cursor = 'pointer';
            }
            // Keep normal cursor when not in delete mode
          }}
          onMouseLeave={(e) => {
            if (isDeleteMode) {
              e.target.getStage().container().style.cursor = 'not-allowed';
            }
            // Keep normal cursor when not in delete mode
          }}
          onClick={() => handleShapeClick(shape.id)}
        />
      ))}
    </>
  );
});

CanvasShapes.displayName = 'CanvasShapes';

export default CanvasShapes;
