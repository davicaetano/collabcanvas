import { useState, useEffect } from 'react';
import { 
  ClockIcon, 
  TrashIcon, 
  ArrowPathIcon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import {
  saveVersionHistory,
  subscribeToVersionHistories,
  deleteVersionHistory,
  restoreVersionHistory,
} from '../../utils/firestore';

/**
 * Version History Modal
 * 
 * Allows users to:
 * - Save current canvas state as a named version
 * - View list of saved versions with name, date, and author
 * - Restore a previous version (with confirmation)
 * - Delete a version
 */
export const VersionHistoryModal = ({ 
  isOpen, 
  onClose, 
  currentUser, 
  shapes, 
  config,
  sessionId,
}) => {
  const [histories, setHistories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Save dialog state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  
  // Confirm dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  
  // Subscribe to version histories
  useEffect(() => {
    if (!isOpen) return;
    
    const unsubscribe = subscribeToVersionHistories((loadedHistories) => {
      setHistories(loadedHistories);
    });
    
    return () => unsubscribe();
  }, [isOpen]);
  
  // Handle save version
  const handleSaveClick = () => {
    setShowSaveDialog(true);
    setSaveName('');
    setError(null);
  };
  
  const handleSaveConfirm = async () => {
    if (!saveName.trim()) {
      setError('Please enter a name for this version');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await saveVersionHistory(
        saveName.trim(),
        currentUser,
        shapes,
        config
      );
      
      setShowSaveDialog(false);
      setSaveName('');
    } catch (err) {
      setError(`Failed to save version: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle restore version
  const handleRestoreClick = (history) => {
    setConfirmAction({
      type: 'restore',
      history,
      message: `Are you sure you want to restore "${history.name}"? This will replace all current shapes and settings.`,
    });
    setShowConfirmDialog(true);
  };
  
  const handleRestoreConfirm = async () => {
    if (!confirmAction || confirmAction.type !== 'restore') return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await restoreVersionHistory(confirmAction.history.id, sessionId);
      setShowConfirmDialog(false);
      setConfirmAction(null);
      onClose(); // Close modal after successful restore
    } catch (err) {
      setError(`Failed to restore version: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle delete version
  const handleDeleteClick = (history) => {
    setConfirmAction({
      type: 'delete',
      history,
      message: `Are you sure you want to delete "${history.name}"? This action cannot be undone.`,
    });
    setShowConfirmDialog(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!confirmAction || confirmAction.type !== 'delete') return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await deleteVersionHistory(confirmAction.history.id);
      setShowConfirmDialog(false);
      setConfirmAction(null);
    } catch (err) {
      setError(`Failed to delete version: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleConfirmCancel = () => {
    setShowConfirmDialog(false);
    setConfirmAction(null);
  };
  
  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };
  
  if (!isOpen) return null;
  
  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-60 z-[1100]"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-[1110] p-4">
        <div 
          className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 w-full max-w-2xl max-h-[80vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <ClockIcon className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">Version History</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          
          {/* Save Button */}
          <div className="p-6 border-b border-gray-700">
            <button
              onClick={handleSaveClick}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              Save Current Version
            </button>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="px-6 pt-4">
              <div className="px-4 py-2 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm">
                {error}
              </div>
            </div>
          )}
          
          {/* History List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {histories.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <ClockIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No saved versions yet</p>
                <p className="text-sm mt-2">Click "Save Current Version" to create your first snapshot</p>
              </div>
            ) : (
              histories.map((history) => (
                <div
                  key={history.id}
                  className="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium truncate">{history.name}</h3>
                      <div className="mt-1 space-y-1 text-sm text-gray-400">
                        <p>Saved: {formatDate(history.savedAt)}</p>
                        <p>By: {history.savedByName || history.savedBy}</p>
                        <p>{history.shapes?.length || 0} shapes</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {/* Restore Button */}
                      <button
                        onClick={() => handleRestoreClick(history)}
                        disabled={isLoading}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                        title="Restore this version"
                      >
                        <ArrowPathIcon className="w-4 h-4" />
                      </button>
                      
                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteClick(history)}
                        disabled={isLoading}
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                        title="Delete this version"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* Save Name Dialog */}
      {showSaveDialog && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-[1120]"
            onClick={() => setShowSaveDialog(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-[1130] p-4">
            <div 
              className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Save Version</h3>
                <p className="text-gray-400 text-sm mb-4">Enter a name for this version:</p>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveConfirm();
                    if (e.key === 'Escape') setShowSaveDialog(false);
                  }}
                  placeholder="e.g., Before major changes"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowSaveDialog(false)}
                    disabled={isLoading}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveConfirm}
                    disabled={isLoading || !saveName.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    {isLoading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Confirmation Dialog */}
      {showConfirmDialog && confirmAction && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-[1120]"
            onClick={handleConfirmCancel}
          />
          <div className="fixed inset-0 flex items-center justify-center z-[1130] p-4">
            <div 
              className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Confirm Action</h3>
                <p className="text-gray-300 text-sm mb-6">{confirmAction.message}</p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleConfirmCancel}
                    disabled={isLoading}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmAction.type === 'restore' ? handleRestoreConfirm : handleDeleteConfirm}
                    disabled={isLoading}
                    className={`px-4 py-2 ${
                      confirmAction.type === 'restore' 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-red-600 hover:bg-red-700'
                    } disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors`}
                  >
                    {isLoading ? 'Processing...' : confirmAction.type === 'restore' ? 'Restore' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

