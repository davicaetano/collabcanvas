import React from 'react';
import {
  PROPERTIES_PANEL_WIDTH,
  PROPERTIES_PANEL_BACKGROUND,
  PROPERTIES_PANEL_TEXT_COLOR,
  PROPERTIES_SECTION_SPACING,
  PROPERTIES_LABEL_COLOR,
  Z_INDEX_PROPERTIES_TOOLBAR
} from '../../utils/canvas';
import NumericInput from './properties/NumericInput';
import ColorInput from './properties/ColorInput';
import { validateProperty } from '../../utils/propertyValidation';
import { updateShape as updateShapeInFirestore } from '../../utils/firestore';

const PropertiesToolbar = ({ selectedShapes = [], shapes = [], onShapesChange }) => {
  const isDevMode = import.meta.env.VITE_DEV_MODE === 'true';
  
  // Get the actual shape objects from the selected IDs
  const selectedShapeObjects = selectedShapes
    .map(id => shapes.find(shape => shape.id === id))
    .filter(Boolean);
  
  // Get the single selected shape (if only one is selected)
  const selectedShape = selectedShapeObjects.length === 1 ? selectedShapeObjects[0] : null;

  /**
   * Handle property update for a shape
   * 1. Validate the new value
   * 2. If valid: update local state optimistically
   * 3. Sync to Firestore
   * 4. If invalid: keep previous value (do nothing)
   */
  const handlePropertyUpdate = async (shapeId, propertyName, newValue) => {
    try {
      // 1. Validate the new value
      const validatedValue = validateProperty(propertyName, newValue);
      
      // If validation fails, keep the current value (do nothing)
      if (validatedValue === null) {
        console.log(`Invalid value for ${propertyName}: ${newValue} - keeping current value`);
        return;
      }
      
      // 2. Optimistic update (update local state immediately)
      const updatedShapes = shapes.map(shape => 
        shape.id === shapeId 
          ? { ...shape, [propertyName]: validatedValue }
          : shape
      );
      onShapesChange(updatedShapes);
      
      // 3. Sync to Firestore
      await updateShapeInFirestore(shapeId, {
        [propertyName]: validatedValue
      });
      
    } catch (error) {
      console.error('Failed to update property:', error);
      // Keep current value on error - Firestore will sync back if needed
    }
  };
  
  return (
    <div
      className={`${PROPERTIES_PANEL_BACKGROUND} border-l overflow-y-auto flex-shrink-0 flex flex-col`}
      style={{
        width: `${PROPERTIES_PANEL_WIDTH}px`,
        minWidth: `${PROPERTIES_PANEL_WIDTH}px`,
        maxWidth: `${PROPERTIES_PANEL_WIDTH}px`,
        zIndex: Z_INDEX_PROPERTIES_TOOLBAR,
        ...(isDevMode && { border: '5px solid red' }),
        backgroundColor: '#1f2937',
      }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className={`${PROPERTIES_PANEL_TEXT_COLOR} text-lg font-semibold`}>
          Properties
        </h2>
      </div>

      {/* Content Area */}
      <div className="p-4 space-y-6">
        {/* Shape Properties Section */}
        <div>
          <h3 className={`${PROPERTIES_LABEL_COLOR} text-sm font-medium mb-4`}>
            Shape Properties
          </h3>
          <div 
            className="space-y-4"
            style={{ marginBottom: `${PROPERTIES_SECTION_SPACING}px` }}
          >
            {selectedShapeObjects.length === 0 ? (
              <div className="text-gray-500 text-sm italic">
                Select a shape to edit its properties
              </div>
            ) : selectedShapeObjects.length === 1 ? (
              // Single shape selected - show editable properties
              <div className="space-y-4">
                {/* Position Section */}
                <div>
                  <div className="text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">
                    Position
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <NumericInput
                      label="X"
                      value={selectedShape.x}
                      onChange={(value) => handlePropertyUpdate(selectedShape.id, 'x', value)}
                      min={0}
                      max={3000}
                      step={1}
                      unit="px"
                    />
                    <NumericInput
                      label="Y"
                      value={selectedShape.y}
                      onChange={(value) => handlePropertyUpdate(selectedShape.id, 'y', value)}
                      min={0}
                      max={3000}
                      step={1}
                      unit="px"
                    />
                  </div>
                </div>

                {/* Size Section */}
                <div>
                  <div className="text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">
                    Size
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <NumericInput
                      label="Width"
                      value={selectedShape.width}
                      onChange={(value) => handlePropertyUpdate(selectedShape.id, 'width', value)}
                      min={1}
                      max={3000}
                      step={1}
                      unit="px"
                    />
                    <NumericInput
                      label="Height"
                      value={selectedShape.height}
                      onChange={(value) => handlePropertyUpdate(selectedShape.id, 'height', value)}
                      min={1}
                      max={3000}
                      step={1}
                      unit="px"
                    />
                  </div>
                </div>

                {/* Appearance Section */}
                <div>
                  <div className="text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">
                    Appearance
                  </div>
                  <div className="space-y-3">
                    <ColorInput
                      label="Fill Color"
                      value={selectedShape.fill}
                      onChange={(value) => handlePropertyUpdate(selectedShape.id, 'fill', value)}
                    />
                    <ColorInput
                      label="Stroke Color"
                      value={selectedShape.stroke}
                      onChange={(value) => handlePropertyUpdate(selectedShape.id, 'stroke', value)}
                    />
                    <NumericInput
                      label="Stroke Width"
                      value={selectedShape.strokeWidth}
                      onChange={(value) => handlePropertyUpdate(selectedShape.id, 'strokeWidth', value)}
                      min={0}
                      max={100}
                      step={1}
                      unit="px"
                    />
                  </div>
                </div>
              </div>
            ) : (
              // Multiple shapes selected
              <div className="text-gray-300 text-sm">
                <span className="text-blue-400 font-medium">{selectedShapeObjects.length}</span> shapes selected
                <div className="text-gray-500 text-xs mt-2">
                  Multi-select editing coming soon...
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Selection Info Section */}
        <div>
          <h3 className={`${PROPERTIES_LABEL_COLOR} text-sm font-medium mb-3`}>
            Selection
          </h3>
          <div 
            className="space-y-2"
            style={{ marginBottom: `${PROPERTIES_SECTION_SPACING}px` }}
          >
            {selectedShapeObjects.length === 0 ? (
              <div className="text-gray-500 text-sm italic">
                No shapes selected
              </div>
            ) : (
              <div className="text-gray-300 text-sm">
                <span className="text-blue-400 font-medium">{selectedShapeObjects.length}</span> shape{selectedShapeObjects.length !== 1 ? 's' : ''} selected
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertiesToolbar;
