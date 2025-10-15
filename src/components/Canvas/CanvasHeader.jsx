import React from 'react';
import UserPresence from './UserPresence';
import { CurrentUserAvatar } from '../shared/Avatar';
import { STATE_UPDATE_DELAY, HEADER_MIN_HEIGHT } from '../../utils/canvas';

const CanvasHeader = ({ 
  // Toolbar props
  isAddMode,
  isDeleteMode,
  onToggleAddMode,
  onToggleDeleteMode,
  onDeleteAllShapes,
  onAdd500Rectangles,
  shapesCount,
  selectedColor,
  onColorChange,
  // User props
  currentUser,
  onlineUsers,
  onLogout
}) => {
  return (
    <header className="bg-gray-800 text-white px-6 py-3">
      {/* Main header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <h1 className="text-xl font-bold">CollabCanvas</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={onToggleAddMode}
              className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 ${
                isAddMode 
                  ? 'bg-green-600 hover:bg-green-700 ring-2 ring-green-400 ring-opacity-50' 
                  : 'bg-blue-600 hover:bg-blue-700 hover:ring-2 hover:ring-blue-400 hover:ring-opacity-50'
              }`}
              title={isAddMode ? "Click on canvas to place rectangle" : "Click to enter add mode"}
            >
              {isAddMode ? 'Click to Place' : 'Add Rectangle'}
            </button>
            
            <button
              onClick={onToggleDeleteMode}
              className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 ${
                isDeleteMode 
                  ? 'bg-green-600 hover:bg-green-700 ring-2 ring-green-400 ring-opacity-50' 
                  : 'bg-blue-600 hover:bg-blue-700 hover:ring-2 hover:ring-blue-400 hover:ring-opacity-50'
              }`}
              title={isDeleteMode ? "Click on shapes to delete them" : "Click to enter delete mode"}
            >
              {isDeleteMode ? 'Click to Delete' : 'Delete Shape'}
            </button>
            
            <button
              onClick={() => {
                // Turn off add mode if active (but keep delete mode since we're deleting)
                if (isAddMode) onToggleAddMode();
                // Then execute the action
                onDeleteAllShapes();
              }}
              disabled={shapesCount === 0}
              className="px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none hover:ring-2 hover:ring-blue-400 hover:ring-opacity-50 disabled:hover:ring-0"
              title={shapesCount === 0 ? "No shapes to delete" : `Delete all ${shapesCount} shapes`}
            >
              Clear All
            </button>
            
            <button
              onClick={async () => {
                // Turn off any active modes first (adding shapes conflicts with both modes)
                if (isAddMode) onToggleAddMode();
                if (isDeleteMode) onToggleDeleteMode();
                // Wait a bit to ensure state is updated
                await new Promise(resolve => setTimeout(resolve, STATE_UPDATE_DELAY));
                // Then execute the action
                onAdd500Rectangles();
              }}
              className="px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 bg-blue-600 hover:bg-blue-700 hover:ring-2 hover:ring-blue-400 hover:ring-opacity-50"
              title="Add 500 rectangles for stress testing"
            >
              Add 500
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-6">
          <UserPresence onlineUsers={onlineUsers} />
          <div className="flex items-center space-x-3 ml-8">
            <CurrentUserAvatar user={currentUser} />
            <span className="text-sm">{currentUser?.displayName}</span>
          </div>
          <button
            onClick={onLogout}
            className="px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 bg-blue-600 hover:bg-blue-700 hover:ring-2 hover:ring-blue-400 hover:ring-opacity-50"
          >
            Sign Out
          </button>
        </div>
      </div>
      
      {/* Second row - contextual options (always reserve space for consistent height) */}
      <div className={`mt-4 min-h-[${HEADER_MIN_HEIGHT}px]`}>
        {(isAddMode || isDeleteMode) && (
          <div className="inline-block border border-gray-300 rounded-lg bg-gray-700 p-3">
            {isAddMode && (
              <div className="flex flex-row items-center gap-4 h-6">
                <span className="text-sm font-medium text-white whitespace-nowrap">Rectangle Options:</span>
                <span className="text-sm text-white whitespace-nowrap">Color:</span>
                <div className="flex gap-2">
                  {[
                    { name: 'Blue', value: '#3B82F6' },
                    { name: 'Red', value: '#EF4444' },
                    { name: 'Green', value: '#10B981' },
                    { name: 'Purple', value: '#8B5CF6' },
                    { name: 'Orange', value: '#F59E0B' },
                    { name: 'Pink', value: '#EC4899' },
                    { name: 'Teal', value: '#14B8A6' },
                    { name: 'Gray', value: '#6B7280' },
                  ].map((color) => (
                    <button
                      key={color.value}
                      onClick={() => onColorChange(color.value)}
                      className={`w-6 h-6 rounded-full border-2 transition-all flex-shrink-0 ${
                        selectedColor === color.value 
                          ? 'border-black scale-110 shadow-lg' 
                          : 'border-gray-300 hover:border-gray-500 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {isDeleteMode && (
              <div className="flex flex-row items-center gap-4 h-6">
                <span className="text-sm font-medium text-white whitespace-nowrap">Delete Mode:</span>
                <span className="text-sm text-white">Click on any shape to delete it</span>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default CanvasHeader;