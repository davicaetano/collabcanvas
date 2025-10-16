import React from 'react';
import { Rect } from 'react-konva';
import { CANVAS_WIDTH, CANVAS_HEIGHT, GRID_SIZE } from '../../utils/canvas';

const CanvasGrid = React.memo(() => {
  const isDevMode = import.meta.env.VITE_DEV_MODE === 'true';
  
  return (
    <>
      {/* Dev Mode Only: Red border around canvas for debugging */}
      {isDevMode && (
        <Rect
          x={0}
          y={0}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          fill="transparent"
          stroke="red"
          strokeWidth={10}
          listening={false}
        />
      )}
      
      {/* Vertical grid lines */}
      {Array.from({ length: Math.ceil(CANVAS_WIDTH / GRID_SIZE) + 1 }, (_, i) => (
        <Rect
          key={`grid-v-${i}`}
          x={i * GRID_SIZE}
          y={0}
          width={1}
          height={CANVAS_HEIGHT}
          fill="#e5e5e5"
          listening={false}
        />
      ))}
      
      {/* Horizontal grid lines */}
      {Array.from({ length: Math.ceil(CANVAS_HEIGHT / GRID_SIZE) + 1 }, (_, i) => (
        <Rect
          key={`grid-h-${i}`}
          x={0}
          y={i * GRID_SIZE}
          width={CANVAS_WIDTH}
          height={1}
          fill="#e5e5e5"
          listening={false}
        />
      ))}
    </>
  );
});

CanvasGrid.displayName = 'CanvasGrid';

export default CanvasGrid;
