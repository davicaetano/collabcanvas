import React from 'react';
import { Line } from 'react-konva';
import { GRID_SIZE } from '../../utils/canvas';

/**
 * Infinite grid component that renders grid lines based on current viewport
 * The grid extends infinitely in all directions, including negative space
 */
const CanvasGrid = React.memo(({ stageX, stageY, stageScale, viewportWidth, viewportHeight }) => {
  // Calculate the visible canvas area in canvas coordinates (not screen coordinates)
  const startX = -stageX / stageScale;
  const startY = -stageY / stageScale;
  const endX = startX + viewportWidth / stageScale;
  const endY = startY + viewportHeight / stageScale;
  
  // Add padding to ensure grid lines at edges
  const padding = GRID_SIZE * 2;
  const visibleStartX = startX - padding;
  const visibleStartY = startY - padding;
  const visibleEndX = endX + padding;
  const visibleEndY = endY + padding;
  
  // Calculate which grid lines to draw
  const firstVerticalLine = Math.floor(visibleStartX / GRID_SIZE) * GRID_SIZE;
  const lastVerticalLine = Math.ceil(visibleEndX / GRID_SIZE) * GRID_SIZE;
  const firstHorizontalLine = Math.floor(visibleStartY / GRID_SIZE) * GRID_SIZE;
  const lastHorizontalLine = Math.ceil(visibleEndY / GRID_SIZE) * GRID_SIZE;
  
  // Generate vertical lines
  const verticalLines = [];
  for (let x = firstVerticalLine; x <= lastVerticalLine; x += GRID_SIZE) {
    verticalLines.push(
      <Line
        key={`grid-v-${x}`}
        points={[x, visibleStartY - padding, x, visibleEndY + padding]}
        stroke="#e5e5e5"
        strokeWidth={1 / stageScale} // Scale stroke width to maintain consistent appearance
        listening={false}
      />
    );
  }
  
  // Generate horizontal lines
  const horizontalLines = [];
  for (let y = firstHorizontalLine; y <= lastHorizontalLine; y += GRID_SIZE) {
    horizontalLines.push(
      <Line
        key={`grid-h-${y}`}
        points={[visibleStartX - padding, y, visibleEndX + padding, y]}
        stroke="#e5e5e5"
        strokeWidth={1 / stageScale} // Scale stroke width to maintain consistent appearance
        listening={false}
      />
    );
  }
  
  return (
    <>
      {verticalLines}
      {horizontalLines}
    </>
  );
});

CanvasGrid.displayName = 'CanvasGrid';

export default CanvasGrid;
