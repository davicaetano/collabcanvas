import React, { useState, useRef } from 'react';
import { Rect } from 'react-konva';
import { CURSOR_UPDATE_THROTTLE } from '../../utils/canvas';
import SelectionBox from './SelectionBox';

const CanvasShapes = React.memo(({ 
  shapes,
  isSelectMode,
  addMode, 
  isPanMode,
  isDraggingCanvas,
  onShapeDragStart, 
  onShapeDragEnd,
  currentUser,
  stageRef,
  stageX,
  stageY,
  stageScale,
  selectedShapes,
  marqueePreviewShapes,
  onShapeSelect,
  sessionId,
  shapeManager,
  cursorManager
}) => {
  // Track local positions during drag for smooth SelectionBox movement
  const [localPositions, setLocalPositions] = useState({});

  const handleShapeClick = async (e, shapeId) => {
    if (isSelectMode && onShapeSelect) {
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

  // Local state for shapes being resized (to avoid excessive Firebase writes)
  const [resizingShapes, setResizingShapes] = useState({});
  const resizeThrottleRef = useRef({});
  
  const handleShapeResize = (shapeId, newDimensions) => {
    if (!shapeManager) return;
    
    // Update local resizing state immediately for smooth UI
    setResizingShapes(prev => ({
      ...prev,
      [shapeId]: newDimensions
    }));
    
    // Throttle Firebase updates to once every 100ms
    const now = Date.now();
    const lastUpdate = resizeThrottleRef.current[shapeId]?.lastUpdate || 0;
    const timeSinceLastUpdate = now - lastUpdate;
    
    if (timeSinceLastUpdate >= 100) {
      // Send to Firebase immediately (throttled)
      shapeManager.updateShape(shapeId, newDimensions);
      resizeThrottleRef.current[shapeId] = { lastUpdate: now, pendingUpdate: null };
    } else {
      // Schedule pending update
      if (resizeThrottleRef.current[shapeId]?.pendingUpdate) {
        clearTimeout(resizeThrottleRef.current[shapeId].pendingUpdate);
      }
      
      resizeThrottleRef.current[shapeId] = {
        ...resizeThrottleRef.current[shapeId],
        pendingUpdate: setTimeout(() => {
          shapeManager.updateShape(shapeId, newDimensions);
          resizeThrottleRef.current[shapeId] = { 
            lastUpdate: Date.now(), 
            pendingUpdate: null 
          };
          
          // Clear from resizing state after final update
          setResizingShapes(prev => {
            const newState = { ...prev };
            delete newState[shapeId];
            return newState;
          });
        }, 100 - timeSinceLastUpdate)
      };
    }
  };

  const handleShapeDragMove = (e, shape) => {
    if (!isSelectMode) return;
    
    // Stop event propagation to prevent canvas dragging
    e.evt.stopPropagation();
    
    // Get the current local position from Konva (center position)
    // Convert back to top-left corner for consistency with Firebase
    const newPosition = {
      x: e.target.x() - shape.width / 2,
      y: e.target.y() - shape.height / 2,
    };
    
    // Calculate the delta (how much the shape moved)
    const delta = {
      dx: newPosition.x - shape.x,
      dy: newPosition.y - shape.y,
    };
    
    // Check if multiple shapes are selected and this shape is one of them
    const isMultipleSelection = selectedShapes.length > 1 && selectedShapes.includes(shape.id);
    
    // Update local positions for smooth SelectionBox (60fps)
    if (isMultipleSelection) {
      // Update local positions for all selected shapes
      const newLocalPositions = {};
      selectedShapes.forEach(shapeId => {
        const selectedShape = shapes.find(s => s.id === shapeId);
        if (selectedShape) {
          newLocalPositions[shapeId] = {
            x: selectedShape.x + delta.dx,
            y: selectedShape.y + delta.dy,
          };
        }
      });
      setLocalPositions(newLocalPositions);
    } else {
      // Single shape - update only this shape's local position
      setLocalPositions({ [shape.id]: newPosition });
    }
    
    // Throttle Firebase updates only (not local visual movement)
    const now = Date.now();
    const shouldUpdate = now - (e.target._lastShapeUpdate || 0) > CURSOR_UPDATE_THROTTLE;
    
    if (shouldUpdate) {
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
        
        // Batch update all shapes through shapeManager
        shapeManager.updateShapeBatch(updates).catch(() => {
          // Ignore errors during drag - Firestore might be temporarily busy
        });
        
      } else {
        // Single shape movement - use shape manager
        shapeManager.updateShape(shape.id, {
          x: newPosition.x,
          y: newPosition.y,
        }).catch(() => {
          // Ignore errors during drag - Firestore might be temporarily busy
        });
      }
      
      e.target._lastShapeUpdate = now;
      
      // Update cursor position at the same time for better sync
      cursorManager.trackCursorFromStage({
        stageRef,
        stageX,
        stageY,
        stageScale
      });
    }
  };

  return (
    <>
      {/* Render all shapes */}
      {shapes.map((shape) => {
        // Use local position if available (during drag), otherwise use Firebase position
        const displayX = localPositions[shape.id]?.x ?? shape.x;
        const displayY = localPositions[shape.id]?.y ?? shape.y;
        
        // Use resizing dimensions if available (during resize), otherwise use shape dimensions
        const resizeDims = resizingShapes[shape.id];
        const displayWidth = resizeDims?.width ?? shape.width;
        const displayHeight = resizeDims?.height ?? shape.height;
        const displayShapeX = resizeDims?.x ?? displayX;
        const displayShapeY = resizeDims?.y ?? displayY;
        
        // Adjust position to center for rotation pivot
        const centerX = displayShapeX + displayWidth / 2;
        const centerY = displayShapeY + displayHeight / 2;
        
        return (
          <Rect
            key={shape.id}
            x={centerX}
            y={centerY}
            width={displayWidth}
            height={displayHeight}
            fill={shape.fill}
            stroke={shape.stroke}
            strokeWidth={shape.strokeWidth}
            rotation={shape.rotation || 0}
            offsetX={displayWidth / 2}
            offsetY={displayHeight / 2}
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
            
            // Get final position from Konva (center position)
            // Convert back to top-left corner for Firebase storage
            const finalPosition = {
              x: e.target.x() - shape.width / 2,
              y: e.target.y() - shape.height / 2,
            };
            
            // Calculate delta for multi-shape movement
            const delta = {
              dx: finalPosition.x - shape.x,
              dy: finalPosition.y - shape.y,
            };
            
            const isMultipleSelection = selectedShapes.length > 1 && selectedShapes.includes(shape.id);
            
            // Immediate final update to Firebase (no throttle)
            if (isMultipleSelection) {
              const updates = {};
              selectedShapes.forEach(shapeId => {
                const selectedShape = shapes.find(s => s.id === shapeId);
                if (selectedShape) {
                  updates[shapeId] = {
                    x: selectedShape.x + delta.dx,
                    y: selectedShape.y + delta.dy,
                  };
                }
              });
              shapeManager.updateShapeBatch(updates);
            } else {
              shapeManager.updateShape(shape.id, finalPosition);
            }
            
            // Clear local positions after a small delay to allow Firebase sync
            setTimeout(() => {
              setLocalPositions({});
            }, 100);
            
            onShapeDragEnd(e, shape.id, finalPosition);
          }}
          onClick={(e) => handleShapeClick(e, shape.id)}
          />
        );
      })}

      {/* Render selection boxes on top of selected shapes (only in select mode) */}
      {isSelectMode && selectedShapes && selectedShapes.map((shapeId) => {
        const shape = shapes.find(s => s.id === shapeId);
        if (!shape) return null;
        
        // Use local position if available (during drag), otherwise use Firebase position
        // Also use resizing dimensions if available (during resize)
        const displayShape = {
          ...shape,
          ...(localPositions[shapeId] || {}),
          ...(resizingShapes[shapeId] || {})
        };
        
        return (
          <SelectionBox 
            key={`selection-${shapeId}`} 
            shape={displayShape} 
            onResize={(newDimensions) => handleShapeResize(shapeId, newDimensions)}
          />
        );
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
