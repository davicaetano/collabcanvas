"""
LangChain Tools for Canvas Manipulation

These tools allow the AI agent to create and manipulate shapes on the canvas.
Each tool returns a dictionary representing a canvas shape that will be sent to the frontend.
"""

from langchain.tools import tool
from typing import Optional, List, Dict, Any
import uuid
import random


# Color mapping for natural language to hex colors
COLOR_MAP = {
    "red": "#FF0000",
    "blue": "#0000FF",
    "green": "#00FF00",
    "yellow": "#FFFF00",
    "purple": "#800080",
    "pink": "#FFC0CB",
    "orange": "#FFA500",
    "black": "#000000",
    "white": "#FFFFFF",
    "gray": "#808080",
    "grey": "#808080",
    "brown": "#A52A2A",
    "cyan": "#00FFFF",
    "magenta": "#FF00FF",
}


def generate_shape_id() -> str:
    """Generate a unique ID for a shape"""
    return str(uuid.uuid4())


def normalize_color(color: str) -> str:
    """Convert color name to hex, or return hex if already provided"""
    color_lower = color.lower().strip()
    return COLOR_MAP.get(color_lower, color)


@tool
def create_shape(
    shape_type: str,
    x: float,
    y: float,
    width: float = 100,
    height: float = 100,
    color: str = "blue",
    rotation: float = 0
) -> Dict[str, Any]:
    """
    Create a shape on the canvas.
    
    Args:
        shape_type: Type of shape - "rectangle" or "circle"
        x: X position on canvas (center point)
        y: Y position on canvas (center point)
        width: Width of the shape in pixels (default: 100)
        height: Height of the shape in pixels (default: 100, for circle this is diameter)
        color: Color of the shape (name like "red" or hex like "#FF0000")
        rotation: Rotation angle in degrees (default: 0)
    
    Returns:
        Dictionary representing the shape
    """
    shape_type_lower = shape_type.lower()
    
    # Validate shape type
    if shape_type_lower not in ["rectangle", "circle"]:
        shape_type_lower = "rectangle"
    
    # Normalize color
    fill_color = normalize_color(color)
    
    # Create shape object
    shape = {
        "id": generate_shape_id(),
        "type": shape_type_lower,
        "x": float(x),
        "y": float(y),
        "width": float(width),
        "height": float(height) if shape_type_lower == "rectangle" else float(width),  # Circle uses width as diameter
        "fill": fill_color,
        "rotation": float(rotation),
        "stroke": "#000000",
        "strokeWidth": 2,
    }
    
    return shape


@tool
def create_text(
    text: str,
    x: float,
    y: float,
    font_size: int = 16,
    color: str = "black",
    font_family: str = "Arial"
) -> Dict[str, Any]:
    """
    Create a text element on the canvas.
    
    Args:
        text: The text content to display
        x: X position on canvas
        y: Y position on canvas
        font_size: Size of the font in pixels (default: 16)
        color: Color of the text (name like "black" or hex like "#000000")
        font_family: Font family name (default: "Arial")
    
    Returns:
        Dictionary representing the text element
    """
    fill_color = normalize_color(color)
    
    text_shape = {
        "id": generate_shape_id(),
        "type": "text",
        "x": float(x),
        "y": float(y),
        "text": str(text),
        "fontSize": int(font_size),
        "fontFamily": font_family,
        "fill": fill_color,
        "width": len(text) * font_size * 0.6,  # Approximate width
        "height": font_size * 1.2,  # Approximate height
    }
    
    return text_shape


@tool
def move_shape(
    shape_reference: str,
    new_x: float,
    new_y: float
) -> Dict[str, Any]:
    """
    Move a shape to a new position.
    Note: This returns a command to move a shape. The frontend will need to identify and move the shape.
    
    Args:
        shape_reference: Description of which shape to move (e.g., "blue rectangle", "the circle", "text")
        new_x: New X position
        new_y: New Y position
    
    Returns:
        Dictionary representing the move command
    """
    return {
        "command": "move",
        "target": shape_reference,
        "x": float(new_x),
        "y": float(new_y),
    }


@tool
def resize_shape(
    shape_reference: str,
    new_width: float,
    new_height: Optional[float] = None
) -> Dict[str, Any]:
    """
    Resize a shape to new dimensions.
    
    Args:
        shape_reference: Description of which shape to resize (e.g., "blue rectangle", "the circle")
        new_width: New width in pixels
        new_height: New height in pixels (optional, defaults to new_width for circles)
    
    Returns:
        Dictionary representing the resize command
    """
    if new_height is None:
        new_height = new_width
    
    return {
        "command": "resize",
        "target": shape_reference,
        "width": float(new_width),
        "height": float(new_height),
    }


