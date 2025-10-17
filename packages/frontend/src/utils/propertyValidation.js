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
  // Text properties
  text: {
    type: 'string',
    maxLength: 5000,
    description: 'Text content (max 5000 characters)'
  },
  fontSize: {
    type: 'number',
    min: 8,
    max: 200,
    description: 'Font size in pixels (8-200)'
  },
  fontFamily: {
    type: 'string',
    maxLength: 100,
    description: 'Font family name'
  },
  fontStyle: {
    type: 'enum',
    values: ['normal', 'italic', 'bold', 'italic bold'],
    description: 'Font style (normal, italic, bold, italic bold)'
  },
  textAlign: {
    type: 'enum',
    values: ['left', 'center', 'right'],
    description: 'Text alignment (left, center, right)'
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
    return null;
  }
  
  switch (constraint.type) {
    case 'number':
      return validateNumber(value, constraint);
      
    case 'color':
      return validateColor(value);
      
    case 'string':
      return validateString(value, constraint);
      
    case 'enum':
      return validateEnum(value, constraint);
      
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
 * Validate string values
 * 
 * @param {any} value - Value to validate
 * @param {Object} constraint - Constraint object with maxLength
 * @returns {string|null} - Validated string or null if invalid
 */
const validateString = (value, constraint) => {
  // Must be a string
  if (typeof value !== 'string') {
    return null;
  }
  
  // Check max length constraint
  if (constraint.maxLength !== undefined && value.length > constraint.maxLength) {
    return null;
  }
  
  return value;
};

/**
 * Validate enum values
 * 
 * @param {any} value - Value to validate
 * @param {Object} constraint - Constraint object with values array
 * @returns {string|null} - Validated value or null if invalid
 */
const validateEnum = (value, constraint) => {
  // Must be in the allowed values list
  if (!constraint.values || !constraint.values.includes(value)) {
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

