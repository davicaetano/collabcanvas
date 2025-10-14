import React from 'react';

const ColorPicker = ({ selectedColor, onColorChange }) => {
  const colors = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Green', value: '#10B981' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Orange', value: '#F59E0B' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Teal', value: '#14B8A6' },
    { name: 'Gray', value: '#6B7280' },
  ];

  return (
    <div className="flex items-center space-x-3">
      <span className="text-sm text-gray-600 whitespace-nowrap">Color:</span>
      <div className="flex space-x-2">
        {colors.map((color) => (
          <button
            key={color.value}
            onClick={() => onColorChange(color.value)}
            className={`w-7 h-7 rounded-full border-2 transition-all flex-shrink-0 ${
              selectedColor === color.value 
                ? 'border-gray-800 scale-110 shadow-md' 
                : 'border-gray-300 hover:border-gray-500 hover:scale-105'
            }`}
            style={{ backgroundColor: color.value }}
            title={color.name}
          />
        ))}
      </div>
    </div>
  );
};

const CanvasToolbarSecondRow = ({ 
  isAddMode, 
  isDeleteMode, 
  selectedColor, 
  onColorChange 
}) => {
  return (
    <div className="h-[60px] flex items-center">
      <div className={`w-full p-3 rounded-lg transition-opacity duration-200 ${
        (isAddMode || isDeleteMode) 
          ? 'bg-gray-50 border border-gray-200 opacity-100' 
          : 'opacity-0'
      }`}>
        {isAddMode && (
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Rectangle Options:</span>
            </div>
            <ColorPicker selectedColor={selectedColor} onColorChange={onColorChange} />
          </div>
        )}
        
        {isDeleteMode && (
          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Delete Mode:</span>
            <span className="text-sm text-gray-600">Click on any shape to delete it</span>
          </div>
        )}
        
        {!isAddMode && !isDeleteMode && (
          <div className="h-8"></div>
        )}
      </div>
    </div>
  );
};

export default CanvasToolbarSecondRow;
