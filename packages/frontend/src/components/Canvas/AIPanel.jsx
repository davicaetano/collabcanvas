/**
 * AIPanel Component
 * 
 * User interface for interacting with the AI agent to create and manipulate
 * canvas elements using natural language commands.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useAIAgent } from '../../hooks/useAIAgent';

// localStorage key for AI Panel state
const AI_PANEL_STORAGE_KEY = 'collabcanvas-ai-panel';

// Load saved AI Panel state from localStorage
const loadAIPanelState = () => {
  try {
    const saved = localStorage.getItem(AI_PANEL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        isExpanded: parsed.isExpanded !== undefined ? parsed.isExpanded : true,
      };
    }
  } catch (error) {
    console.warn('Failed to load AI Panel state from localStorage:', error);
  }
  return { isExpanded: true };
};

// Save AI Panel state to localStorage
const saveAIPanelState = (isExpanded) => {
  try {
    localStorage.setItem(AI_PANEL_STORAGE_KEY, JSON.stringify({ isExpanded }));
  } catch (error) {
    console.warn('Failed to save AI Panel state to localStorage:', error);
  }
};

const AIPanel = ({ currentUser, canvasId = 'main-canvas', sessionId, onShapesCreated }) => {
  const [command, setCommand] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  
  // Load initial state from localStorage
  const initialState = loadAIPanelState();
  const [isExpanded, setIsExpanded] = useState(initialState.isExpanded);
  
  const inputRef = useRef(null);
  const historyEndRef = useRef(null);
  
  const { executeCommand, isLoading, error, clearError, lastResponse } = useAIAgent(
    canvasId,
    currentUser?.uid,
    sessionId
  );

  // Focus input when panel is expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (historyEndRef.current) {
      historyEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationHistory]);

  // Save AI Panel state to localStorage whenever isExpanded changes
  useEffect(() => {
    saveAIPanelState(isExpanded);
  }, [isExpanded]);

  // Handle command execution
  const handleExecute = async () => {
    if (!command.trim() || isLoading) return;

    const userCommand = command.trim();

    try {
      // Add user message to conversation
      setConversationHistory(prev => [
        ...prev,
        { role: 'user', content: userCommand, timestamp: new Date() }
      ].slice(-12)); // Keep last 12 entries (6 user + 6 AI = 6 exchanges)
      
      // Clear input immediately
      setCommand('');

      // Execute command via AI backend
      const response = await executeCommand(userCommand);
      
      // Add AI response to conversation
      if (response && response.message) {
        setConversationHistory(prev => [
          ...prev,
          { 
            role: 'assistant', 
            content: response.message, 
            success: response.success,
            timestamp: new Date() 
          }
        ].slice(-12)); // Keep last 12 entries
      }
    } catch (err) {
      console.error('Error executing AI command:', err);
      setConversationHistory(prev => [
        ...prev,
        { 
          role: 'assistant', 
          content: `Error: ${err.message}`,
          success: false,
          timestamp: new Date() 
        }
      ].slice(-12));
    }
  };

  // Handle Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleExecute();
    }
  };

  return (
    <div 
      className="fixed left-0 bg-gray-800 border-r border-gray-700 shadow-2xl transition-all duration-300 ease-in-out flex flex-col"
      style={{
        top: '64px', // Start below header
        width: '360px',
        height: isExpanded ? 'calc(100vh - 64px)' : 'auto',
        zIndex: 50,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <h3 className="font-semibold text-white">AI Canvas Agent</h3>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-700 rounded"
          title={isExpanded ? 'Minimize' : 'Expand'}
        >
          {isExpanded ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="flex flex-col flex-1 min-h-0">
          {/* Conversation History */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {conversationHistory.length === 0 ? (
              <div className="text-center text-gray-500 text-sm mt-8">
                <p className="mb-2">👋 Welcome to AI Canvas Agent</p>
                <p className="text-xs">Try: "create a blue rectangle" or "make a 3x3 grid"</p>
              </div>
            ) : (
              <>
                {conversationHistory.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-4 py-2 ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : message.success === false
                          ? 'bg-red-900/30 border border-red-700/50 text-red-200'
                          : 'bg-gray-700 border border-gray-600 text-gray-200'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    </div>
                  </div>
                ))}
                <div ref={historyEndRef} />
              </>
            )}
          </div>

          {/* Input Area (Fixed at bottom) */}
          <div className="border-t border-gray-700 p-4 bg-gray-800 flex-shrink-0">
            <div className="space-y-2">
              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder='e.g., "create a blue rectangle"'
                  disabled={isLoading}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-900 disabled:cursor-not-allowed resize-none"
                />
              </div>
              <button
                onClick={handleExecute}
                disabled={!command.trim() || isLoading}
                className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Processing...</span>
                  </>
                ) : (
                  'Execute'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIPanel;

