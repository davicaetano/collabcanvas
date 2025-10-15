import React from 'react';
import { Rect } from 'react-konva';

const CanvasPreview = React.memo(({ isAddMode, previewRect, selectedColor }) => {
  if (!isAddMode || !previewRect) return null;

  // Convert hex color to rgba with opacity
  const hexToRgba = (hex, alpha = 0.3) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <Rect
      x={previewRect.x}
      y={previewRect.y}
      width={Math.abs(previewRect.width)}
      height={Math.abs(previewRect.height)}
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
