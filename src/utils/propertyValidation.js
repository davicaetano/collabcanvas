/**
 * Property Validation Utility
 * 
 * Validates shape property values according to defined constraints.
 * Returns null for invalid values (which keeps the previous value).
 * 
 * Strategy: Simple validation - reject invalid values silently
 */

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './canvas';

// Define constraints for each property
export const PROPERTY_CONSTRAINTS = {
  x: { 
    type: 'number', 
    min: 0, 
    max: CANVAS_WIDTH,
    description: 'X position in canvas coordinates (0 to canvas width)'
  },
  y: { 
    type: 'number', 
    min: 0, 
    max: CANVAS_HEIGHT,
    description: 'Y position in canvas coordinates (0 to canvas height)'
  },
  width: { 
    type: 'number', 
    min: 1, 
    max: CANVAS_WIDTH,
    description: 'Shape width (must be positive, max canvas width)'
  },
  height: { 
    type: 'number', 
    min: 1, 
    max: CANVAS_HEIGHT,
    description: 'Shape height (must be positive, max canvas height)'
  },
  strokeWidth: { 
    type: 'number', 
    min: 0, 
    max: 100,
    description: 'Stroke width in pixels'
  },
  rotation: { 
    type: 'number', 
    min: 0, 
    max: 360,
    description: 'Rotation angle in degrees (0-360)'
  },
  fill: { 
    type: 'color',
    description: 'Fill color in hex format (#RRGGBB)'
  },
  stroke: { 
    type: 'color',
    description: 'Stroke color in hex format (#RRGGBB)'
  },
};

/**
 * Validate a property value according to its constraints
 * 
 * @param {string} propertyName - Name of the property to validate
 * @param {any} value - Value to validate
 * @returns {number|string|null} - Validated value or null if invalid
 */
export const validateProperty = (propertyName, value) => {
  const constraint = PROPERTY_CONSTRAINTS[propertyName];
  
  // Unknown property - reject
  if (!constraint) {
    console.warn(`Unknown property: ${propertyName}`);
    return null;
  }
  
  switch (constraint.type) {
    case 'number':
      return validateNumber(value, constraint);
      
    case 'color':
      return validateColor(value);
      
    default:
      return value;
  }
};

/**
 * Validate numeric values
 * 
 * @param {any} value - Value to validate
 * @param {Object} constraint - Constraint object with min/max
 * @returns {number|null} - Validated number or null if invalid
 */
const validateNumber = (value, constraint) => {
  // Convert to number
  const num = parseFloat(value);
  
  // Check if valid number
  if (isNaN(num) || !isFinite(num)) {
    return null;
  }
  
  // Check min constraint
  if (constraint.min !== undefined && num < constraint.min) {
    return null;
  }
  
  // Check max constraint
  if (constraint.max !== undefined && num > constraint.max) {
    return null;
  }
  
  return num;
};

/**
 * Validate hex color format
 * 
 * @param {string} value - Color value to validate
 * @returns {string|null} - Validated color or null if invalid
 */
const validateColor = (value) => {
  // Must be a string
  if (typeof value !== 'string') {
    return null;
  }
  
  // Validate hex color format: #RRGGBB
  const hexPattern = /^#[0-9A-Fa-f]{6}$/;
  
  if (!hexPattern.test(value)) {
    return null;
  }
  
  return value;
};

/**
 * Get constraint information for a property
 * Useful for displaying validation rules in UI
 * 
 * @param {string} propertyName - Name of the property
 * @returns {Object|null} - Constraint object or null if not found
 */
export const getPropertyConstraint = (propertyName) => {
  return PROPERTY_CONSTRAINTS[propertyName] || null;
};

/**
 * Check if a property exists in constraints
 * 
 * @param {string} propertyName - Name of the property
 * @returns {boolean} - True if property exists
 */
export const isValidPropertyName = (propertyName) => {
  return propertyName in PROPERTY_CONSTRAINTS;
};

