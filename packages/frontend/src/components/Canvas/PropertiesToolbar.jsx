import React, { useRef } from 'react';
import {
  PROPERTIES_PANEL_WIDTH,
  PROPERTIES_PANEL_BACKGROUND,
  PROPERTIES_SECTION_SPACING,
  Z_INDEX_PROPERTIES_TOOLBAR
} from '../../utils/canvas';
import NumericInput from './properties/NumericInput';
import ColorInput from './properties/ColorInput';
import TextInput from './properties/TextInput';
import SelectInput from './properties/SelectInput';
import { 
  TrashIcon, 
  DocumentDuplicateIcon, 
  ClipboardDocumentIcon,
  ClipboardIcon 
} from '@heroicons/react/24/outline';

const PropertiesToolbar = ({ selectedShapes = [], shapes = [], shapeManager, canvasState }) => {
  const isDevMode = import.meta.env.VITE_DEV_MODE === 'true';
  
  // Get the actual shape objects from the selected IDs
  const selectedShapeObjects = selectedShapes
    .map(id => shapes.find(shape => shape.id === id))
    .filter(Boolean);
  
  // Get the single selected shape (if only one is selected)
  const selectedShape = selectedShapeObjects.length === 1 ? selectedShapeObjects[0] : null;
  
  // Check if there are shapes selected
  const hasSelection = selectedShapes.length > 0;

  // Throttle ref for property updates (to avoid excessive Firebase writes)
  const propertyThrottleRef = useRef({});

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
      // shapeManager handles rollback if needed
    }
  };

  /**
   * Handle property update with throttling (for continuous inputs like sliders)
   * Updates local state immediately but throttles Firebase writes to 100ms
   */
  const handlePropertyUpdateThrottled = async (shapeId, propertyName, newValue) => {
    if (!shapeManager) return;
    
    // Create a unique key for this shape+property combination
    const throttleKey = `${shapeId}-${propertyName}`;
    
    // Throttle Firebase updates to once every 100ms
    const now = Date.now();
    const lastUpdate = propertyThrottleRef.current[throttleKey]?.lastUpdate || 0;
    const timeSinceLastUpdate = now - lastUpdate;
    
    if (timeSinceLastUpdate >= 100) {
      // Send to Firebase immediately (throttled)
      handlePropertyUpdate(shapeId, propertyName, newValue);
      propertyThrottleRef.current[throttleKey] = { lastUpdate: now, pendingUpdate: null };
    } else {
      // Schedule pending update
      if (propertyThrottleRef.current[throttleKey]?.pendingUpdate) {
        clearTimeout(propertyThrottleRef.current[throttleKey].pendingUpdate);
      }
      
      propertyThrottleRef.current[throttleKey] = {
        ...propertyThrottleRef.current[throttleKey],
        pendingUpdate: setTimeout(() => {
          handlePropertyUpdate(shapeId, propertyName, newValue);
          propertyThrottleRef.current[throttleKey] = { 
            lastUpdate: Date.now(), 
            pendingUpdate: null 
          };
        }, 100 - timeSinceLastUpdate)
      };
    }
  };
  
  /**
   * Handle delete action
   * Deletes all selected shapes using batch operation
   */
  const handleDelete = () => {
    if (!hasSelection || !shapeManager) return;
    
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
              // No shapes selected - show canvas properties
              <div className="space-y-4">
                <div>
                  <div className="text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">
                    Background Color
                  </div>
                  <ColorInput
                    label="Canvas Background"
                    value={canvasState?.canvasBackgroundColor || '#ffffff'}
                    onChange={(value) => canvasState?.updateBackgroundColor(value)}
                  />
                </div>
              </div>
            ) : selectedShapeObjects.length === 1 ? (
              // Single shape selected - show editable properties
              <div className="space-y-4">
                {/* Text Properties Section - Only for text shapes */}
                {selectedShape.type === 'text' && (
                  <div>
                    <div className="text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">
                      Text Content
                    </div>
                    <div className="space-y-3">
                      <TextInput
                        label="Text"
                        value={selectedShape.text}
                        onChange={(value) => handlePropertyUpdate(selectedShape.id, 'text', value)}
                        placeholder="Enter text..."
                        maxLength={5000}
                      />
                      
                      <NumericInput
                        label="Font Size"
                        value={selectedShape.fontSize || 24}
                        onChange={(value) => handlePropertyUpdate(selectedShape.id, 'fontSize', value)}
                        min={8}
                        max={200}
                        step={1}
                        unit="px"
                      />
                      
                      <SelectInput
                        label="Font Family"
                        value={selectedShape.fontFamily || 'Arial, sans-serif'}
                        onChange={(value) => handlePropertyUpdate(selectedShape.id, 'fontFamily', value)}
                        options={[
                          { value: 'Arial, sans-serif', label: 'Arial' },
                          { value: 'Helvetica, sans-serif', label: 'Helvetica' },
                          { value: 'Times New Roman, serif', label: 'Times New Roman' },
                          { value: 'Georgia, serif', label: 'Georgia' },
                          { value: 'Courier New, monospace', label: 'Courier New' },
                          { value: 'Verdana, sans-serif', label: 'Verdana' },
                          { value: 'Comic Sans MS, cursive', label: 'Comic Sans MS' },
                          { value: 'Impact, sans-serif', label: 'Impact' },
                        ]}
                      />
                      
                      <SelectInput
                        label="Font Style"
                        value={selectedShape.fontStyle || 'normal'}
                        onChange={(value) => handlePropertyUpdate(selectedShape.id, 'fontStyle', value)}
                        options={[
                          { value: 'normal', label: 'Normal' },
                          { value: 'italic', label: 'Italic' },
                          { value: 'bold', label: 'Bold' },
                          { value: 'italic bold', label: 'Bold Italic' },
                        ]}
                      />
                      
                      <SelectInput
                        label="Text Align"
                        value={selectedShape.textAlign || 'left'}
                        onChange={(value) => handlePropertyUpdate(selectedShape.id, 'textAlign', value)}
                        options={[
                          { value: 'left', label: 'Left' },
                          { value: 'center', label: 'Center' },
                          { value: 'right', label: 'Right' },
                        ]}
                      />
                    </div>
                  </div>
                )}
                
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

                {/* Transform Section */}
                <div>
                  <div className="text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">
                    Transform
                  </div>
                  <div className="flex gap-2 items-end">
                    {/* Rotation numeric input - left half */}
                    <div className="flex-1">
                      <NumericInput
                        label="Rotation"
                        value={selectedShape.rotation || 0}
                        onChange={(value) => handlePropertyUpdate(selectedShape.id, 'rotation', value)}
                        min={0}
                        max={360}
                        step={1}
                        unit="°"
                      />
                    </div>
                    
                    {/* Rotation slider - right half */}
                    <div className="flex-1">
                      <label className="block text-gray-400 text-xs mb-1">Adjust</label>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        step="1"
                        value={selectedShape.rotation || 0}
                        onChange={(e) => handlePropertyUpdateThrottled(selectedShape.id, 'rotation', parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        style={{
                          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((selectedShape.rotation || 0) / 360) * 100}%, #374151 ${((selectedShape.rotation || 0) / 360) * 100}%, #374151 100%)`
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Appearance Section */}
                <div>
                  <div className="text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">
                    Appearance
                  </div>
                  <div className="space-y-3">
                    <ColorInput
                      label={selectedShape.type === 'text' ? 'Text Color' : 'Fill Color'}
                      value={selectedShape.fill}
                      onChange={(value) => handlePropertyUpdate(selectedShape.id, 'fill', value)}
                    />
                    {selectedShape.type !== 'text' && (
                      <>
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
                      </>
                    )}
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
