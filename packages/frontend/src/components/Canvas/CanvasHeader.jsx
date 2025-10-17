import React, { useState } from 'react';
import UserPresence from './UserPresence';
import ConnectionStatus from './ConnectionStatus';
import { CurrentUserAvatar } from '../shared/Avatar';
import { APP_VERSION } from '../../config';
import { ClockIcon } from '@heroicons/react/24/outline';
import { VersionHistoryModal } from './VersionHistoryModal';

const CanvasHeader = ({ 
  // Toolbar props
  onDeleteAllShapes,
  onAdd500Rectangles,
  shapesCount,
  // User props
  currentUser,
  onlineUsers,
  onLogout,
  // Version History props
  shapes,
  config,
  sessionId,
}) => {
  const isDevMode = import.meta.env.VITE_DEV_MODE === 'true';
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  
  return (
    <header className="bg-gray-800 text-white px-6 py-3">
      {/* Main header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold">CollabCanvas</h1>
            <button
              onClick={() => setIsVersionHistoryOpen(true)}
              className="flex items-center space-x-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 border border-gray-600 hover:border-blue-500 rounded-lg transition-colors text-sm"
              title="Version History"
            >
              <ClockIcon className="w-4 h-4" />
              <span>History</span>
            </button>
          </div>
          {isDevMode && (
            <div className="flex items-center space-x-4">
              <button
                onClick={onDeleteAllShapes}
                disabled={shapesCount === 0}
                className="px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none hover:ring-2 hover:ring-blue-400 hover:ring-opacity-50 disabled:hover:ring-0"
                title={shapesCount === 0 ? "No shapes to delete" : `Delete all ${shapesCount} shapes`}
              >
                Clear All
              </button>
              
              <button
                onClick={onAdd500Rectangles}
                className="px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 bg-blue-600 hover:bg-blue-700 hover:ring-2 hover:ring-blue-400 hover:ring-opacity-50"
                title="Add 500 rectangles for stress testing"
              >
                Add 500
              </button>
              
              <div className="flex items-center px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg">
                <span className="text-xs font-mono text-gray-300">
                  v{APP_VERSION}
                </span>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-6">
          <ConnectionStatus />
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
      
      {/* Version History Modal */}
      <VersionHistoryModal
        isOpen={isVersionHistoryOpen}
        onClose={() => setIsVersionHistoryOpen(false)}
        currentUser={currentUser}
        shapes={shapes}
        config={config}
        sessionId={sessionId}
      />
    </header>
  );
};

export default CanvasHeader;