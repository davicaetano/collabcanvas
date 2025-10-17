import React from 'react';
import { Rect, Ellipse } from 'react-konva';

const CanvasPreview = React.memo(({ addMode, previewRect, selectedColor }) => {
  if (addMode === 'none' || !previewRect) return null;

  // Convert hex color to rgba with opacity
  const hexToRgba = (hex, alpha = 0.3) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Determine which component to render based on addMode
  const isCircle = addMode === 'circle';
  const width = Math.abs(previewRect.width);
  const height = Math.abs(previewRect.height);
  
  // Calculate center position for ellipse
  const centerX = previewRect.x + width / 2;
  const centerY = previewRect.y + height / 2;

  return isCircle ? (
    <Ellipse
      x={centerX}
      y={centerY}
      radiusX={width / 2}
      radiusY={height / 2}
      fill={hexToRgba(selectedColor)}
      stroke={selectedColor}
      strokeWidth={2}
      dash={[5, 5]}
      listening={false}
    />
  ) : (
    <Rect
      x={previewRect.x}
      y={previewRect.y}
      width={width}
      height={height}
      fill={hexToRgba(selectedColor)}
      stroke={selectedColor}
      strokeWidth={2}
      dash={[5, 5]}
      listening={false}
    />
  );
});

CanvasPreview.displayName = 'CanvasPreview';

export default CanvasPreview;
