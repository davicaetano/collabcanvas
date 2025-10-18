"""
Canvas AI Agent using LangChain and OpenAI

This module creates an agent that can interpret natural language commands
and execute canvas operations using the defined tools.

Features:
- Singleton agent initialized at startup (zero latency first call)
- Background health check every 10 minutes
- Automatic recreation if agent fails
- Dedicated monitoring log
"""

import os
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.memory import ConversationBufferWindowMemory

from .tools import ALL_TOOLS
from .prompts import CANVAS_AGENT_SYSTEM_PROMPT, CANVAS_AGENT_INSTRUCTIONS
from services.session_manager import SessionManager

# Configure dedicated logger for agent health monitoring
agent_health_logger = logging.getLogger("agent_health")
agent_health_logger.setLevel(logging.INFO)
agent_health_handler = logging.FileHandler("agent_health.log")
agent_health_handler.setFormatter(
    logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
)
agent_health_logger.addHandler(agent_health_handler)

# Global singleton agent
_global_agent: Optional[AgentExecutor] = None
_agent_creation_count = 0
_last_health_check = None

# Track file modification times for auto-reload
_tools_file_mtime = None
_prompts_file_mtime = None


def create_canvas_agent(memory: Optional[ConversationBufferWindowMemory] = None) -> AgentExecutor:
    """
    Create and configure the canvas AI agent with LangChain and OpenAI.
    
    Args:
        memory: Optional conversation memory for maintaining context
    
    Returns:
        AgentExecutor configured with canvas tools
    """
    # Get API key from environment
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY not found in environment variables")
    
    # Initialize ChatOpenAI with GPT-4o-mini for faster responses
    llm = ChatOpenAI(
        model="gpt-4o-mini",  # Faster and cheaper than gpt-4o
        temperature=0,  # Zero temperature for fastest, most deterministic results
        api_key=api_key,
        max_tokens=16000,  # Allow large batch operations (up to ~500 shapes)
        timeout=60,  # 60 second timeout for large batch operations
    )
    
    # Create prompt template with optional chat history
    prompt_messages = [
        ("system", CANVAS_AGENT_SYSTEM_PROMPT),
    ]
    
    # Add chat history placeholder if memory is provided
    if memory:
        prompt_messages.append(MessagesPlaceholder(variable_name="chat_history"))
    
    prompt_messages.extend([
        ("human", "{input}"),
        MessagesPlaceholder(variable_name="agent_scratchpad"),
    ])
    
    prompt = ChatPromptTemplate.from_messages(prompt_messages)
    
    # Create agent with tools
    agent = create_tool_calling_agent(
        llm=llm,
        tools=ALL_TOOLS,
        prompt=prompt,
    )
    
    # Create agent executor with optimized settings for speed
    agent_executor = AgentExecutor(
        agent=agent,
        tools=ALL_TOOLS,
        verbose=True,  # Enable logging for debugging
        handle_parsing_errors=True,
        max_iterations=30,  # Limit to 30 iterations to force efficient tool usage
        max_execution_time=90,  # 90 second timeout for large batch operations
        early_stopping_method="generate",  # Stop as soon as we have a valid response
        return_intermediate_steps=True,  # CRITICAL: Return tool outputs!
        memory=memory,  # Add memory to agent
    )
    
    return agent_executor


def get_file_mtime(filepath: str) -> float:
    """Get modification time of a file."""
    try:
        return Path(filepath).stat().st_mtime
    except:
        return 0


def check_files_changed() -> bool:
    """
    Check if tools.py or prompts.py have been modified since agent creation.
    
    Returns:
        True if files changed, False otherwise
    """
    global _tools_file_mtime, _prompts_file_mtime
    
    # Get current directory
    current_dir = Path(__file__).parent
    tools_file = current_dir / "tools.py"
    prompts_file = current_dir / "prompts.py"
    
    # Get current modification times
    current_tools_mtime = get_file_mtime(tools_file)
    current_prompts_mtime = get_file_mtime(prompts_file)
    
    # First time - just record times
    if _tools_file_mtime is None:
        _tools_file_mtime = current_tools_mtime
        _prompts_file_mtime = current_prompts_mtime
        return False
    
    # Check if files changed
    tools_changed = current_tools_mtime != _tools_file_mtime
    prompts_changed = current_prompts_mtime != _prompts_file_mtime
    
    if tools_changed or prompts_changed:
        changed_files = []
        if tools_changed:
            changed_files.append("tools.py")
        if prompts_changed:
            changed_files.append("prompts.py")
        
        agent_health_logger.info(
            f"📝 Detected changes in: {', '.join(changed_files)}"
        )
        
        # Update stored times
        _tools_file_mtime = current_tools_mtime
        _prompts_file_mtime = current_prompts_mtime
        
        return True
    
    return False


