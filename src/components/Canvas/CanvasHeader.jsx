import React from 'react';
import CanvasToolbar from './CanvasToolbar';
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
  // User props
  currentUser,
  onlineUsers,
  onLogout
}) => {
  return (
    <header className="h-15 bg-gray-800 text-white flex items-center justify-between px-4">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-bold">CollabCanvas</h1>
        <CanvasToolbar
          isAddMode={isAddMode}
          isDeleteMode={isDeleteMode}
          onToggleAddMode={onToggleAddMode}
          onToggleDeleteMode={onToggleDeleteMode}
          onDeleteAllShapes={onDeleteAllShapes}
          onAdd500Rectangles={onAdd500Rectangles}
          shapesCount={shapesCount}
        />
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
    </header>
  );
};

export default CanvasHeader;
