import React from 'react';
import { Group, Rect } from 'react-konva';
import {
  SELECTION_STROKE_WIDTH,
  SELECTION_STROKE_COLOR,
  SELECTION_HANDLE_SIZE,
  SELECTION_HANDLE_FILL,
  SELECTION_HANDLE_STROKE,
  SELECTION_HANDLE_STROKE_WIDTH
} from '../../utils/canvas';

const SelectionBox = ({ shape }) => {
  if (!shape) return null;

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
  const handles = [
    // Corners
    { x: -width / 2 - halfHandle, y: -height / 2 - halfHandle, cursor: 'nwse-resize' }, // Top-left
    { x: width / 2 - halfHandle, y: -height / 2 - halfHandle, cursor: 'nesw-resize' }, // Top-right
    { x: -width / 2 - halfHandle, y: height / 2 - halfHandle, cursor: 'nesw-resize' }, // Bottom-left
    { x: width / 2 - halfHandle, y: height / 2 - halfHandle, cursor: 'nwse-resize' }, // Bottom-right
    // Edges (middle of each side)
    { x: -halfHandle, y: -height / 2 - halfHandle, cursor: 'ns-resize' }, // Top-middle
    { x: -halfHandle, y: height / 2 - halfHandle, cursor: 'ns-resize' }, // Bottom-middle
    { x: -width / 2 - halfHandle, y: -halfHandle, cursor: 'ew-resize' }, // Left-middle
    { x: width / 2 - halfHandle, y: -halfHandle, cursor: 'ew-resize' }, // Right-middle
  ];

  return (
    <Group
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
          x={handle.x}
          y={handle.y}
          width={SELECTION_HANDLE_SIZE}
          height={SELECTION_HANDLE_SIZE}
          fill={SELECTION_HANDLE_FILL}
          stroke={SELECTION_HANDLE_STROKE}
          strokeWidth={SELECTION_HANDLE_STROKE_WIDTH}
          listening={false} // Don't capture events for now
        />
      ))}
    </Group>
  );
};

export default SelectionBox;

