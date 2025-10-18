import React, { useRef } from 'react';
import {
  PROPERTIES_PANEL_WIDTH,
  PROPERTIES_PANEL_BACKGROUND,
  PROPERTIES_SECTION_SPACING,
  Z_INDEX_PROPERTIES_TOOLBAR,
  SHAPE_UPDATE_THROTTLE
} from '../../utils/canvas';
import NumericInput from './properties/NumericInput';
import ColorInput from './properties/ColorInput';
import TextInput from './properties/TextInput';
import SelectInput from './properties/SelectInput';
import { 
  TrashIcon, 
  ClipboardDocumentIcon,
  ClipboardIcon,
  QueueListIcon,
  ArrowsPointingInIcon
} from '@heroicons/react/24/outline';

const PropertiesToolbar = ({ selectedShapes = [], shapes = [], shapeManager, canvasState, currentUser, isAIPanelExpanded = true }) => {
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
   * Updates local state immediately but throttles Firebase writes
   */
  const handlePropertyUpdateThrottled = async (shapeId, propertyName, newValue) => {
    if (!shapeManager) return;
    
    // Create a unique key for this shape+property combination
    const throttleKey = `${shapeId}-${propertyName}`;
    
    // Throttle Firebase updates
    const now = Date.now();
    const lastUpdate = propertyThrottleRef.current[throttleKey]?.lastUpdate || 0;
    const timeSinceLastUpdate = now - lastUpdate;
    
    if (timeSinceLastUpdate >= SHAPE_UPDATE_THROTTLE) {
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
        }, SHAPE_UPDATE_THROTTLE - timeSinceLastUpdate)
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
  
  /**
   * Handle fit to content - centers and zooms to show all shapes
   * If no shapes exist, resets to default view (0,0 at 100% zoom)
   * Takes into account the AIPanel width if it's expanded
   */
  const handleFitAll = () => {
    if (!canvasState || !canvasState.stageRef.current) return;
    
    // If no shapes, reset to default view
    if (shapes.length === 0) {
      canvasState.setStageScale(1); // 100% zoom
      canvasState.setStageX(0);
      canvasState.setStageY(0);
      return;
    }
    
    const stage = canvasState.stageRef.current;
    const padding = 100; // Padding around content
    const AI_PANEL_WIDTH = 360; // AIPanel width when expanded
    
    // Calculate bounding box of all shapes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    shapes.forEach(shape => {
      const shapeMinX = shape.x;
      const shapeMinY = shape.y;
      const shapeMaxX = shape.x + (shape.width || 0);
      const shapeMaxY = shape.y + (shape.height || 0);
      
      minX = Math.min(minX, shapeMinX);
      minY = Math.min(minY, shapeMinY);
      maxX = Math.max(maxX, shapeMaxX);
      maxY = Math.max(maxY, shapeMaxY);
    });
    
    // Calculate content dimensions
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    
    // Calculate available viewport (subtract AIPanel width if expanded)
    const viewportWidth = stage.width();
    const viewportHeight = stage.height();
    const availableWidth = isAIPanelExpanded ? viewportWidth - AI_PANEL_WIDTH : viewportWidth;
    const availableHeight = viewportHeight;
    
    // Calculate scale to fit content in available viewport
    const scaleX = (availableWidth - padding * 2) / contentWidth;
    const scaleY = (availableHeight - padding * 2) / contentHeight;
    const newScale = Math.min(scaleX, scaleY, 1); // Don't zoom in beyond 100%
    
    // Calculate position to center content in available space
    // If AIPanel is expanded, center in the space to the right of it
    const contentCenterX = minX + contentWidth / 2;
    const contentCenterY = minY + contentHeight / 2;
    const offsetX = isAIPanelExpanded ? AI_PANEL_WIDTH / 2 : 0; // Offset to account for AIPanel
    const newX = (viewportWidth / 2) + offsetX - contentCenterX * newScale;
    const newY = viewportHeight / 2 - contentCenterY * newScale;
    
    // Apply new scale and position
    canvasState.setStageScale(newScale);
    canvasState.setStageX(newX);
    canvasState.setStageY(newY);
  };
  
  return (
    <div
      className={`${PROPERTIES_PANEL_BACKGROUND} border-l overflow-y-auto flex-shrink-0 flex flex-col`}
      style={{
        width: `${PROPERTIES_PANEL_WIDTH}px`,
        minWidth: `${PROPERTIES_PANEL_WIDTH}px`,
        maxWidth: `${PROPERTIES_PANEL_WIDTH}px`,
        zIndex: Z_INDEX_PROPERTIES_TOOLBAR,
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

          {/* Copy Button */}
          <button
            onClick={() => shapeManager.copySelectedShapes()}
            disabled={!hasSelection}
            className={`group flex items-center justify-center bg-gray-800 border border-gray-700 transition-all ${
              !hasSelection 
                ? 'cursor-default opacity-50' 
                : 'hover:bg-gray-700 hover:border-blue-500 cursor-pointer'
            }`}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
            }}
            title="Copy (⌘C / Ctrl+C)"
          >
            <ClipboardDocumentIcon 
              className={`w-5 h-5 transition-colors ${
                hasSelection ? 'text-gray-300 group-hover:text-blue-400' : 'text-gray-600'
              }`}
              strokeWidth={1.5}
            />
          </button>

          {/* Paste Button */}
          <button
            onClick={() => shapeManager.pasteShapes()}
            disabled={!shapeManager.hasClipboard}
            className={`group flex items-center justify-center bg-gray-800 border border-gray-700 transition-all ${
              !shapeManager.hasClipboard
                ? 'cursor-default opacity-50' 
                : 'hover:bg-gray-700 hover:border-blue-500 cursor-pointer'
            }`}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
            }}
            title="Paste (⌘V / Ctrl+V)"
          >
            <ClipboardIcon 
              className={`w-5 h-5 transition-colors ${
                shapeManager.hasClipboard ? 'text-gray-300 group-hover:text-blue-400' : 'text-gray-600'
              }`}
              strokeWidth={1.5}
            />
          </button>

          {/* Select All Button */}
          <button
            onClick={() => {
              const allShapeIds = shapes.map(s => s.id);
              shapeManager.selectShapes(allShapeIds);
            }}
            disabled={shapes.length === 0}
            className={`group flex items-center justify-center bg-gray-800 border border-gray-700 transition-all ${
              shapes.length === 0
                ? 'cursor-default opacity-50' 
                : 'hover:bg-gray-700 hover:border-blue-500 cursor-pointer'
            }`}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
            }}
            title="Select All (⌘A / Ctrl+A)"
          >
            <QueueListIcon 
              className={`w-5 h-5 transition-colors ${
                shapes.length > 0 ? 'text-gray-300 group-hover:text-blue-400' : 'text-gray-600'
              }`}
              strokeWidth={1.5}
            />
          </button>

          {/* Fit All Button - Always enabled, resets to origin if no shapes */}
          <button
            onClick={handleFitAll}
            className="group flex items-center justify-center bg-gray-800 border border-gray-700 hover:bg-gray-700 hover:border-blue-500 cursor-pointer transition-all"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
            }}
            title={shapes.length > 0 ? "Fit All Shapes" : "Reset View"}
          >
            <ArrowsPointingInIcon 
              className="w-5 h-5 text-gray-300 group-hover:text-blue-400 transition-colors"
              strokeWidth={1.5}
            />
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
                    userId={currentUser?.uid}
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
                      userId={currentUser?.uid}
                    />
                    {selectedShape.type !== 'text' && (
                      <>
                        <ColorInput
                          label="Stroke Color"
                          value={selectedShape.stroke}
                          onChange={(value) => handlePropertyUpdate(selectedShape.id, 'stroke', value)}
                          userId={currentUser?.uid}
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
