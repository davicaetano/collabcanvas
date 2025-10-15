import { Rect } from 'react-konva';
import {
  MARQUEE_STROKE_COLOR,
  MARQUEE_STROKE_WIDTH,
  MARQUEE_FILL_COLOR,
  MARQUEE_DASH_PATTERN,
  Z_INDEX_MARQUEE,
} from '../../utils/canvas';

/**
 * MarqueeBox - Visual rectangle shown during drag selection
 * 
 * Displays a semi-transparent blue box with dashed border while user
 * drags on the canvas to select multiple shapes.
 * 
 * @param {Object} props
 * @param {Object} props.marqueeStart - Starting point {x, y}
 * @param {Object} props.marqueeEnd - Current mouse position {x, y}
 */
export const MarqueeBox = ({ marqueeStart, marqueeEnd }) => {
  if (!marqueeStart || !marqueeEnd) {
    return null;
  }

  // Calculate rectangle bounds from start and end points
  const x = Math.min(marqueeStart.x, marqueeEnd.x);
  const y = Math.min(marqueeStart.y, marqueeEnd.y);
  const width = Math.abs(marqueeEnd.x - marqueeStart.x);
  const height = Math.abs(marqueeEnd.y - marqueeStart.y);

  return (
    <Rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={MARQUEE_FILL_COLOR}
      stroke={MARQUEE_STROKE_COLOR}
      strokeWidth={MARQUEE_STROKE_WIDTH}
      dash={MARQUEE_DASH_PATTERN}
      listening={false} // Don't capture mouse events
      zIndex={Z_INDEX_MARQUEE}
    />
  );
};

