/**
 * useAIAgent Hook
 * 
 * Custom hook for interacting with the AI backend to execute canvas commands.
 * Handles API communication, loading states, and error handling.
 */

import { useState, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_AI_BACKEND_URL || 'http://localhost:8000';

/**
 * Hook for AI agent functionality
 * 
 * @param {string} canvasId - ID of the current canvas
 * @param {string} userId - ID of the current user
 * @param {string} sessionId - Session ID of the browser tab
 * @returns {Object} AI agent state and methods
 */
export const useAIAgent = (canvasId, userId, sessionId) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastResponse, setLastResponse] = useState(null);

  /**
   * Execute an AI command
   * 
   * @param {string} command - Natural language command to execute
   * @param {Object} viewport - Optional viewport bounds {x_min, y_min, x_max, y_max}
   * @returns {Promise<Object>} Response with shapes
   */
  const executeCommand = useCallback(async (command, viewport = null) => {
    if (!command || command.trim().length === 0) {
      setError('Please enter a command');
      return null;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const requestBody = {
        command: command.trim(),
        canvas_id: canvasId,
        user_id: userId,
        session_id: sessionId,
      };

      // Add viewport if provided
      if (viewport) {
        requestBody.viewport = viewport;
      }

      const response = await fetch(`${API_BASE_URL}/api/ai/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Command execution failed');
      }

      setLastResponse(data);
      setError(null);
      
      return data;
    } catch (err) {
      setError(err.message || 'Failed to execute command');
      setLastResponse(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [canvasId, userId, sessionId]);

  /**
   * Check backend health
   * 
   * @returns {Promise<Object>} Health status
   */
  const checkHealth = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      return null;
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    executeCommand,
    checkHealth,
    clearError,
    isLoading,
    error,
    lastResponse,
  };
};

