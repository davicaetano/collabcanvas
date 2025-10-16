import React from 'react';
import { Rect } from 'react-konva';
import { 
  updateShape as updateShapeInFirestore,
  deleteShape as deleteShapeInFirestore,
  updateShapesBatch
} from '../../utils/firestore';
import { getUserColor } from '../../utils/colors';
import { CURSOR_UPDATE_THROTTLE } from '../../utils/canvas';
import SelectionBox from './SelectionBox';

const CanvasShapes = React.memo(({ 
  shapes,
  isSelectMode,
  isAddMode, 
  isDeleteMode,
  isPanMode,
  isDraggingCanvas,
  onShapeDragStart, 
  onShapeDragEnd,
  currentUser,
  stageRef,
  stageX,
  stageY,
  stageScale,
  updateCursor,
  onDeleteModeExit,
  onShapeDelete,
  selectedShapes,
  marqueePreviewShapes,
  onShapeSelect
}) => {
  const handleShapeClick = async (e, shapeId) => {
    if (isDeleteMode) {
      try {
        await deleteShapeInFirestore(shapeId);
        
        // Force immediate local update by filtering out the deleted shape
        const updatedShapes = shapes.filter(shape => shape.id !== shapeId);
        onShapeDelete(updatedShapes);
        
        // Auto-exit delete mode after deleting a shape
        onDeleteModeExit();
      } catch (error) {
        console.error('Failed to delete shape:', shapeId, error);
      }
    } else if (isSelectMode && onShapeSelect) {
      // Handle selection only in select mode
      const isMultiSelect = e.evt.shiftKey || e.evt.metaKey || e.evt.ctrlKey;
      
      if (isMultiSelect) {
        // Multi-select: toggle shape in selection
        const isAlreadySelected = selectedShapes.includes(shapeId);
        if (isAlreadySelected) {
          onShapeSelect(selectedShapes.filter(id => id !== shapeId));
        } else {
          onShapeSelect([...selectedShapes, shapeId]);
        }
      } else {
        // Single select: replace selection with this shape
        onShapeSelect([shapeId]);
      }
    }
  };

  const handleShapeDragMove = (e, shape) => {
    if (!isSelectMode) return;
    
    // Stop event propagation to prevent canvas dragging
    e.evt.stopPropagation();
    
    // Throttle both local and remote updates to match cursor speed
    const now = Date.now();
    const shouldUpdate = now - (e.target._lastShapeUpdate || 0) > CURSOR_UPDATE_THROTTLE;
    
    if (shouldUpdate) {
      // Get the current position of the dragged shape
      const newPosition = {
        x: e.target.x(),
        y: e.target.y(),
      };
      
      // Calculate the delta (how much the shape moved)
      const delta = {
        dx: newPosition.x - shape.x,
        dy: newPosition.y - shape.y,
      };
      
      // Check if multiple shapes are selected and this shape is one of them
      const isMultipleSelection = selectedShapes.length > 1 && selectedShapes.includes(shape.id);
      
      if (isMultipleSelection) {
        // Move all selected shapes together
        const updates = {};
        
        // Apply delta to all selected shapes
        selectedShapes.forEach(shapeId => {
          const selectedShape = shapes.find(s => s.id === shapeId);
          if (selectedShape) {
            updates[shapeId] = {
              x: selectedShape.x + delta.dx,
              y: selectedShape.y + delta.dy,
            };
          }
        });
        
        // Batch update all shapes in Firestore
        updateShapesBatch(updates);
        
      } else {
        // Single shape movement - use existing logic
        updateShapeInFirestore(shape.id, {
          ...shape,
          x: newPosition.x,
          y: newPosition.y,
        });
      }
      
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
      {/* Render all shapes */}
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
          draggable={isSelectMode}
          onDragStart={(e) => {
            if (!isSelectMode) {
              e.evt.preventDefault();
              return false;
            }
            // Stop event propagation to prevent canvas dragging
            e.evt.stopPropagation();
            
            // Auto-select shape if not already selected (and not in multi-select mode)
            const isMultiSelect = e.evt.shiftKey || e.evt.metaKey || e.evt.ctrlKey;
            if (!selectedShapes.includes(shape.id) && !isMultiSelect) {
              onShapeSelect([shape.id]);
            }
            
            onShapeDragStart(e);
          }}
          onDragMove={(e) => handleShapeDragMove(e, shape)}
          onDragEnd={(e) => {
            if (!isSelectMode) return;
            // Stop event propagation to prevent canvas dragging
            e.evt.stopPropagation();
            onShapeDragEnd(e, shape.id, {
              x: e.target.x(),
              y: e.target.y(),
            });
          }}
          onClick={(e) => handleShapeClick(e, shape.id)}
        />
      ))}

      {/* Render selection boxes on top of selected shapes (only in select mode) */}
      {isSelectMode && selectedShapes && selectedShapes.map((shapeId) => {
        const shape = shapes.find(s => s.id === shapeId);
        if (!shape) return null;
        return <SelectionBox key={`selection-${shapeId}`} shape={shape} />;
      })}

      {/* Render preview selection boxes during marquee drag */}
      {isSelectMode && marqueePreviewShapes && marqueePreviewShapes.map((shapeId) => {
        // Don't render preview if already selected
        if (selectedShapes && selectedShapes.includes(shapeId)) return null;
        
        const shape = shapes.find(s => s.id === shapeId);
        if (!shape) return null;
        return <SelectionBox key={`preview-${shapeId}`} shape={shape} />;
      })}
    </>
  );
});

CanvasShapes.displayName = 'CanvasShapes';

export default CanvasShapes;
