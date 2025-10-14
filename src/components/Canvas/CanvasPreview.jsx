import React from 'react';
import { Rect } from 'react-konva';

const CanvasPreview = React.memo(({ isAddMode, previewRect }) => {
  if (!isAddMode || !previewRect) return null;

  return (
    <Rect
      x={previewRect.x}
      y={previewRect.y}
      width={Math.abs(previewRect.width)}
      height={Math.abs(previewRect.height)}
      fill="rgba(59, 130, 246, 0.3)"
      stroke="#3b82f6"
      strokeWidth={2}
      dash={[5, 5]}
    />
  );
});

CanvasPreview.displayName = 'CanvasPreview';

export default CanvasPreview;
