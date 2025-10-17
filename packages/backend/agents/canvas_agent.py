"""
Canvas AI Agent using LangChain and OpenAI

This module creates an agent that can interpret natural language commands
and execute canvas operations using the defined tools.
"""

import os
from typing import List, Dict, Any, Optional
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.memory import ConversationBufferWindowMemory

from .tools import ALL_TOOLS
from .prompts import CANVAS_AGENT_SYSTEM_PROMPT, CANVAS_AGENT_INSTRUCTIONS
from services.session_manager import SessionManager


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
    
    # Initialize ChatOpenAI with GPT-4o
    llm = ChatOpenAI(
        model="gpt-4o",
        temperature=0.1,  # Low temperature for more consistent results
        api_key=api_key,
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
    
    # Create agent executor
    agent_executor = AgentExecutor(
        agent=agent,
        tools=ALL_TOOLS,
        verbose=True,  # Enable logging for debugging
        handle_parsing_errors=True,
        max_iterations=10,  # Allow multiple tool calls for complex commands
        return_intermediate_steps=True,  # CRITICAL: Return tool outputs!
        memory=memory,  # Add memory to agent
    )
    
    return agent_executor


def execute_canvas_command(command: str, canvas_id: str = "main-canvas", user_id: str = None, session_id: str = "ai-agent") -> Dict[str, Any]:
    """
    Execute a canvas command and return the resulting shapes.
    
    Args:
        command: Natural language command from user
        canvas_id: ID of the canvas (default: "main-canvas")
        user_id: ID of the user making the request (optional)
        session_id: Session ID of the browser tab (default: "ai-agent")
    
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
        
        # Get or create memory for this session
        memory = SessionManager.get_memory(session_id, k=6)
        
        # Create agent with memory
        agent = create_canvas_agent(memory=memory)
        
        # Execute command
        result = agent.invoke({
            "input": command
        })
        
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
                    # Single shape from tool
                    if "type" in tool_output:
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

