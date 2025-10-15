import React from 'react';
import {
  PROPERTIES_PANEL_WIDTH,
  PROPERTIES_PANEL_BACKGROUND,
  PROPERTIES_PANEL_BORDER,
  PROPERTIES_PANEL_TEXT_COLOR,
  PROPERTIES_SECTION_SPACING,
  PROPERTIES_LABEL_COLOR,
  Z_INDEX_PROPERTIES_TOOLBAR
} from '../../utils/canvas';

const PropertiesToolbar = ({ selectedShapes = [], shapes = [] }) => {
  const isDevMode = import.meta.env.VITE_DEV_MODE === 'true';
  
  // Get the actual shape objects from the selected IDs
  const selectedShapeObjects = selectedShapes
    .map(id => shapes.find(shape => shape.id === id))
    .filter(Boolean);
  
  return (
    <div
      className={`${PROPERTIES_PANEL_BACKGROUND} border-l overflow-y-auto flex-shrink-0 flex flex-col`}
      style={{
        width: `${PROPERTIES_PANEL_WIDTH}px`,
        minWidth: `${PROPERTIES_PANEL_WIDTH}px`,
        maxWidth: `${PROPERTIES_PANEL_WIDTH}px`,
        zIndex: Z_INDEX_PROPERTIES_TOOLBAR,
        ...(isDevMode && { border: '5px solid red' }), // DEV MODE: Red border for debugging
        backgroundColor: '#1f2937', // Ensure dark background is visible
      }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className={`${PROPERTIES_PANEL_TEXT_COLOR} text-lg font-semibold`}>
          Properties
        </h2>
      </div>

      {/* Content Area */}
      <div className="p-4 space-y-4">
        {/* Canvas Properties Section */}
        <div>
          <h3 className={`${PROPERTIES_LABEL_COLOR} text-sm font-medium mb-3`}>
            Canvas Properties
          </h3>
          <div 
            className="space-y-2"
            style={{ marginBottom: `${PROPERTIES_SECTION_SPACING}px` }}
          >
            <div className="text-gray-400 text-sm">
              • Background color
            </div>
            <div className="text-gray-400 text-sm">
              • Grid settings
            </div>
            <div className="text-gray-400 text-sm">
              • Zoom controls
            </div>
          </div>
        </div>

        {/* Shape Properties Section */}
        <div>
          <h3 className={`${PROPERTIES_LABEL_COLOR} text-sm font-medium mb-3`}>
            Shape Properties
          </h3>
          <div 
            className="space-y-2"
            style={{ marginBottom: `${PROPERTIES_SECTION_SPACING}px` }}
          >
            {selectedShapeObjects.length === 0 ? (
              <div className="text-gray-500 text-sm italic">
                Select a shape to edit its properties
              </div>
            ) : selectedShapeObjects.length === 1 ? (
              // Single shape selected - show actual properties
              <>
                <div className="text-gray-300 text-sm">
                  <span className="text-gray-500">Position:</span> X: {Math.round(selectedShapeObjects[0].x)}, Y: {Math.round(selectedShapeObjects[0].y)}
                </div>
                <div className="text-gray-300 text-sm">
                  <span className="text-gray-500">Size:</span> {Math.round(selectedShapeObjects[0].width)} × {Math.round(selectedShapeObjects[0].height)}
                </div>
                <div className="text-gray-300 text-sm">
                  <span className="text-gray-500">Fill:</span> {selectedShapeObjects[0].fill}
                </div>
                <div className="text-gray-300 text-sm">
                  <span className="text-gray-500">Stroke:</span> {selectedShapeObjects[0].stroke}
                </div>
                <div className="text-gray-300 text-sm">
                  <span className="text-gray-500">Stroke Width:</span> {selectedShapeObjects[0].strokeWidth}px
                </div>
              </>
            ) : (
              // Multiple shapes selected
              <div className="text-gray-300 text-sm">
                {selectedShapeObjects.length} shapes selected
              </div>
            )}
            <div className="text-gray-400 text-sm mt-3">
              <em>Editable controls coming soon...</em>
            </div>
          </div>
        </div>

        {/* Selection Properties Section */}
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
            <div className="text-gray-400 text-sm">
              <em>Multi-select operations coming soon...</em>
            </div>
          </div>
        </div>

        {/* Placeholder for future sections */}
        <div>
          <h3 className={`${PROPERTIES_LABEL_COLOR} text-sm font-medium mb-3`}>
            Advanced
          </h3>
          <div className="text-gray-500 text-sm italic">
            Coming soon...
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertiesToolbar;
