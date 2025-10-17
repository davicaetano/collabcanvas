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

/**
 * Calculate the appropriate cursor for a handle based on its base cursor and the shape's rotation
 * @param {string} baseCursor - The handle's base cursor (without rotation)
 * @param {number} rotation - The shape's rotation in degrees
 * @returns {string} The adjusted cursor name
 */
const getRotatedCursor = (baseCursor, rotation) => {
  // Normalize rotation to 0-360 range
  const normalizedRotation = ((rotation % 360) + 360) % 360;
  
  // Round to nearest 45 degrees for cursor selection
  const roundedRotation = Math.round(normalizedRotation / 45) * 45;
  
  // Map base cursors to their rotational variants
  // Each cursor type rotates through 8 positions (every 45 degrees)
  const cursorMap = {
    'nwse-resize': ['nwse-resize', 'ns-resize', 'nesw-resize', 'ew-resize', 'nwse-resize', 'ns-resize', 'nesw-resize', 'ew-resize'],
    'nesw-resize': ['nesw-resize', 'ew-resize', 'nwse-resize', 'ns-resize', 'nesw-resize', 'ew-resize', 'nwse-resize', 'ns-resize'],
    'ns-resize': ['ns-resize', 'nesw-resize', 'ew-resize', 'nwse-resize', 'ns-resize', 'nesw-resize', 'ew-resize', 'nwse-resize'],
    'ew-resize': ['ew-resize', 'nwse-resize', 'ns-resize', 'nesw-resize', 'ew-resize', 'nwse-resize', 'ns-resize', 'nesw-resize'],
  };
  
  // Get rotation index (0-7)
  const rotationIndex = (roundedRotation / 45) % 8;
  
  // Return rotated cursor
  return cursorMap[baseCursor]?.[rotationIndex] || baseCursor;
};