def initialize_agent(reason: str = "startup") -> AgentExecutor:
    """
    Initialize the global agent singleton.
    Called at startup and by health check if needed.
    
    Args:
        reason: Why the agent is being created (startup, file_change, health_check, etc)
    
    Returns:
        Configured AgentExecutor ready for use
    """
    global _global_agent, _agent_creation_count
    
    _agent_creation_count += 1
    
    agent_health_logger.info(
        f"🚀 Creating agent (creation #{_agent_creation_count}, reason: {reason})"
    )
    
    try:
        # Create agent without memory (memory managed per session)
        _global_agent = create_canvas_agent(memory=None)
        
        # Update file modification times
        check_files_changed()
        
        agent_health_logger.info(
            f"✅ Agent created successfully (creation #{_agent_creation_count})"
        )
        
        return _global_agent
    
    except Exception as e:
        agent_health_logger.error(
            f"❌ Failed to create agent (creation #{_agent_creation_count}): {e}"
        )
        raise


def check_agent_health() -> bool:
    """
    Check if global agent is healthy and ready to use.
    Called by background task every 10 minutes.
    
    Also checks if tools.py or prompts.py changed and recreates if needed.
    
    Returns:
        True if agent is healthy, False if needs recreation
    """
    global _global_agent, _last_health_check
    
    _last_health_check = datetime.now()
    
    # Check if files changed first
    if check_files_changed():
        agent_health_logger.info("🔄 Health check: Recreating agent due to file changes")
        initialize_agent(reason="file_change_health_check")
        return True
    
    if _global_agent is None:
        agent_health_logger.warning(
            "⚠️  Health check FAILED: Agent is None - recreating"
        )
        initialize_agent(reason="health_check_missing")
        return False
    
    try:
        # Basic health check - verify agent has required attributes
        if not hasattr(_global_agent, 'agent') or not hasattr(_global_agent, 'tools'):
            agent_health_logger.warning(
                "⚠️  Health check FAILED: Agent missing attributes - recreating"
            )
            initialize_agent(reason="health_check_invalid")
            return False
        
        agent_health_logger.info(
            f"✅ Health check PASSED (total creations: {_agent_creation_count})"
        )
        return True
    
    except Exception as e:
        agent_health_logger.error(
            f"❌ Health check ERROR: {e} - recreating"
        )
        initialize_agent(reason="health_check_error")
        return False


def get_agent_stats() -> Dict[str, Any]:
    """
    Get statistics about agent health and usage.
    
    Returns:
        Dictionary with agent stats
    """
    return {
        "is_initialized": _global_agent is not None,
        "creation_count": _agent_creation_count,
        "last_health_check": _last_health_check.isoformat() if _last_health_check else None,
    }


