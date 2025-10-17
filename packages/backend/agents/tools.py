"""
LangChain Tools for Canvas Manipulation

These tools allow the AI agent to create and manipulate shapes on the canvas.
Each tool returns a dictionary representing a canvas shape that will be sent to the frontend.
"""

from langchain.tools import tool
from typing import Optional, List, Dict, Any
import uuid
import random

# Import Firebase service for all shape operations
from services.firebase_service import (
    get_all_shapes,
    create_shape as create_shape_in_firestore,
    create_shapes_batch as create_shapes_batch_in_firestore,
    update_shape as update_shape_in_firestore,
    delete_shape as delete_shape_from_firestore,
    shapes_to_simple_format
)


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


# ==================== READ OPERATIONS ====================

@tool
def get_canvas_shapes(canvas_id: str = "main-canvas") -> List[Dict[str, Any]]:
    """
    Get all shapes currently on the canvas.
    
    **IMPORTANT**: Use this tool FIRST when you need to manipulate existing shapes!
    This allows you to see what's on the canvas and get the IDs of shapes you want to modify.
    
    Args:
        canvas_id: ID of the canvas to query (default: "main-canvas")
    
    Returns:
        List of shape dictionaries with properties:
        - id: unique identifier (use this for move_shape, resize_shape, etc.)
        - type: "rectangle", "circle", or "text"
        - x, y: position coordinates (center point)
        - width, height: dimensions in pixels
        - fill: color in hex format (e.g., "#0000FF" for blue)
        - rotation: rotation angle in degrees
        - text: text content (only for text type)
        - fontSize: font size (only for text type)
    
    Example output:
    [
        {
            "id": "abc-123-def-456",
            "type": "rectangle",
            "x": 200,
            "y": 150,
            "width": 100,
            "height": 80,
            "fill": "#0000FF",  # Blue
            "rotation": 0
        },
        {
            "id": "xyz-789-uvw-012",
            "type": "circle",
            "x": 400,
            "y": 300,
            "width": 60,
            "height": 60,
            "fill": "#FF0000",  # Red
            "rotation": 0
        }
    ]
    
    Usage example:
        # User asks: "move the blue rectangle to the right"
        # Step 1: Get all shapes to find the blue rectangle
        shapes = get_canvas_shapes()
        # Step 2: Find the blue rectangle
        blue_rect = [s for s in shapes if s['type']=='rectangle' and s['fill']=='#0000FF'][0]
        # Step 3: Move it using its ID
        move_shape(shape_id=blue_rect['id'], new_x=blue_rect['x']+150, new_y=blue_rect['y'])
    """
    try:
        # Fetch all shapes from Firestore
        shapes = get_all_shapes(canvas_id)
        
        # Convert to simplified format for the agent
        simplified_shapes = shapes_to_simple_format(shapes)
        
        return simplified_shapes
    
    except Exception as e:
        print(f"Error fetching canvas shapes: {e}")
        return []


# ==================== CREATE OPERATIONS ====================

