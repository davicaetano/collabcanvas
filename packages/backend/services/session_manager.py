"""
Session Manager for AI Conversation Memory

Maintains conversation history per session_id to enable contextual conversations.
Uses in-memory storage for simplicity (can be upgraded to Redis for production).
"""

from langchain.memory import ConversationBufferWindowMemory
from typing import Dict
import threading
import time

# Global session storage
_sessions: Dict[str, Dict] = {}
_lock = threading.Lock()

# Session timeout (30 minutes of inactivity)
SESSION_TIMEOUT = 30 * 60


class SessionManager:
    """Manages conversation memory for multiple sessions."""
    
    @staticmethod
    def get_memory(session_id: str, k: int = 6) -> ConversationBufferWindowMemory:
        """
        Get or create memory for a session.
        
        Args:
            session_id: Unique identifier for the session
            k: Number of recent messages to keep in memory (default: 6)
        
        Returns:
            ConversationBufferWindowMemory instance for this session
        """
        with _lock:
            now = time.time()
            
            # Clean up expired sessions
            SessionManager._cleanup_expired_sessions(now)
            
            # Get or create session
            if session_id not in _sessions:
                _sessions[session_id] = {
                    "memory": ConversationBufferWindowMemory(
                        k=k,
                        return_messages=True,
                        memory_key="chat_history",
                        input_key="input",
                        output_key="output"
                    ),
                    "last_access": now
                }
            else:
                # Update last access time
                _sessions[session_id]["last_access"] = now
            
            return _sessions[session_id]["memory"]
    
    @staticmethod
    def clear_session(session_id: str) -> bool:
        """
        Clear memory for a specific session.
        
        Args:
            session_id: Session to clear
        
        Returns:
            True if session was found and cleared, False otherwise
        """
        with _lock:
            if session_id in _sessions:
                del _sessions[session_id]
                return True
            return False
    
    @staticmethod
    def _cleanup_expired_sessions(current_time: float):
        """Remove sessions that haven't been accessed recently."""
        expired = [
            sid for sid, data in _sessions.items()
            if current_time - data["last_access"] > SESSION_TIMEOUT
        ]
        for sid in expired:
            del _sessions[sid]
            print(f"Cleaned up expired session: {sid}")
    
    @staticmethod
    def get_active_sessions_count() -> int:
        """Get count of active sessions."""
        with _lock:
            return len(_sessions)

