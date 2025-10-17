/**
 * Geometry utility functions for canvas calculations
 */

/**
 * Check if two rectangles intersect (no rotation)
 * @param {Object} rect1 - First rectangle {x, y, width, height}
 * @param {Object} rect2 - Second rectangle {x, y, width, height}
 * @returns {boolean} - True if rectangles intersect
 */
export const rectanglesIntersect = (rect1, rect2) => {
  return !(
    rect1.x + rect1.width < rect2.x ||
    rect2.x + rect2.width < rect1.x ||
    rect1.y + rect1.height < rect2.y ||
    rect2.y + rect2.height < rect1.y
  );
};

/**
 * Check if a rectangle intersects with a rotated rectangle
 * Uses Separating Axis Theorem (SAT) for accurate collision detection
 * 
 * @param {Object} marquee - Non-rotated marquee rectangle {x, y, width, height}
 * @param {Object} shape - Rotated shape {x, y, width, height, rotation}
 * @returns {boolean} - True if rectangles intersect
 */
export const rectangleIntersectsRotatedRectangle = (marquee, shape) => {
  const { x, y, width, height, rotation = 0 } = shape;
  
  // If no rotation, use simple rectangle intersection
  if (rotation === 0) {
    return rectanglesIntersect(marquee, { x, y, width, height });
  }
  
  // Convert rotation to radians
  const angle = (rotation * Math.PI) / 180;
  
  // Calculate center of the rotated shape
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  
  // Get corners of the rotated shape relative to its center
  const corners = [
    { x: -width / 2, y: -height / 2 }, // Top-left
    { x: width / 2, y: -height / 2 },  // Top-right
    { x: width / 2, y: height / 2 },   // Bottom-right
    { x: -width / 2, y: height / 2 },  // Bottom-left
  ];
  
  // Rotate corners and translate to world position
  const rotatedCorners = corners.map(corner => {
    const rotatedX = corner.x * Math.cos(angle) - corner.y * Math.sin(angle);
    const rotatedY = corner.x * Math.sin(angle) + corner.y * Math.cos(angle);
    return {
      x: centerX + rotatedX,
      y: centerY + rotatedY,
    };
  });
  
  // Get corners of marquee
  const marqueeCorners = [
    { x: marquee.x, y: marquee.y },
    { x: marquee.x + marquee.width, y: marquee.y },
    { x: marquee.x + marquee.width, y: marquee.y + marquee.height },
    { x: marquee.x, y: marquee.y + marquee.height },
  ];
  
  // Check if any corner of the rotated shape is inside the marquee
  for (const corner of rotatedCorners) {
    if (
      corner.x >= marquee.x &&
      corner.x <= marquee.x + marquee.width &&
      corner.y >= marquee.y &&
      corner.y <= marquee.y + marquee.height
    ) {
      return true;
    }
  }
  
  // Check if any corner of the marquee is inside the rotated shape
  // Use point-in-polygon test
  for (const corner of marqueeCorners) {
    if (pointInPolygon(corner, rotatedCorners)) {
      return true;
    }
  }
  
  // Check if any edges intersect
  for (let i = 0; i < rotatedCorners.length; i++) {
    const p1 = rotatedCorners[i];
    const p2 = rotatedCorners[(i + 1) % rotatedCorners.length];
    
    for (let j = 0; j < marqueeCorners.length; j++) {
      const p3 = marqueeCorners[j];
      const p4 = marqueeCorners[(j + 1) % marqueeCorners.length];
      
      if (lineSegmentsIntersect(p1, p2, p3, p4)) {
        return true;
      }
    }
  }
  
  return false;
};

/**
 * Check if a point is inside a polygon using ray casting algorithm
 * @param {Object} point - Point {x, y}
 * @param {Array} polygon - Array of points [{x, y}, ...]
 * @returns {boolean} - True if point is inside polygon
 */
const pointInPolygon = (point, polygon) => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    
    const intersect = ((yi > point.y) !== (yj > point.y)) &&
      (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
    
    if (intersect) inside = !inside;
  }
  return inside;
};

/**
 * Check if two line segments intersect
 * @param {Object} p1 - Start of line 1 {x, y}
 * @param {Object} p2 - End of line 1 {x, y}
 * @param {Object} p3 - Start of line 2 {x, y}
 * @param {Object} p4 - End of line 2 {x, y}
 * @returns {boolean} - True if line segments intersect
 */
const lineSegmentsIntersect = (p1, p2, p3, p4) => {
  const ccw = (A, B, C) => {
    return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
  };
  
  return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
};
