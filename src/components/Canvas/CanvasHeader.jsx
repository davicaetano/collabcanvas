import React from 'react';
import UserPresence from './UserPresence';
import { CurrentUserAvatar } from '../shared/Avatar';

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
    <header className="bg-gray-800 text-white px-4 py-4">
      {/* Main header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">CollabCanvas</h1>
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
              {isAddMode ? 'Click to Place' : 'Add Rectangle'}
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
              {isDeleteMode ? 'Click to Delete' : 'Delete Shape'}
            </button>
            
            <button
              onClick={onDeleteAllShapes}
              disabled={shapesCount === 0}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-4 py-2 rounded text-sm"
              title={shapesCount === 0 ? "No shapes to delete" : `Delete all ${shapesCount} shapes`}
            >
              Clear All
            </button>
            
            <button
              onClick={onAdd500Rectangles}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-sm"
              title="Add 500 rectangles for stress testing"
            >
              Add 500
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <UserPresence onlineUsers={onlineUsers} />
          <div className="flex items-center space-x-2">
            <CurrentUserAvatar user={currentUser} />
            <span className="text-sm">{currentUser?.displayName}</span>
          </div>
          <button
            onClick={onLogout}
            className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
          >
            Sign Out
          </button>
        </div>
      </div>
      
      {/* Second row - contextual options (always present for consistent height) */}
      <div style={{ marginTop: '16px' }}>
        <div 
          style={{
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            backgroundColor: '#374151',
            paddingTop: '10px',
            paddingRight: '10px',
            paddingBottom: '10px',
            paddingLeft: '4px',
            display: 'inline-block',
            minHeight: '20px',
            opacity: (isAddMode || isDeleteMode) ? 1 : 0.3
          }}
        >
          {isAddMode && (
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px', margin: 0, padding: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, padding: 0 }}>
                <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#ffffff', whiteSpace: 'nowrap', margin: 0, padding: 0 }}>Rectangle Options:</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: 0, padding: 0 }}>
                <span style={{ fontSize: '0.875rem', color: '#ffffff', whiteSpace: 'nowrap', margin: 0, padding: 0 }}>Color:</span>
                <div style={{ display: 'flex', gap: '8px', margin: 0, padding: 0 }}>
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
                      className={`color-picker-button w-8 h-8 rounded-full border-2 transition-all flex-shrink-0 ${
                        selectedColor === color.value 
                          ? 'border-black scale-110 shadow-lg' 
                          : 'border-gray-300 hover:border-gray-500 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.value, margin: 0, padding: 0 }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {isDeleteMode && (
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '16px', margin: 0, padding: 0 }}>
              <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#ffffff', whiteSpace: 'nowrap', margin: 0, padding: 0 }}>Delete Mode:</span>
              <span style={{ fontSize: '0.875rem', color: '#ffffff', margin: 0, padding: 0 }}>Click on any shape to delete it</span>
            </div>
          )}
          
          {!isAddMode && !isDeleteMode && (
            <div style={{ height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 0, padding: 0 }}>
              <span style={{ fontSize: '0.875rem', color: '#ffffff', fontStyle: 'italic', margin: 0, padding: 0 }}>Select an action above</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default CanvasHeader;