@tool
def create_grid(
    rows: int,
    cols: int,
    cell_width: float = 80,
    cell_height: float = 80,
    start_x: float = 100,
    start_y: float = 100,
    spacing: float = 20,
    color: str = "blue"
) -> List[Dict[str, Any]]:
    """
    Create a grid of rectangles on the canvas.
    
    Args:
        rows: Number of rows in the grid
        cols: Number of columns in the grid
        cell_width: Width of each cell (default: 80)
        cell_height: Height of each cell (default: 80)
        start_x: Starting X position (default: 100)
        start_y: Starting Y position (default: 100)
        spacing: Space between cells (default: 20)
        color: Color of the cells (default: "blue")
    
    Returns:
        List of shape dictionaries representing the grid
    """
    shapes = []
    fill_color = normalize_color(color)
    
    for row in range(rows):
        for col in range(cols):
            x = start_x + col * (cell_width + spacing)
            y = start_y + row * (cell_height + spacing)
            
            shape = {
                "id": generate_shape_id(),
                "type": "rectangle",
                "x": float(x),
                "y": float(y),
                "width": float(cell_width),
                "height": float(cell_height),
                "fill": fill_color,
                "rotation": 0,
                "stroke": "#000000",
                "strokeWidth": 2,
            }
            shapes.append(shape)
    
    return shapes


@tool
def create_form(
    form_type: str = "login",
    x: float = 200,
    y: float = 150
) -> List[Dict[str, Any]]:
    """
    Create a form with multiple elements (complex command).
    
    Args:
        form_type: Type of form to create - "login", "signup", or "contact" (default: "login")
        x: Starting X position for the form (default: 200)
        y: Starting Y position for the form (default: 150)
    
    Returns:
        List of shape dictionaries representing the form elements
    """
    shapes = []
    form_type_lower = form_type.lower()
    
    if form_type_lower == "login":
        # Title
        shapes.append({
            "id": generate_shape_id(),
            "type": "text",
            "x": float(x),
            "y": float(y),
            "text": "Login",
            "fontSize": 24,
            "fontFamily": "Arial",
            "fill": "#000000",
            "width": 100,
            "height": 30,
        })
        
        # Username label
        shapes.append({
            "id": generate_shape_id(),
            "type": "text",
            "x": float(x),
            "y": float(y + 50),
            "text": "Username:",
            "fontSize": 14,
            "fontFamily": "Arial",
            "fill": "#333333",
            "width": 100,
            "height": 20,
        })
        
        # Username field
        shapes.append({
            "id": generate_shape_id(),
            "type": "rectangle",
            "x": float(x),
            "y": float(y + 75),
            "width": 250,
            "height": 40,
            "fill": "#FFFFFF",
            "rotation": 0,
            "stroke": "#CCCCCC",
            "strokeWidth": 2,
        })
        
        # Password label
        shapes.append({
            "id": generate_shape_id(),
            "type": "text",
            "x": float(x),
            "y": float(y + 130),
            "text": "Password:",
            "fontSize": 14,
            "fontFamily": "Arial",
            "fill": "#333333",
            "width": 100,
            "height": 20,
        })
        
        # Password field
        shapes.append({
            "id": generate_shape_id(),
            "type": "rectangle",
            "x": float(x),
            "y": float(y + 155),
            "width": 250,
            "height": 40,
            "fill": "#FFFFFF",
            "rotation": 0,
            "stroke": "#CCCCCC",
            "strokeWidth": 2,
        })
        
        # Submit button
        shapes.append({
            "id": generate_shape_id(),
            "type": "rectangle",
            "x": float(x),
            "y": float(y + 215),
            "width": 250,
            "height": 45,
            "fill": "#007BFF",
            "rotation": 0,
            "stroke": "#0056b3",
            "strokeWidth": 2,
        })
        
        # Button text
        shapes.append({
            "id": generate_shape_id(),
            "type": "text",
            "x": float(x + 85),
            "y": float(y + 227),
            "text": "Login",
            "fontSize": 16,
            "fontFamily": "Arial",
            "fill": "#FFFFFF",
            "width": 80,
            "height": 20,
        })
    
    return shapes


# Export all tools
ALL_TOOLS = [
    create_shape,
    create_text,
    move_shape,
    resize_shape,
    create_grid,
    create_form,
]

