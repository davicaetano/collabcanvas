"""
CollabCanvas AI Backend - FastAPI Application

This is the main entry point for the backend API that provides AI-powered
canvas manipulation capabilities using LangChain and OpenAI.
"""

import os
import asyncio
from typing import List, Optional
from fastapi import FastAPI, HTTPException, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
import logging

from agents.canvas_agent import execute_canvas_command, initialize_agent, check_agent_health, get_agent_stats
from version import __version__, __version_name__

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Log version on startup
logger.info(f"=== CollabCanvas Backend v{__version__} ({__version_name__}) ===")

# Initialize FastAPI app
app = FastAPI(
    title="CollabCanvas AI API",
    description="AI-powered canvas manipulation API using LangChain and OpenAI GPT-4o-mini",
    version=__version__,
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


class ViewportModel(BaseModel):
    """Model for viewport bounds (visible area)"""
    x_min: float = Field(..., description="Left edge of visible area")
    y_min: float = Field(..., description="Top edge of visible area")
    x_max: float = Field(..., description="Right edge of visible area")
    y_max: float = Field(..., description="Bottom edge of visible area")


class AICommandRequest(BaseModel):
    """Request model for AI command execution"""
    command: str = Field(..., description="Natural language command to execute")
    canvas_id: Optional[str] = Field("main-canvas", description="ID of the canvas")
    user_id: Optional[str] = Field(None, description="ID of the user making the request")
    session_id: Optional[str] = Field("ai-agent", description="Session ID of the browser tab")
    viewport: Optional[ViewportModel] = Field(None, description="Visible canvas bounds")


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
        "version": __version__,
        "version_name": __version_name__,
        "description": "AI-powered canvas manipulation using LangChain and OpenAI GPT-4o-mini",
        "endpoints": {
            "health": "/health",
            "version": "/version",
            "agent_health": "/agent/health",
            "ai_command": "/api/ai/command",
            "docs": "/docs",
        }
    }


@app.get("/version")
async def get_version():
    """Get backend version information"""
    return {
        "version": __version__,
        "name": __version_name__,
        "message": f"CollabCanvas Backend v{__version__} ({__version_name__})"
    }


@app.get("/agent/health")
async def get_agent_health():
    """Get AI agent health status and statistics"""
    stats = get_agent_stats()
    return {
        "status": "healthy" if stats["is_initialized"] else "not_initialized",
        **stats
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
        "model": "gpt-4o-mini",
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
        # Convert viewport to dict if present
        viewport_dict = None
        if request.viewport:
            viewport_dict = {
                "x_min": request.viewport.x_min,
                "y_min": request.viewport.y_min,
                "x_max": request.viewport.x_max,
                "y_max": request.viewport.y_max
            }
        
        # Execute command using the AI agent
        result = execute_canvas_command(
            command=request.command,
            canvas_id=request.canvas_id,
            user_id=request.user_id,
            session_id=request.session_id,
            viewport=viewport_dict
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

async def agent_health_monitor():
    """Background task that checks agent health every 10 minutes"""
    while True:
        await asyncio.sleep(600)  # 10 minutes = 600 seconds
        check_agent_health()


@app.on_event("startup")
async def startup_event():
    """
    Startup event handler
    
    Logs configuration, checks API key, and initializes AI agent.
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
    
    # Initialize AI Agent at startup (zero latency on first call)
    logger.info("🤖 Initializing AI Agent...")
    try:
        initialize_agent()
        logger.info("✓ AI Agent: Initialized and ready")
    except Exception as e:
        logger.error(f"✗ AI Agent: Failed to initialize - {e}")
    
    # Start background health check task
    asyncio.create_task(agent_health_monitor())
    logger.info("✓ Agent Health Monitor: Started (10min interval)")
    
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

