"""
CollabCanvas AI Backend - FastAPI Application

This is the main entry point for the backend API that provides AI-powered
canvas manipulation capabilities using LangChain and OpenAI.
"""

import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
import logging

from agents.canvas_agent import execute_canvas_command

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="CollabCanvas AI API",
    description="AI-powered canvas manipulation API using LangChain and OpenAI GPT-4o",
    version="1.0.0",
)

# Get allowed origins from environment
# For development, allow all localhost ports (Vite uses 5170-5189)
if os.getenv("ALLOWED_ORIGINS"):
    allowed_origins = [origin.strip() for origin in os.getenv("ALLOWED_ORIGINS").split(",")]
else:
    # Generate localhost ports 5170-5189 for Vite dev server
    allowed_origins = [f"http://localhost:{port}" for port in range(5170, 5190)]
    # Add common dev ports
    allowed_origins.extend(["http://localhost:3000", "http://localhost:8080"])

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# Pydantic Models
# ============================================================================

class ShapeModel(BaseModel):
    """Model for a canvas shape"""
    id: str
    type: str
    x: float
    y: float
    width: Optional[float] = None
    height: Optional[float] = None
    fill: Optional[str] = None
    rotation: Optional[float] = 0
    stroke: Optional[str] = None
    strokeWidth: Optional[float] = None
    text: Optional[str] = None
    fontSize: Optional[int] = None
    fontFamily: Optional[str] = None
    command: Optional[str] = None  # For command-type responses (move, resize)
    target: Optional[str] = None   # For command-type responses


class AICommandRequest(BaseModel):
    """Request model for AI command execution"""
    command: str = Field(..., description="Natural language command to execute")
    canvas_id: Optional[str] = Field(None, description="ID of the canvas")
    user_id: Optional[str] = Field(None, description="ID of the user making the request")


class AICommandResponse(BaseModel):
    """Response model for AI command execution"""
    success: bool
    message: str
    shapes: List[dict]
    error: Optional[str] = None


# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/")
async def root():
    """Root endpoint - API information"""
    return {
        "name": "CollabCanvas AI API",
        "version": "1.0.0",
        "description": "AI-powered canvas manipulation using LangChain and OpenAI GPT-4o",
        "endpoints": {
            "health": "/health",
            "ai_command": "/api/ai/command",
            "docs": "/docs",
        }
    }


@app.get("/health")
async def health_check():
    """
    Health check endpoint
    
    Returns the health status of the API and whether OpenAI API key is configured.
    """
    openai_key = os.getenv("OPENAI_API_KEY")
    
    return {
        "status": "healthy",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "openai_configured": bool(openai_key and openai_key != "your-openai-api-key-here"),
        "model": "gpt-4o",
    }


@app.post("/api/ai/command", response_model=AICommandResponse)
async def execute_ai_command(request: AICommandRequest):
    """
    Execute an AI command to manipulate the canvas.
    
    This endpoint receives a natural language command and uses the AI agent
    to interpret and execute it, returning the resulting canvas shapes.
    
    Args:
        request: AICommandRequest containing the command and optional context
    
    Returns:
        AICommandResponse with success status, message, and shapes
    
    Raises:
        HTTPException: If OpenAI API key is not configured or execution fails
    """
    # Validate OpenAI API key is configured
    openai_key = os.getenv("OPENAI_API_KEY")
    if not openai_key or openai_key == "your-openai-api-key-here":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OpenAI API key is not configured. Please set OPENAI_API_KEY environment variable."
        )
    
    logger.info(f"Executing AI command: {request.command}")
    
    try:
        # Execute command using the AI agent
        result = execute_canvas_command(
            command=request.command,
            canvas_id=request.canvas_id,
            user_id=request.user_id
        )
        
        logger.info(f"Command executed successfully. Generated {len(result['shapes'])} shape(s)")
        
        return AICommandResponse(**result)
    
    except Exception as e:
        logger.error(f"Error executing command: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to execute command: {str(e)}"
        )


# ============================================================================
# Startup Event
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """
    Startup event handler
    
    Logs configuration and checks API key on startup.
    """
    logger.info("=" * 60)
    logger.info("CollabCanvas AI Backend Starting...")
    logger.info("=" * 60)
    logger.info(f"Environment: {os.getenv('ENVIRONMENT', 'development')}")
    logger.info(f"Port: {os.getenv('PORT', '8000')}")
    logger.info(f"Allowed Origins: {allowed_origins}")
    
    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key and openai_key != "your-openai-api-key-here":
        logger.info("✓ OpenAI API Key: Configured")
    else:
        logger.warning("✗ OpenAI API Key: NOT CONFIGURED - AI features will not work!")
        logger.warning("  Please set OPENAI_API_KEY in your .env file")
    
    logger.info("=" * 60)


# ============================================================================
# Main Entry Point (for local development)
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True,  # Enable auto-reload for development
        log_level="info",
    )

