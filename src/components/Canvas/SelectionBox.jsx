import React, { useRef, useState } from 'react';
import { Group, Rect } from 'react-konva';
import {
  SELECTION_STROKE_WIDTH,
  SELECTION_STROKE_COLOR,
  SELECTION_HANDLE_SIZE,
  SELECTION_HANDLE_FILL,
  SELECTION_HANDLE_STROKE,
  SELECTION_HANDLE_STROKE_WIDTH
} from '../../utils/canvas';

const SelectionBox = ({ shape, onResize }) => {
  if (!shape) return null;
  
  const groupRef = useRef();
  const [isResizing, setIsResizing] = useState(false);
  const [activeHandle, setActiveHandle] = useState(null);
  const originalDimensions = useRef(null);

  const { x, y, width, height, strokeWidth = 0, rotation = 0 } = shape;
  const halfHandle = SELECTION_HANDLE_SIZE / 2;
  
  // Add offset to account for shape's stroke so selection box doesn't cover it
  // Selection box should be outside the shape's stroke
  const offset = Math.max(strokeWidth / 2, 3); // At least 3px offset for visibility
  
  // Calculate center position (same as shape rendering)
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  
  // Adjusted dimensions to show selection outside the stroke
  const selectionWidth = width + (offset * 2);
  const selectionHeight = height + (offset * 2);

  // Handle positions relative to center (will be rotated with the group)
  // Each handle has position, cursor, and anchor info for resize calculation
  const handles = [
    // Corners
    { 
      x: -width / 2 - halfHandle, 
      y: -height / 2 - halfHandle, 
      cursor: 'nwse-resize',
      anchor: 'top-left',
      xDir: -1, yDir: -1 
    },
    { 
      x: width / 2 - halfHandle, 
      y: -height / 2 - halfHandle, 
      cursor: 'nesw-resize',
      anchor: 'top-right',
      xDir: 1, yDir: -1 
    },
    { 
      x: -width / 2 - halfHandle, 
      y: height / 2 - halfHandle, 
      cursor: 'nesw-resize',
      anchor: 'bottom-left',
      xDir: -1, yDir: 1 
    },
    { 
      x: width / 2 - halfHandle, 
      y: height / 2 - halfHandle, 
      cursor: 'nwse-resize',
      anchor: 'bottom-right',
      xDir: 1, yDir: 1 
    },
    // Edges (middle of each side)
    { 
      x: -halfHandle, 
      y: -height / 2 - halfHandle, 
      cursor: 'ns-resize',
      anchor: 'top',
      xDir: 0, yDir: -1 
    },
    { 
      x: -halfHandle, 
      y: height / 2 - halfHandle, 
      cursor: 'ns-resize',
      anchor: 'bottom',
      xDir: 0, yDir: 1 
    },
    { 
      x: -width / 2 - halfHandle, 
      y: -halfHandle, 
      cursor: 'ew-resize',
      anchor: 'left',
      xDir: -1, yDir: 0 
    },
    { 
      x: width / 2 - halfHandle, 
      y: -halfHandle, 
      cursor: 'ew-resize',
      anchor: 'right',
      xDir: 1, yDir: 0 
    },
  ];
  
  const handleMouseDown = (handle) => {
    if (!onResize) return;
    
    setIsResizing(true);
    setActiveHandle(handle.anchor);
    // Save original dimensions at start of resize
    originalDimensions.current = { x, y, width, height, rotation };
    
    const stage = groupRef.current?.getStage();
    if (!stage) return;
    
    const container = stage.container();
    
    // Set cursor for the entire resize operation
    container.style.cursor = handle.cursor;
    
    const handleMouseMove = (e) => {
      const pos = stage.getPointerPosition();
      if (!pos || !originalDimensions.current) return;
      
      const { x: origX, y: origY, width: origWidth, height: origHeight, rotation: origRotation } = originalDimensions.current;
      
      // Calculate the original center position
      const origCenterX = origX + origWidth / 2;
      const origCenterY = origY + origHeight / 2;
      
      // Calculate distance from original center to mouse
      const dx = pos.x - origCenterX;
      const dy = pos.y - origCenterY;
      
      // Rotate back to shape's local space (accounting for rotation)
      const angle = (-origRotation * Math.PI) / 180;
      const localDx = dx * Math.cos(angle) - dy * Math.sin(angle);
      const localDy = dx * Math.sin(angle) + dy * Math.cos(angle);
      
      // Calculate new dimensions based on which edge is being dragged
      let newWidth = origWidth;
      let newHeight = origHeight;
      let deltaX = 0;
      let deltaY = 0;
      
      if (handle.xDir !== 0) {
        if (handle.xDir < 0) {
          // Dragging left edge - right edge stays fixed
          newWidth = Math.max(10, origWidth / 2 - localDx);
          deltaX = origWidth - newWidth;
        } else {
          // Dragging right edge - left edge stays fixed
          newWidth = Math.max(10, localDx + origWidth / 2);
          deltaX = 0;
        }
      }
      
      if (handle.yDir !== 0) {
        if (handle.yDir < 0) {
          // Dragging top edge - bottom edge stays fixed
          newHeight = Math.max(10, origHeight / 2 - localDy);
          deltaY = origHeight - newHeight;
        } else {
          // Dragging bottom edge - top edge stays fixed
          newHeight = Math.max(10, localDy + origHeight / 2);
          deltaY = 0;
        }
      }
      
      // Apply position adjustment (rotate delta back to world space)
      const angleRad = (origRotation * Math.PI) / 180;
      const adjustedDx = deltaX * Math.cos(angleRad) - deltaY * Math.sin(angleRad);
      const adjustedDy = deltaX * Math.sin(angleRad) + deltaY * Math.cos(angleRad);
      
      onResize({
        x: origX + adjustedDx,
        y: origY + adjustedDy,
        width: newWidth,
        height: newHeight,
      });
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      setActiveHandle(null);
      originalDimensions.current = null;
      
      // Reset cursor to default
      container.style.cursor = 'default';
      
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <Group
      ref={groupRef}
      x={centerX}
      y={centerY}
      rotation={rotation}
    >
      {/* Selection border - offset to not cover shape's stroke */}
      <Rect
        x={-selectionWidth / 2}
        y={-selectionHeight / 2}
        width={selectionWidth}
        height={selectionHeight}
        stroke={SELECTION_STROKE_COLOR}
        strokeWidth={SELECTION_STROKE_WIDTH}
        fill="transparent"
        listening={false} // Don't capture events
      />

      {/* Selection handles */}
      {handles.map((handle, index) => (
        <Rect
          key={`handle-${index}`}
          name={`handle-${index}`}
          x={handle.x}
          y={handle.y}
          width={SELECTION_HANDLE_SIZE}
          height={SELECTION_HANDLE_SIZE}
          fill={SELECTION_HANDLE_FILL}
          stroke={SELECTION_HANDLE_STROKE}
          strokeWidth={SELECTION_HANDLE_STROKE_WIDTH}
          onMouseDown={() => handleMouseDown(handle)}
          onMouseEnter={(e) => {
            if (!isResizing) {
              const container = e.target.getStage().container();
              container.style.cursor = handle.cursor;
            }
          }}
          onMouseLeave={(e) => {
            if (!isResizing) {
              const container = e.target.getStage().container();
              container.style.cursor = 'default';
            }
          }}
        />
      ))}
    </Group>
  );
};

export default SelectionBox;