@tool
def create_shape(
    shape_type: str,
    x: float,
    y: float,
    width: float = 100,
    height: float = 100,
    color: str = "blue",
    rotation: float = 0,
    canvas_id: str = "main-canvas"
) -> Dict[str, Any]:
    """
    Create a shape on the canvas and save it to Firebase.
    
    Args:
        shape_type: Type of shape - "rectangle" or "circle"
        x: X position on canvas (center point)
        y: Y position on canvas (center point)
        width: Width of the shape in pixels (default: 100)
        height: Height of the shape in pixels (default: 100, for circle this is diameter)
        color: Color of the shape (name like "red" or hex like "#FF0000")
        rotation: Rotation angle in degrees (default: 0)
        canvas_id: ID of the canvas (default: "main-canvas")
    
    Returns:
        Dictionary with success status and message
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
    
    # Save to Firebase
    try:
        success = create_shape_in_firestore(
            shape=shape,
            canvas_id=canvas_id,
            session_id="ai-agent"
        )
        
        if success:
            return {
                "success": True,
                "message": f"Created {shape_type_lower} at position ({x}, {y})",
                "shape_id": shape["id"]
            }
        else:
            return {
                "success": False,
                "message": f"Failed to create {shape_type_lower}",
            }
    except Exception as e:
        return {
            "success": False,
            "message": f"Error creating shape: {str(e)}",
        }


@tool
def create_text(
    text: str,
    x: float,
    y: float,
    font_size: int = 16,
    color: str = "black",
    font_family: str = "Arial",
    canvas_id: str = "main-canvas"
) -> Dict[str, Any]:
    """
    Create a text element on the canvas and save it to Firebase.
    
    Args:
        text: The text content to display
        x: X position on canvas
        y: Y position on canvas
        font_size: Size of the font in pixels (default: 16)
        color: Color of the text (name like "black" or hex like "#000000")
        font_family: Font family name (default: "Arial")
        canvas_id: ID of the canvas (default: "main-canvas")
    
    Returns:
        Dictionary with success status and message
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
    
    # Save to Firebase
    try:
        success = create_shape_in_firestore(
            shape=text_shape,
            canvas_id=canvas_id,
            session_id="ai-agent"
        )
        
        if success:
            return {
                "success": True,
                "message": f"Created text '{text}' at position ({x}, {y})",
                "shape_id": text_shape["id"]
            }
        else:
            return {
                "success": False,
                "message": f"Failed to create text",
            }
    except Exception as e:
        return {
            "success": False,
            "message": f"Error creating text: {str(e)}",
        }


# ==================== MANIPULATION OPERATIONS ====================

@tool
def move_shape(
    shape_id: str,
    new_x: float,
    new_y: float,
    canvas_id: str = "main-canvas"
) -> Dict[str, Any]:
    """
    Move a shape to a new position by its ID.
    
    **IMPORTANT**: First call get_canvas_shapes() to find the shape ID!
    
    Args:
        shape_id: The unique ID of the shape to move (get this from get_canvas_shapes)
        new_x: New X position (center point)
        new_y: New Y position (center point)
        canvas_id: ID of the canvas (default: "main-canvas")
    
    Returns:
        Dictionary with success status and message
    
    Example:
        # User: "move the blue rectangle to the right"
        # Step 1: Get shapes to find the ID
        shapes = get_canvas_shapes()
        # Step 2: Find the blue rectangle
        blue_rect = [s for s in shapes if s['type']=='rectangle' and s['fill']=='#0000FF'][0]
        # Step 3: Calculate new position (move right = increase x)
        new_x = blue_rect['x'] + 150  # Move 150 pixels right
        # Step 4: Move it
        move_shape(shape_id=blue_rect['id'], new_x=new_x, new_y=blue_rect['y'])
    """
    try:
        # Update shape position in Firestore
        success = update_shape_in_firestore(
            shape_id=shape_id,
            updates={
                'x': float(new_x),
                'y': float(new_y)
            },
            canvas_id=canvas_id,
            session_id="ai-agent"
        )
        
        if success:
            return {
                "success": True,
                "message": f"Moved shape {shape_id} to position ({new_x}, {new_y})",
                "shape_id": shape_id,
                "x": new_x,
                "y": new_y
            }
        else:
            return {
                "success": False,
                "message": f"Failed to move shape {shape_id}. It may not exist on the canvas.",
                "shape_id": shape_id
            }
    
    except Exception as e:
        return {
            "success": False,
            "message": f"Error moving shape: {str(e)}",
            "shape_id": shape_id
        }


