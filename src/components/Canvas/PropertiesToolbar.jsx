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

const PropertiesToolbar = () => {
  const isDevMode = import.meta.env.VITE_DEV_MODE === 'true';
  
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
            <div className="text-gray-500 text-sm italic">
              Select a shape to edit its properties
            </div>
            <div className="text-gray-400 text-sm">
              • Position (X, Y)
            </div>
            <div className="text-gray-400 text-sm">
              • Size (Width, Height)
            </div>
            <div className="text-gray-400 text-sm">
              • Fill color
            </div>
            <div className="text-gray-400 text-sm">
              • Stroke color
            </div>
            <div className="text-gray-400 text-sm">
              • Stroke width
            </div>
            <div className="text-gray-400 text-sm">
              • Opacity
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
            <div className="text-gray-500 text-sm italic">
              No shapes selected
            </div>
            <div className="text-gray-400 text-sm">
              • Multi-select operations
            </div>
            <div className="text-gray-400 text-sm">
              • Alignment tools
            </div>
            <div className="text-gray-400 text-sm">
              • Group/ungroup
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
