import React from 'react';
import { Group, Rect } from 'react-konva';
import {
  SELECTION_STROKE_WIDTH,
  SELECTION_STROKE_COLOR,
  SELECTION_HANDLE_SIZE,
  SELECTION_HANDLE_FILL,
  SELECTION_HANDLE_STROKE,
  SELECTION_HANDLE_STROKE_WIDTH,
  getCursorForMode
} from '../../utils/canvas';

const SelectionBox = ({ shape, modes }) => {
  if (!shape) return null;

  const { x, y, width, height } = shape;
  const halfHandle = SELECTION_HANDLE_SIZE / 2;

  // Handle positions (centered on corners and edges)
  const handles = [
    // Corners
    { x: x - halfHandle, y: y - halfHandle, cursor: 'nwse-resize' }, // Top-left
    { x: x + width - halfHandle, y: y - halfHandle, cursor: 'nesw-resize' }, // Top-right
    { x: x - halfHandle, y: y + height - halfHandle, cursor: 'nesw-resize' }, // Bottom-left
    { x: x + width - halfHandle, y: y + height - halfHandle, cursor: 'nwse-resize' }, // Bottom-right
    // Edges (middle of each side)
    { x: x + width / 2 - halfHandle, y: y - halfHandle, cursor: 'ns-resize' }, // Top-middle
    { x: x + width / 2 - halfHandle, y: y + height - halfHandle, cursor: 'ns-resize' }, // Bottom-middle
    { x: x - halfHandle, y: y + height / 2 - halfHandle, cursor: 'ew-resize' }, // Left-middle
    { x: x + width - halfHandle, y: y + height / 2 - halfHandle, cursor: 'ew-resize' }, // Right-middle
  ];

  return (
    <Group>
      {/* Selection border */}
      <Rect
        x={x}
        y={y}
        width={width}
        height={height}
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
          onMouseEnter={(e) => {
            e.target.getStage().container().style.cursor = handle.cursor;
          }}
          onMouseLeave={(e) => {
            // Restore cursor based on active mode instead of forcing 'default'
            e.target.getStage().container().style.cursor = getCursorForMode(modes || {});
          }}
        />
      ))}
    </Group>
  );
};

export default SelectionBox;

