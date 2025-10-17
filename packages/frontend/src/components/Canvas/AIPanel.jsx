/**
 * AIPanel Component
 * 
 * User interface for interacting with the AI agent to create and manipulate
 * canvas elements using natural language commands.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useAIAgent } from '../../hooks/useAIAgent';
import { saveAIShapesToFirestore } from '../../utils/aiFirestore';

// Example commands to help users get started
const EXAMPLE_COMMANDS = [
  { label: 'Blue Rectangle', command: 'create a blue rectangle' },
  { label: 'Red Circle', command: 'create a red circle at 400, 300' },
  { label: 'Hello Text', command: 'add text that says "Hello World"' },
  { label: '3x3 Grid', command: 'create a 3x3 grid of squares' },
  { label: 'Login Form', command: 'create a login form' },
  { label: 'Big Green Square', command: 'make a big green square' },
];

const AIPanel = ({ currentUser, canvasId = 'main-canvas', onShapesCreated }) => {
  const [command, setCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const inputRef = useRef(null);
  
  const { executeCommand, isLoading, error, clearError, lastResponse } = useAIAgent(
    canvasId,
    currentUser?.uid
  );

  // Focus input when panel is expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  // Handle command execution
  const handleExecute = async () => {
    if (!command.trim() || isLoading) return;

    try {
      // Execute command via AI backend
      const response = await executeCommand(command);
      
      if (response && response.success && response.shapes.length > 0) {
        // Save shapes to Firestore
        await saveAIShapesToFirestore(canvasId, currentUser?.uid, response.shapes);
        
        // Add to history
        setCommandHistory(prev => [
          { command, success: true, shapesCount: response.shapes.length, timestamp: new Date() },
          ...prev.slice(0, 9) // Keep last 10
        ]);
        
        // Callback for parent component
        if (onShapesCreated) {
          onShapesCreated(response.shapes);
        }
        
        // Clear input
        setCommand('');
      } else {
        // Command failed
        setCommandHistory(prev => [
          { command, success: false, error: response?.error || 'Unknown error', timestamp: new Date() },
          ...prev.slice(0, 9)
        ]);
      }
    } catch (err) {
      console.error('Error executing AI command:', err);
      setCommandHistory(prev => [
        { command, success: false, error: err.message, timestamp: new Date() },
        ...prev.slice(0, 9)
      ]);
    }
  };

  // Handle Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleExecute();
    }
  };

  // Handle example command click
  const handleExampleClick = (exampleCommand) => {
    setCommand(exampleCommand);
    inputRef.current?.focus();
  };

  return (
    <div className="absolute bottom-6 left-6 z-50 w-96 bg-white rounded-lg shadow-2xl border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
          <h3 className="font-semibold text-gray-800">AI Canvas Agent</h3>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-500 hover:text-gray-700 transition-colors"
          title={isExpanded ? 'Minimize' : 'Expand'}
        >
          {isExpanded ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          )}
        </button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Command Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Enter your command:
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder='e.g., "create a blue rectangle"'
                disabled={isLoading}
                className="w-full px-4 py-2 pr-24 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleExecute}
                disabled={!command.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>...</span>
                  </span>
                ) : (
                  'Execute'
                )}
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">Error</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
                <button
                  onClick={clearError}
                  className="text-red-600 hover:text-red-800"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Success Feedback */}
          {lastResponse && lastResponse.success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-green-800">
                  Created {lastResponse.shapes.length} shape(s)
                </p>
              </div>
            </div>
          )}

          {/* Example Commands */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Try these examples:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {EXAMPLE_COMMANDS.map((example, index) => (
                <button
                  key={index}
                  onClick={() => handleExampleClick(example.command)}
                  disabled={isLoading}
                  className="px-3 py-2 text-sm text-left bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-300 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={example.command}
                >
                  {example.label}
                </button>
              ))}
            </div>
          </div>

          {/* Command History */}
          {commandHistory.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Recent commands:
              </label>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {commandHistory.map((item, index) => (
                  <div
                    key={index}
                    className={`text-xs p-2 rounded ${
                      item.success
                        ? 'bg-green-50 text-green-800'
                        : 'bg-red-50 text-red-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {item.success ? (
                        <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className="flex-1 truncate">{item.command}</span>
                      {item.success && (
                        <span className="text-[10px]">({item.shapesCount})</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info */}
          <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
            💡 Tip: Press Enter to execute, Shift+Enter for new line
          </div>
        </div>
      )}
    </div>
  );
};

export default AIPanel;