const SelectionBox = ({ 
  shape, 
  onResize, 
  onResizeEnd, 
  stageScale = 1, 
  stageX = 0, 
  stageY = 0,
  isSelectMode = false,
  isPanMode = false,
  isDraggingCanvas = false,
  addMode = 'none'
}) => {
  if (!shape) return null;
  
  const groupRef = useRef();
  const [isResizing, setIsResizing] = useState(false);
  const [activeHandle, setActiveHandle] = useState(null);
  const originalDimensions = useRef(null);
  const currentDimensions = useRef(null);

  const { x, y, width, height, strokeWidth = 0, rotation = 0 } = shape;
  
  // Determine the correct cursor based on current mode
  const getDefaultCursor = () => {
    if (isPanMode) {
      return isDraggingCanvas ? 'grabbing' : 'grab';
    }
    if (addMode !== 'none') {
      return 'crosshair';
    }
    if (isSelectMode) {
      return 'url(/select-cursor.svg) 3 3, auto';
    }
    return 'default';
  };
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
  // Each handle has position, base cursor, and anchor info for resize calculation
  const handles = [
    // Corners
    { 
      x: -width / 2 - halfHandle, 
      y: -height / 2 - halfHandle, 
      baseCursor: 'nwse-resize',
      anchor: 'top-left',
      xDir: -1, yDir: -1 
    },
    { 
      x: width / 2 - halfHandle, 
      y: -height / 2 - halfHandle, 
      baseCursor: 'nesw-resize',
      anchor: 'top-right',
      xDir: 1, yDir: -1 
    },
    { 
      x: -width / 2 - halfHandle, 
      y: height / 2 - halfHandle, 
      baseCursor: 'nesw-resize',
      anchor: 'bottom-left',
      xDir: -1, yDir: 1 
    },
    { 
      x: width / 2 - halfHandle, 
      y: height / 2 - halfHandle, 
      baseCursor: 'nwse-resize',
      anchor: 'bottom-right',
      xDir: 1, yDir: 1 
    },
    // Edges (middle of each side)
    { 
      x: -halfHandle, 
      y: -height / 2 - halfHandle, 
      baseCursor: 'ns-resize',
      anchor: 'top',
      xDir: 0, yDir: -1 
    },
    { 
      x: -halfHandle, 
      y: height / 2 - halfHandle, 
      baseCursor: 'ns-resize',
      anchor: 'bottom',
      xDir: 0, yDir: 1 
    },
    { 
      x: -width / 2 - halfHandle, 
      y: -halfHandle, 
      baseCursor: 'ew-resize',
      anchor: 'left',
      xDir: -1, yDir: 0 
    },
    { 
      x: width / 2 - halfHandle, 
      y: -halfHandle, 
      baseCursor: 'ew-resize',
      anchor: 'right',
      xDir: 1, yDir: 0 
    },
  ].map(handle => ({
    ...handle,
    cursor: getRotatedCursor(handle.baseCursor, rotation)
  }));
  
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
      const screenPos = stage.getPointerPosition();
      if (!screenPos || !originalDimensions.current) return;
      
      // Convert screen coordinates to canvas coordinates accounting for zoom and pan
      const pos = {
        x: (screenPos.x - stageX) / stageScale,
        y: (screenPos.y - stageY) / stageScale,
      };
      
      const { x: origX, y: origY, width: origWidth, height: origHeight, rotation: origRotation } = originalDimensions.current;
      
      // Calculate the original center position
      const origCenterX = origX + origWidth / 2;
      const origCenterY = origY + origHeight / 2;
      
      // Calculate the OPPOSITE ANCHOR POINT in local space
      // This is the point that should remain fixed during resize
      const oppositeLocalX = -handle.xDir * origWidth / 2;
      const oppositeLocalY = -handle.yDir * origHeight / 2;
      
      // Convert opposite anchor to world space
      const angleRad = (origRotation * Math.PI) / 180;
      const oppositeWorldX = origCenterX + (oppositeLocalX * Math.cos(angleRad) - oppositeLocalY * Math.sin(angleRad));
      const oppositeWorldY = origCenterY + (oppositeLocalX * Math.sin(angleRad) + oppositeLocalY * Math.cos(angleRad));
      
      // Calculate distance from mouse to opposite anchor in world space
      const worldDx = pos.x - oppositeWorldX;
      const worldDy = pos.y - oppositeWorldY;
      
      // Transform to local space (relative to shape's rotation)
      const angle = (-origRotation * Math.PI) / 180;
      const localDx = worldDx * Math.cos(angle) - worldDy * Math.sin(angle);
      const localDy = worldDx * Math.sin(angle) + worldDy * Math.cos(angle);
      
      // Calculate new dimensions
      // The new dimension is the distance from the opposite edge to the mouse
      let newWidth = origWidth;
      let newHeight = origHeight;
      
      if (handle.xDir !== 0) {
        // Width changes when dragging horizontally
        // Check if mouse is on the correct side (same sign as handle direction)
        const isCorrectSide = (localDx * handle.xDir) > 0;
        if (isCorrectSide) {
          newWidth = Math.max(10, Math.abs(localDx));
        } else {
          // Mouse crossed to the opposite side - clamp to minimum
          newWidth = 10;
        }
      }
      
      if (handle.yDir !== 0) {
        // Height changes when dragging vertically
        // Check if mouse is on the correct side (same sign as handle direction)
        const isCorrectSide = (localDy * handle.yDir) > 0;
        if (isCorrectSide) {
          newHeight = Math.max(10, Math.abs(localDy));
        } else {
          // Mouse crossed to the opposite side - clamp to minimum
          newHeight = 10;
        }
      }
      
      // Calculate the new center position in LOCAL space
      // The center should be at the midpoint from the opposite anchor
      // When xDir = 0 (vertical edge), center X stays at 0 (middle)
      // When yDir = 0 (horizontal edge), center Y stays at 0 (middle)
      let newCenterLocalX = 0;
      let newCenterLocalY = 0;
      
      if (handle.xDir !== 0) {
        // Horizontal resize: center moves horizontally
        newCenterLocalX = oppositeLocalX + (handle.xDir * newWidth / 2);
      }
      
      if (handle.yDir !== 0) {
        // Vertical resize: center moves vertically
        newCenterLocalY = oppositeLocalY + (handle.yDir * newHeight / 2);
      }
      
      // Convert new center from LOCAL to WORLD space (relative to original center)
      const newCenterWorldX = origCenterX + (newCenterLocalX * Math.cos(angleRad) - newCenterLocalY * Math.sin(angleRad));
      const newCenterWorldY = origCenterY + (newCenterLocalX * Math.sin(angleRad) + newCenterLocalY * Math.cos(angleRad));
      
      // Calculate new top-left position from center
      const newX = newCenterWorldX - newWidth / 2;
      const newY = newCenterWorldY - newHeight / 2;
      
      const newDimensions = {
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      };
      
      // Store current dimensions for final update
      currentDimensions.current = newDimensions;
      
      onResize(newDimensions);
    };
    
    const handleMouseUp = () => {
      // Call onResizeEnd with final dimensions if available
      if (onResizeEnd && currentDimensions.current) {
        onResizeEnd(currentDimensions.current);
      }
      
      setIsResizing(false);
      setActiveHandle(null);
      originalDimensions.current = null;
      currentDimensions.current = null;
      
      // Reset cursor to mode-appropriate cursor
      container.style.cursor = getDefaultCursor();
      
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
              container.style.cursor = getDefaultCursor();
            }
          }}
        />
      ))}
    </Group>
  );
};

export default SelectionBox;