@tool
def resize_shape(
    shape_id: str,
    new_width: float,
    new_height: Optional[float] = None,
    canvas_id: str = "main-canvas"
) -> Dict[str, Any]:
    """
    Resize a shape to new dimensions by its ID.
    
    **IMPORTANT**: First call get_canvas_shapes() to find the shape ID!
    
    Args:
        shape_id: The unique ID of the shape to resize (get this from get_canvas_shapes)
        new_width: New width in pixels
        new_height: New height in pixels (optional, defaults to new_width for circles)
        canvas_id: ID of the canvas (default: "main-canvas")
    
    Returns:
        Dictionary with success status and message
    
    Example:
        # User: "make the red circle bigger"
        # Step 1: Get shapes
        shapes = get_canvas_shapes()
        # Step 2: Find the red circle
        red_circle = [s for s in shapes if s['type']=='circle' and s['fill']=='#FF0000'][0]
        # Step 3: Calculate new size (1.5x bigger)
        new_size = red_circle['width'] * 1.5
        # Step 4: Resize it
        resize_shape(shape_id=red_circle['id'], new_width=new_size, new_height=new_size)
    """
    if new_height is None:
        new_height = new_width
    
    try:
        success = update_shape_in_firestore(
            shape_id=shape_id,
            updates={
                'width': float(new_width),
                'height': float(new_height)
            },
            canvas_id=canvas_id,
            session_id="ai-agent"
        )
        
        if success:
            return {
                "success": True,
                "message": f"Resized shape {shape_id} to {new_width}x{new_height}",
                "shape_id": shape_id,
                "width": new_width,
                "height": new_height
            }
        else:
            return {
                "success": False,
                "message": f"Failed to resize shape {shape_id}. It may not exist on the canvas.",
                "shape_id": shape_id
            }
    
    except Exception as e:
        return {
            "success": False,
            "message": f"Error resizing shape: {str(e)}",
            "shape_id": shape_id
        }


@tool
def change_shape_color(
    shape_id: str,
    new_color: str,
    canvas_id: str = "main-canvas"
) -> Dict[str, Any]:
    """
    Change the color of a shape by its ID.
    
    **IMPORTANT**: First call get_canvas_shapes() to find the shape ID!
    
    Args:
        shape_id: The unique ID of the shape (get this from get_canvas_shapes)
        new_color: New color (name like "red" or hex like "#FF0000")
        canvas_id: ID of the canvas (default: "main-canvas")
    
    Returns:
        Dictionary with success status and message
    
    Example:
        # User: "change the blue rectangle to red"
        # Step 1: Get shapes
        shapes = get_canvas_shapes()
        # Step 2: Find the blue rectangle
        blue_rect = [s for s in shapes if s['type']=='rectangle' and s['fill']=='#0000FF'][0]
        # Step 3: Change its color
        change_shape_color(shape_id=blue_rect['id'], new_color="red")
    """
    # Normalize color (convert name to hex)
    fill_color = normalize_color(new_color)
    
    try:
        success = update_shape_in_firestore(
            shape_id=shape_id,
            updates={'fill': fill_color},
            canvas_id=canvas_id,
            session_id="ai-agent"
        )
        
        if success:
            return {
                "success": True,
                "message": f"Changed color of shape {shape_id} to {fill_color}",
                "shape_id": shape_id,
                "fill": fill_color
            }
        else:
            return {
                "success": False,
                "message": f"Failed to change color of shape {shape_id}. It may not exist on the canvas.",
                "shape_id": shape_id
            }
    
    except Exception as e:
        return {
            "success": False,
            "message": f"Error changing color: {str(e)}",
            "shape_id": shape_id
        }


