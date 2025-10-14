import React from 'react';

const CanvasToolbar = ({ 
  isAddMode, 
  isDeleteMode, 
  onToggleAddMode, 
  onToggleDeleteMode, 
  onDeleteAllShapes, 
  shapesCount 
}) => {
  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={onToggleAddMode}
        className={`px-4 py-2 rounded text-sm transition-colors ${
          isAddMode 
            ? 'bg-green-600 hover:bg-green-700' 
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
        title={isAddMode ? "Click on canvas to place rectangle" : "Click to enter add mode"}
      >
        {isAddMode ? '📍 Click to Place' : 'Add Rectangle'}
      </button>
      
      <button
        onClick={onToggleDeleteMode}
        className={`px-4 py-2 rounded text-sm transition-colors ${
          isDeleteMode 
            ? 'bg-red-600 hover:bg-red-700' 
            : 'bg-orange-600 hover:bg-orange-700'
        }`}
        title={isDeleteMode ? "Click on shapes to delete them" : "Click to enter delete mode"}
      >
        {isDeleteMode ? '🗑️ Click to Delete' : 'Delete Shape'}
      </button>
      
      <button
        onClick={onDeleteAllShapes}
        disabled={shapesCount === 0}
        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded text-sm"
        title={shapesCount === 0 ? "No shapes to delete" : `Delete all ${shapesCount} shapes`}
      >
        Clear All
      </button>
    </div>
  );
};

export default CanvasToolbar;