def execute_canvas_command(command: str, canvas_id: str = "main-canvas", user_id: str = None, session_id: str = "ai-agent", viewport: Dict[str, float] = None) -> Dict[str, Any]:
    """
    Execute a canvas command and return the resulting shapes.
    
    Args:
        command: Natural language command from user
        canvas_id: ID of the canvas (default: "main-canvas")
        user_id: ID of the user making the request (optional)
        session_id: Session ID of the browser tab (default: "ai-agent")
        viewport: Visible canvas bounds {x_min, y_min, x_max, y_max} (optional)
    
    Returns:
        Dictionary with success status, message, and shapes:
        {
            "success": True/False,
            "message": "Description of what happened",
            "shapes": [list of shape dictionaries],
            "error": "Error message if failed" (optional)
        }
    """
    try:
        print(f"Executing AI command: {command} (session: {session_id})")
        if viewport:
            print(f"Viewport: {viewport}")
        
        # Check if tools.py or prompts.py changed - reload agent if needed
        if check_files_changed():
            agent_health_logger.info("🔄 Recreating agent due to file changes")
            initialize_agent(reason="file_change")
        
        # Use global agent (already initialized at startup)
        # Note: Memory is managed per session but agent is shared
        if _global_agent is None:
            agent_health_logger.warning("⚠️  Agent not initialized during command - initializing now")
            initialize_agent(reason="missing")
        
        agent = _global_agent
        
        # Get or create memory for this session
        memory = SessionManager.get_memory(session_id, k=6)
        
        # Build input with viewport if available
        agent_input = {"input": command}
        if viewport:
            viewport_desc = f"The user's visible canvas area is from ({viewport['x_min']}, {viewport['y_min']}) to ({viewport['x_max']}, {viewport['y_max']}). Create shapes within this visible area when possible."
            agent_input["input"] = f"{viewport_desc}\n\nUser command: {command}"
        
        # Execute command with timeout (20 seconds)
        try:
            with ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(agent.invoke, agent_input)
                result = future.result(timeout=20)
        except FuturesTimeoutError:
            agent_health_logger.error(f"⏱️  Command timed out after 20 seconds: {command}")
            return {
                "success": False,
                "message": "Command took too long to execute (timeout after 20 seconds). This usually happens when the AI tries to process too many operations individually. Please try a simpler command or contact support.",
                "shapes": [],
                "error": "Timeout after 20 seconds"
            }
        
        # Extract shapes from the result
        shapes = extract_shapes_from_result(result)
        
        # Add metadata to shapes
        for shape in shapes:
            if "id" not in shape:
                import uuid
                shape["id"] = str(uuid.uuid4())
            
            # Add metadata
            shape["isAIGenerated"] = True
            if canvas_id:
                shape["canvasId"] = canvas_id
            if user_id:
                shape["createdBy"] = user_id
            if session_id:
                shape["sessionId"] = session_id
        
        # Get the actual AI response message
        ai_message = result.get("output", f"Successfully executed command: {command}")
        
        return {
            "success": True,
            "message": ai_message,
            "shapes": shapes,
        }
    
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error executing command: {error_details}")
        
        return {
            "success": False,
            "message": "Failed to execute command",
            "shapes": [],
            "error": str(e),
        }


def extract_shapes_from_result(result: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Extract shape data from agent execution result.
    
    The agent might return shapes in various ways depending on how tools were called.
    This function normalizes the output.
    
    Args:
        result: Result from agent execution
    
    Returns:
        List of shape dictionaries
    """
    shapes = []
    
    # Check if there's an output in the result
    if "output" in result:
        output = result["output"]
        
        # Try to parse as shape data
        if isinstance(output, dict):
            # Single shape
            if "type" in output:
                shapes.append(output)
        elif isinstance(output, list):
            # Multiple shapes
            for item in output:
                if isinstance(item, dict) and "type" in item:
                    shapes.append(item)
    
    # Also check intermediate_steps for tool outputs
    if "intermediate_steps" in result:
        for step in result["intermediate_steps"]:
            if len(step) >= 2:
                tool_output = step[1]
                
                if isinstance(tool_output, dict):
                    # Check if tool output has a "shapes" array (from batch operations or arrange tools)
                    if "shapes" in tool_output and isinstance(tool_output["shapes"], list):
                        for shape in tool_output["shapes"]:
                            if isinstance(shape, dict) and "type" in shape:
                                shapes.append(shape)
                    # Single shape from tool
                    elif "type" in tool_output:
                        shapes.append(tool_output)
                    # Command (like move, resize) - frontend will handle these
                    elif "command" in tool_output:
                        shapes.append(tool_output)
                
                elif isinstance(tool_output, list):
                    # Multiple shapes from tool (like grid or form)
                    for item in tool_output:
                        if isinstance(item, dict) and "type" in item:
                            # Only add if it's actually a shape (has "type" field)
                            shapes.append(item)
    
    return shapes