@tool
def delete_shape_by_id(
    shape_id: str,
    canvas_id: str = "main-canvas"
) -> Dict[str, Any]:
    """
    Delete a shape from the canvas by its ID.
    
    **IMPORTANT**: First call get_canvas_shapes() to find the shape ID!
    
    Args:
        shape_id: The unique ID of the shape to delete
        canvas_id: ID of the canvas (default: "main-canvas")
    
    Returns:
        Dictionary with success status and message
    
    Example:
        # User: "delete the yellow circle"
        # Step 1: Get shapes
        shapes = get_canvas_shapes()
        # Step 2: Find the yellow circle
        yellow_circle = [s for s in shapes if s['type']=='circle' and s['fill']=='#FFFF00'][0]
        # Step 3: Delete it
        delete_shape_by_id(shape_id=yellow_circle['id'])
    """
    try:
        success = delete_shape_from_firestore(
            shape_id=shape_id,
            canvas_id=canvas_id
        )
        
        if success:
            return {
                "success": True,
                "message": f"Deleted shape {shape_id} from the canvas",
                "shape_id": shape_id
            }
        else:
            return {
                "success": False,
                "message": f"Failed to delete shape {shape_id}. It may not exist on the canvas.",
                "shape_id": shape_id
            }
    
    except Exception as e:
        return {
            "success": False,
            "message": f"Error deleting shape: {str(e)}",
            "shape_id": shape_id
        }


# ==================== COMPLEX CREATE OPERATIONS ====================

@tool
def create_grid(
    rows: int,
    cols: int,
    cell_width: float = 80,
    cell_height: float = 80,
    start_x: float = 100,
    start_y: float = 100,
    spacing: float = 20,
    color: str = "blue",
    canvas_id: str = "main-canvas"
) -> Dict[str, Any]:
    """
    Create a grid of rectangles on the canvas and save them to Firebase.
    
    Args:
        rows: Number of rows in the grid
        cols: Number of columns in the grid
        cell_width: Width of each cell (default: 80)
        cell_height: Height of each cell (default: 80)
        start_x: Starting X position (default: 100)
        start_y: Starting Y position (default: 100)
        spacing: Space between cells (default: 20)
        color: Color of the cells (default: "blue")
        canvas_id: ID of the canvas (default: "main-canvas")
    
    Returns:
        Dictionary with success status and message
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
    
    # Save all shapes to Firebase in batch
    try:
        success = create_shapes_batch_in_firestore(
            shapes=shapes,
            canvas_id=canvas_id,
            session_id="ai-agent"
        )
        
        if success:
            return {
                "success": True,
                "message": f"Created {rows}x{cols} grid with {len(shapes)} rectangles",
                "shape_count": len(shapes)
            }
        else:
            return {
                "success": False,
                "message": f"Failed to create grid",
            }
    except Exception as e:
        return {
            "success": False,
            "message": f"Error creating grid: {str(e)}",
        }


@tool
def create_form(
    form_type: str = "login",
    x: float = 200,
    y: float = 150,
    canvas_id: str = "main-canvas"
) -> Dict[str, Any]:
    """
    Create a form with multiple elements (complex command) and save to Firebase.
    
    Args:
        form_type: Type of form to create - "login", "signup", or "contact" (default: "login")
        x: Starting X position for the form (default: 200)
        y: Starting Y position for the form (default: 150)
        canvas_id: ID of the canvas (default: "main-canvas")
    
    Returns:
        Dictionary with success status and message
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
    
    # Save all shapes to Firebase in batch
    try:
        success = create_shapes_batch_in_firestore(
            shapes=shapes,
            canvas_id=canvas_id,
            session_id="ai-agent"
        )
        
        if success:
            return {
                "success": True,
                "message": f"Created {form_type} form with {len(shapes)} elements",
                "shape_count": len(shapes)
            }
        else:
            return {
                "success": False,
                "message": f"Failed to create {form_type} form",
            }
    except Exception as e:
        return {
            "success": False,
            "message": f"Error creating form: {str(e)}",
        }


# Export all tools
ALL_TOOLS = [
    # Read operations (agent should use these first to understand canvas state)
    get_canvas_shapes,
    
    # Create operations (new shapes)
    create_shape,
    create_text,
    create_grid,
    create_form,
    
    # Manipulation operations (modify existing shapes)
    move_shape,
    resize_shape,
    change_shape_color,
    delete_shape_by_id,
]

