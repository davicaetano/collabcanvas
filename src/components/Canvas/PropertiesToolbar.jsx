import React from 'react';
import {
  PROPERTIES_PANEL_WIDTH,
  PROPERTIES_PANEL_BACKGROUND,
  PROPERTIES_SECTION_SPACING,
  Z_INDEX_PROPERTIES_TOOLBAR
} from '../../utils/canvas';
import NumericInput from './properties/NumericInput';
import ColorInput from './properties/ColorInput';
import { 
  TrashIcon, 
  DocumentDuplicateIcon, 
  ClipboardDocumentIcon,
  ClipboardIcon 
} from '@heroicons/react/24/outline';

const PropertiesToolbar = ({ selectedShapes = [], shapes = [], shapeManager }) => {
  const isDevMode = import.meta.env.VITE_DEV_MODE === 'true';
  
  // Get the actual shape objects from the selected IDs
  const selectedShapeObjects = selectedShapes
    .map(id => shapes.find(shape => shape.id === id))
    .filter(Boolean);
  
  // Get the single selected shape (if only one is selected)
  const selectedShape = selectedShapeObjects.length === 1 ? selectedShapeObjects[0] : null;
  
  // Check if there are shapes selected
  const hasSelection = selectedShapes.length > 0;

  /**
   * Handle property update for a shape
   * Uses shapeManager for optimistic updates and Firestore sync
   */
  const handlePropertyUpdate = async (shapeId, propertyName, newValue) => {
    if (!shapeManager) return;
    
    try {
      // shapeManager handles validation, optimistic update, and Firestore sync
      await shapeManager.updateShape(shapeId, {
        [propertyName]: newValue
      });
      
    } catch (error) {
      console.error('Failed to update property:', error);
      // shapeManager handles rollback if needed
    }
  };
  
  /**
   * Handle delete action
   * Deletes all selected shapes using batch operation
   */
  const handleDelete = () => {
    if (!hasSelection || !shapeManager) return;
    
    if (isDevMode) {
      console.log('[PropertiesToolbar] Deleting shapes:', selectedShapes);
    }
    
    shapeManager.deleteShapeBatch(selectedShapes);
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
      {/* Actions Section */}
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-gray-400 text-xs font-medium mb-3 uppercase tracking-wider">
          Actions
        </h3>
        <div className="flex items-center justify-evenly">
          {/* Delete Button */}
          <button
            onClick={handleDelete}
            disabled={!hasSelection}
            className={`
              flex items-center justify-center border transition-all duration-200 ease-out group
              ${hasSelection 
                ? 'bg-white/5 border-gray-600 hover:bg-blue-100/10 hover:border-blue-400/60' 
                : 'bg-gray-800 border-gray-700 opacity-50'
              }
            `}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              cursor: 'default',
            }}
            title="Delete (Backspace)"
            onMouseEnter={(e) => {
              if (hasSelection) {
                e.currentTarget.style.transform = 'scale(1.05)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <TrashIcon 
              className={`w-5 h-5 transition-colors duration-200 ${
                hasSelection ? 'text-gray-300 group-hover:text-blue-400' : 'text-gray-600'
              }`}
              strokeWidth={1.5}
            />
          </button>

          {/* Copy Button - Placeholder */}
          <button
            disabled={true}
            className="flex items-center justify-center bg-gray-800 border border-gray-700 cursor-default opacity-50"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
            }}
            title="Copy (⌘C / Ctrl+C)"
          >
            <ClipboardDocumentIcon className="w-5 h-5 text-gray-600" strokeWidth={1.5} />
          </button>

          {/* Paste Button - Placeholder */}
          <button
            disabled={true}
            className="flex items-center justify-center bg-gray-800 border border-gray-700 cursor-default opacity-50"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
            }}
            title="Paste (⌘V / Ctrl+V)"
          >
            <ClipboardIcon className="w-5 h-5 text-gray-600" strokeWidth={1.5} />
          </button>

          {/* Duplicate Button - Placeholder */}
          <button
            disabled={true}
            className="flex items-center justify-center bg-gray-800 border border-gray-700 cursor-default opacity-50"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
            }}
            title="Duplicate (⌘D / Ctrl+D)"
          >
            <DocumentDuplicateIcon className="w-5 h-5 text-gray-600" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Properties Section */}
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-gray-400 text-xs font-medium mb-3 uppercase tracking-wider">
          Properties
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
    </div>
  );
};

export default PropertiesToolbar;
