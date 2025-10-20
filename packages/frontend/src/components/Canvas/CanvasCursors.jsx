import React from 'react';
import { Group, Line, RegularPolygon, Text as KonvaText } from 'react-konva';

const CanvasCursors = React.memo(({ cursors, onlineUsers, currentUser, stageScale = 1 }) => {
  // Calculate inverse scale to keep cursor size constant regardless of zoom
  const cursorScale = 1 / stageScale;
  
  return (
    <>
      {Object.entries(cursors)
        .filter(([userId]) => userId !== currentUser?.uid)
        .filter(([userId]) => onlineUsers && onlineUsers[userId])
        .map(([userId, cursor]) => (
          <Group 
            key={userId} 
            x={cursor.x} 
            y={cursor.y} 
            scaleX={cursorScale}
            scaleY={cursorScale}
            listening={false}
          >
            {/* Cursor arrow - line with arrowhead */}
            <Line
              points={[0, 0, -12, -12]}
              stroke={cursor.color}
              strokeWidth={3}
              lineCap="round"
            />
            
            {/* Arrowhead triangle */}
            <RegularPolygon
              x={-12}
              y={-12}
              sides={3}
              radius={4}
              fill={cursor.color}
              rotation={315} // 135 + 180 = 315 degrees to flip the triangle
            />
            
            {/* User name */}
            <KonvaText
              x={5}
              y={-15}
              text={cursor.name}
              fontSize={12}
              fontFamily="Arial"
              fill={cursor.color}
              fontStyle="bold"
            />
          </Group>
        ))
      }
    </>
  );
});

CanvasCursors.displayName = 'CanvasCursors';

export default CanvasCursors;
