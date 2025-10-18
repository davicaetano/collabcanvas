"""
LangChain Tools for Canvas Manipulation

Simplified and optimized docstrings while maintaining full functionality.
These tools allow the AI agent to create and manipulate shapes on the canvas.
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
    update_shapes_batch as update_shapes_batch_in_firestore,
    delete_shape as delete_shape_from_firestore,
    delete_shapes_batch as delete_shapes_batch_from_firestore,
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
    Call this FIRST when manipulating existing shapes to get their IDs.
    
    Args:
        canvas_id: Canvas identifier (default: "main-canvas")
    
    Returns:
        List of shapes with: id, type, x, y, width, height, fill, rotation, text (for text type), fontSize (for text type)
    """
    try:
        shapes = get_all_shapes(canvas_id)
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
    Create a rectangle or circle on the canvas.
    
    Args:
        shape_type: "rectangle" or "circle"
        x: X position (top-left for rectangles, center for circles - Konva.js convention)
        y: Y position (top-left for rectangles, center for circles - Konva.js convention)
        width: Width in pixels (default: 100)
        height: Height in pixels (default: 100, circle uses width as diameter)
        color: Color name or hex code (default: "blue")
        rotation: Rotation angle in degrees (default: 0)
        canvas_id: Canvas identifier (default: "main-canvas")
    
    Returns:
        Dictionary with success status and message
    """
    shape_type_lower = shape_type.lower()
    
    if shape_type_lower not in ["rectangle", "circle"]:
        shape_type_lower = "rectangle"
    
    fill_color = normalize_color(color)
    
    shape = {
        "id": generate_shape_id(),
        "type": shape_type_lower,
        "x": float(x),
        "y": float(y),
        "width": float(width),
        "height": float(height) if shape_type_lower == "rectangle" else float(width),
        "fill": fill_color,
        "rotation": float(rotation),
        "stroke": "#000000",
        "strokeWidth": 0,
    }
    
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
    Create a text element on the canvas.
    
    Args:
        text: Text content to display
        x: X position
        y: Y position
        font_size: Font size in pixels (default: 16)
        color: Color name or hex code (default: "black")
        font_family: Font family (default: "Arial")
        canvas_id: Canvas identifier (default: "main-canvas")
    
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
        "width": len(text) * font_size * 0.6,
        "height": font_size * 1.2,
        "stroke": "#000000",
        "strokeWidth": 0,
    }
    
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
    Move a SINGLE shape to a new position. FOR 3+ SHAPES, USE move_random_shapes INSTEAD!
    
    WARNING: Do NOT call this function multiple times! For moving 3+ shapes, you MUST use move_random_shapes.
    
    Args:
        shape_id: Unique ID of the shape (from get_canvas_shapes)
        new_x: New X position (top-left for rectangles, center for circles - Konva.js convention)
        new_y: New Y position (top-left for rectangles, center for circles - Konva.js convention)
        canvas_id: Canvas identifier (default: "main-canvas")
    
    Returns:
        Dictionary with success status and message
    """
    try:
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
    Resize a SINGLE shape. FOR 3+ SHAPES, USE update_shapes_batch INSTEAD!
    
    WARNING: Do NOT call this function multiple times! For resizing 3+ shapes, use update_shapes_batch.
    
    Args:
        shape_id: Unique ID of the shape (from get_canvas_shapes)
        new_width: New width in pixels
        new_height: New height in pixels (optional, defaults to new_width)
        canvas_id: Canvas identifier (default: "main-canvas")
    
    Returns:
        Dictionary with success status and message
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
def rotate_shape(
    shape_id: str,
    angle: float,
    canvas_id: str = "main-canvas"
) -> Dict[str, Any]:
    """
    Rotate a shape. Call get_canvas_shapes() first to find the shape ID.
    
    Args:
        shape_id: Unique ID of the shape (from get_canvas_shapes)
        angle: Rotation angle in degrees (0-360, positive = clockwise)
        canvas_id: Canvas identifier (default: "main-canvas")
    
    Returns:
        Dictionary with success status and message
    """
    try:
        normalized_angle = float(angle) % 360
        
        success = update_shape_in_firestore(
            shape_id=shape_id,
            updates={"rotation": normalized_angle},
            canvas_id=canvas_id,
            session_id="ai-agent"
        )
        
        if success:
            return {
                "success": True,
                "message": f"Rotated shape {shape_id} to {normalized_angle}°",
                "shape_id": shape_id,
                "angle": normalized_angle
            }
        else:
            return {
                "success": False,
                "message": f"Failed to rotate shape {shape_id}. It may not exist on the canvas.",
                "shape_id": shape_id
            }
    except Exception as e:
        return {
            "success": False,
            "message": f"Error rotating shape: {str(e)}",
            "shape_id": shape_id
        }


@tool
def change_shape_color(
    shape_id: str,
    new_color: str,
    canvas_id: str = "main-canvas"
) -> Dict[str, Any]:
    """
    Change the color of a SINGLE shape. FOR 3+ SHAPES, USE update_shapes_batch INSTEAD!
    
    WARNING: Do NOT call this function multiple times! For changing color of 3+ shapes, use update_shapes_batch.
    
    Args:
        shape_id: Unique ID of the shape (from get_canvas_shapes)
        new_color: Color name or hex code
        canvas_id: Canvas identifier (default: "main-canvas")
    
    Returns:
        Dictionary with success status and message
    """
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
def arrange_shapes_horizontal(
    spacing: float = 0,
    y_position: Optional[float] = None,
    canvas_id: str = "main-canvas"
) -> Dict[str, Any]:
    """
    Arrange all shapes in a horizontal row (left to right).
    
    Each shape starts where the previous one ends, plus optional spacing.
    
    **Use when:**
    - User says "arrange in a row", "line up horizontally", "put in a horizontal line"
    - User wants shapes organized left to right
    
    Args:
        spacing: Gap between shapes in pixels (default: 0 = no gap, shapes touching)
        y_position: Y coordinate for the row (optional, uses average if not provided)
        canvas_id: ID of the canvas (default: "main-canvas")
    
    Returns:
        Dictionary with success status and message
    
    Example:
        User: "arrange all shapes in a horizontal row"
        → arrange_shapes_horizontal(spacing=0)
        
        User: "arrange shapes in a row with 20px spacing"
        → arrange_shapes_horizontal(spacing=20)
    """
    try:
        # Get all shapes
        shapes = get_all_shapes(canvas_id)
        
        if len(shapes) == 0:
            return {
                "success": False,
                "message": "No shapes on canvas to arrange"
            }
        
        # Calculate Y position (use average of all shapes if not provided)
        if y_position is None:
            y_position = sum(s.get('y', 0) for s in shapes) / len(shapes)
        
        # Sort shapes by current X position (left to right)
        shapes_sorted = sorted(shapes, key=lambda s: s.get('x', 0))
        
        # Calculate new positions
        updates = []
        current_x = 100  # Start position
        
        for shape in shapes_sorted:
            updates.append({
                'shape_id': shape['id'],
                'x': current_x,
                'y': y_position
            })
            # Next shape starts where this one ends + spacing
            shape_width = shape.get('width', 50)
            current_x += shape_width + spacing
        
        # Apply updates in batch
        success = update_shapes_batch_in_firestore(
            updates=updates,
            canvas_id=canvas_id,
            session_id="ai-agent"
        )
        
        if success:
            # Apply updates to shapes in memory to return updated shapes
            for i, shape in enumerate(shapes_sorted):
                shape['x'] = updates[i]['x']
                shape['y'] = updates[i]['y']
            
            return {
                "success": True,
                "message": f"Arranged {len(shapes)} shapes in horizontal row",
                "shape_count": len(shapes),
                "shapes": shapes_sorted  # Return updated shapes
            }
        else:
            return {
                "success": False,
                "message": "Failed to arrange shapes"
            }
    
    except Exception as e:
        return {
            "success": False,
            "message": f"Error arranging shapes: {str(e)}"
        }


@tool
def arrange_shapes_vertical(
    spacing: float = 0,
    x_position: Optional[float] = None,
    canvas_id: str = "main-canvas"
) -> Dict[str, Any]:
    """
    Arrange all shapes in a vertical column (top to bottom).
    
    Each shape starts where the previous one ends, plus optional spacing.
    
    **Use when:**
    - User says "arrange in a column", "stack vertically", "put in a vertical line"
    - User wants shapes organized top to bottom
    
    Args:
        spacing: Gap between shapes in pixels (default: 0 = no gap, shapes touching)
        x_position: X coordinate for the column (optional, uses average if not provided)
        canvas_id: ID of the canvas (default: "main-canvas")
    
    Returns:
        Dictionary with success status and message
    
    Example:
        User: "arrange all shapes in a vertical column"
        → arrange_shapes_vertical(spacing=0)
        
        User: "arrange shapes vertically with 20px spacing"
        → arrange_shapes_vertical(spacing=20)
    """
    try:
        # Get all shapes
        shapes = get_all_shapes(canvas_id)
        
        if len(shapes) == 0:
            return {
                "success": False,
                "message": "No shapes on canvas to arrange"
            }
        
        # Calculate X position (use average of all shapes if not provided)
        if x_position is None:
            x_position = sum(s.get('x', 0) for s in shapes) / len(shapes)
        
        # Sort shapes by current Y position (top to bottom)
        shapes_sorted = sorted(shapes, key=lambda s: s.get('y', 0))
        
        # Calculate new positions
        updates = []
        current_y = 100  # Start position
        
        for shape in shapes_sorted:
            updates.append({
                'shape_id': shape['id'],
                'x': x_position,
                'y': current_y
            })
            # Next shape starts where this one ends + spacing
            shape_height = shape.get('height', 50)
            current_y += shape_height + spacing
        
        # Apply updates in batch
        success = update_shapes_batch_in_firestore(
            updates=updates,
            canvas_id=canvas_id,
            session_id="ai-agent"
        )
        
        if success:
            # Apply updates to shapes in memory to return updated shapes
            for i, shape in enumerate(shapes_sorted):
                shape['x'] = updates[i]['x']
                shape['y'] = updates[i]['y']
            
            return {
                "success": True,
                "message": f"Arranged {len(shapes)} shapes in vertical column",
                "shape_count": len(shapes),
                "shapes": shapes_sorted  # Return updated shapes
            }
        else:
            return {
                "success": False,
                "message": "Failed to arrange shapes"
            }
    
    except Exception as e:
        return {
            "success": False,
            "message": f"Error arranging shapes: {str(e)}"
        }


@tool
def delete_all_shapes(
    canvas_id: str = "main-canvas"
) -> Dict[str, Any]:
    """
    Delete ALL shapes from the canvas in one fast operation.
    
    This is MUCH FASTER than getting all shapes and then calling delete_shapes_batch,
    because it does everything in one operation.
    
    **Use when:**
    - User says "delete all", "clear canvas", "remove everything", "delete all shapes"
    - User wants to start fresh
    
    **WARNING:** This deletes EVERYTHING. Cannot be undone.
    
    Args:
        canvas_id: ID of the canvas (default: "main-canvas")
    
    Returns:
        Dictionary with success status and message
    
    Example:
        User: "delete all shapes"
        → delete_all_shapes()
    """
    try:
        # Get all shapes
        shapes = get_all_shapes(canvas_id)
        
        if len(shapes) == 0:
            return {
                "success": True,
                "message": "Canvas is already empty (no shapes to delete)",
                "shape_count": 0
            }
        
        # Get all shape IDs
        shape_ids = [shape['id'] for shape in shapes]
        
        # Delete all in batch
        success = delete_shapes_batch_from_firestore(
            shape_ids=shape_ids,
            canvas_id=canvas_id
        )
        
        if success:
            return {
                "success": True,
                "message": f"Deleted all {len(shapes)} shapes from canvas",
                "shape_count": len(shapes)
            }
        else:
            return {
                "success": False,
                "message": "Failed to delete all shapes"
            }
    
    except Exception as e:
        return {
            "success": False,
            "message": f"Error deleting all shapes: {str(e)}"
        }


@tool
def delete_shape_by_id(
    shape_id: str,
    canvas_id: str = "main-canvas"
) -> Dict[str, Any]:
    """
    Delete a shape from the canvas. Call get_canvas_shapes() first to find the shape ID.
    
    Args:
        shape_id: Unique ID of the shape to delete
        canvas_id: Canvas identifier (default: "main-canvas")
    
    Returns:
        Dictionary with success status and message
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


@tool
def move_random_shapes(
    count: int,
    offset_x: float,
    offset_y: float,
    canvas_id: str = "main-canvas"
) -> Dict[str, Any]:
    """
    Move a specific number of RANDOMLY SELECTED shapes by an offset. FAST! No shape IDs needed!
    
    This tool automatically selects random shapes from the canvas and moves them.
    Perfect for commands like "move 10 shapes right" where specific shapes don't matter.
    
    Args:
        count: Number of shapes to move (e.g., 10, 100, 500)
        offset_x: Amount to move horizontally (positive = right, negative = left)
        offset_y: Amount to move vertically (positive = down, negative = up)
        canvas_id: Canvas identifier (default: "main-canvas")
    
    Returns:
        Dictionary with success status and message
        
    Examples:
        - "move 10 shapes 50 pixels to the right" → move_random_shapes(count=10, offset_x=50, offset_y=0)
        - "shift 100 shapes down" → move_random_shapes(count=100, offset_x=0, offset_y=100)
        - "move all shapes left" → get_canvas_shapes() to count, then move_random_shapes(count=total, offset_x=-50, offset_y=0)
    
    NOTE: Shapes are selected randomly. For moving ALL shapes, pass count equal to total shape count.
    """
    try:
        import logging
        import random
        logger = logging.getLogger("tools")
        logger.info(f"🔄 move_random_shapes called: count={count}, offset_x={offset_x}, offset_y={offset_y}")
        
        if count <= 0:
            return {
                "success": False,
                "message": "Count must be greater than 0"
            }
        
        # Get all shapes
        all_shapes = get_all_shapes(canvas_id=canvas_id)
        
        if not all_shapes:
            return {
                "success": False,
                "message": "No shapes found on canvas"
            }
        
        # Select shapes (up to count, or all if fewer available)
        shapes_to_move = random.sample(all_shapes, min(count, len(all_shapes)))
        
        # Build updates
        updates = []
        for shape in shapes_to_move:
            current_x = shape.get('x', 0)
            current_y = shape.get('y', 0)
            
            updates.append({
                'shape_id': shape['id'],
                'x': float(current_x + offset_x),
                'y': float(current_y + offset_y)
            })
        
        # Batch update
        success = update_shapes_batch_in_firestore(
            updates=updates,
            canvas_id=canvas_id,
            session_id="ai-agent"
        )
        
        if success:
            return {
                "success": True,
                "message": f"Moved {len(updates)} shapes by offset ({offset_x}, {offset_y})",
                "shape_count": len(updates)
            }
        else:
            return {
                "success": False,
                "message": "Failed to move shapes"
            }
    except Exception as e:
        return {
            "success": False,
            "message": f"Error moving shapes: {str(e)}"
        }


# ==================== COMPLEX CREATE OPERATIONS ====================

@tool
def create_random_shapes_simple(
    count: int,
    shape_type: str = "rectangle",
    canvas_id: str = "main-canvas"
) -> Dict[str, Any]:
    """
    Create multiple random shapes efficiently (optimized for large quantities).
    
    This tool is MUCH FASTER than create_shapes_batch for creating many shapes
    because it generates shapes in Python instead of requiring the LLM to generate
    a large JSON array.
    
    **Use this tool when:**
    - User asks for 50+ shapes (e.g., "create 500 squares", "create 500 rectangles")
    - User wants random positions and colors
    - Speed is important
    
    Args:
        count: Number of shapes to create (can be 100, 500, 1000+)
        shape_type: Type of shapes - "rectangle", "square", "circle", or "mixed" (default: "rectangle")
        canvas_id: ID of the canvas (default: "main-canvas")
    
    Returns:
        Dictionary with success status and message
    
    Examples:
        create_random_shapes_simple(count=500, shape_type="square")      # All squares (width = height)
        create_random_shapes_simple(count=500, shape_type="rectangle")   # All rectangles (width != height)
        create_random_shapes_simple(count=100, shape_type="circle")
        create_random_shapes_simple(count=1000, shape_type="mixed")      # Mix of all types
    """
    import random
    
    shape_type = shape_type.lower()
    if shape_type not in ["rectangle", "square", "circle", "mixed"]:
        shape_type = "rectangle"
    
    # Color palette for random colors
    colors = [
        "#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF",
        "#FFA500", "#800080", "#FFC0CB", "#A52A2A", "#808080", "#000080"
    ]
    
    shapes = []
    for i in range(count):
        # Determine shape type (for mixed mode)
        if shape_type == "mixed":
            current_type = random.choice(["rectangle", "square", "circle"])
        else:
            current_type = shape_type
        
        # Random position (spread across canvas, avoiding edges)
        x = random.randint(50, 2950)
        y = random.randint(50, 2950)
        
        # Random size - handle squares vs rectangles vs circles
        if current_type == "square":
            # Square: width = height (one random side, copied to both dimensions)
            size = random.randint(30, 150)
            width = size
            height = size
            render_type = "rectangle"  # Konva.js renders squares as rectangles with equal dimensions
        elif current_type == "circle":
            # Circle: width = diameter, height = width
            width = random.randint(30, 150)
            height = width
            render_type = "circle"
        else:  # rectangle
            # Rectangle: width and height are independently random
            width = random.randint(30, 150)
            height = random.randint(30, 150)
            render_type = "rectangle"
        
        # Random color
        color = random.choice(colors)
        
        shape = {
            "id": f"{generate_shape_id()}-{i}",
            "type": render_type,  # "rectangle" or "circle" (not "square" - that's just a rectangle with equal sides)
            "x": float(x),
            "y": float(y),
            "width": float(width),
            "height": float(height),
            "fill": color,
            "rotation": 0,
            "stroke": "#000000",
            "strokeWidth": 0,
        }
        shapes.append(shape)
    
    # Use existing batch create function
    try:
        success = create_shapes_batch_in_firestore(
            shapes=shapes,
            canvas_id=canvas_id,
            session_id="ai-agent"
        )
        
        if success:
            return {
                "success": True,
                "message": f"Created {count} random {shape_type} shapes",
                "shape_count": count
            }
        else:
            return {
                "success": False,
                "message": f"Failed to create {count} shapes"
            }
    except Exception as e:
        return {
            "success": False,
            "message": f"Error creating shapes: {str(e)}"
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
    color: str = "blue",
    canvas_id: str = "main-canvas"
) -> Dict[str, Any]:
    """
    Create a grid of rectangles on the canvas.
    
    Args:
        rows: Number of rows
        cols: Number of columns
        cell_width: Width of each cell (default: 80)
        cell_height: Height of each cell (default: 80)
        start_x: Starting X position (default: 100)
        start_y: Starting Y position (default: 100)
        spacing: Space between cells (default: 20)
        color: Color name or hex code (default: "blue")
        canvas_id: Canvas identifier (default: "main-canvas")
    
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
                "strokeWidth": 0,
            }
            shapes.append(shape)
    
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
    Create a form with multiple elements (title, labels, fields, button).
    
    Args:
        form_type: Type of form ("login", "signup", or "contact") - default: "login"
        x: Starting X position (default: 200)
        y: Starting Y position (default: 150)
        canvas_id: Canvas identifier (default: "main-canvas")
    
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
            "stroke": "#000000",
            "strokeWidth": 0,
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
            "stroke": "#000000",
            "strokeWidth": 0,
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
            "stroke": "#000000",
            "strokeWidth": 0,
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
            "stroke": "#000000",
            "strokeWidth": 0,
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
            "stroke": "#000000",
            "strokeWidth": 0,
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
            "stroke": "#000000",
            "strokeWidth": 0,
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
            "stroke": "#000000",
            "strokeWidth": 0,
        })
    
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


# ==================== BATCH OPERATIONS ====================

@tool
def create_shapes_batch(
    shapes: List[Dict[str, Any]],
    canvas_id: str = "main-canvas"
) -> Dict[str, Any]:
    """
    Create multiple shapes at once. Use for 3+ shapes. Handles any quantity (10, 100, 1000+) in one call.
    
    Args:
        shapes: List of shape dictionaries, each with: id, type, x, y, width, height, fill, rotation
        canvas_id: Canvas identifier (default: "main-canvas")
    
    Returns:
        Dictionary with success status and message
    """
    try:
        # Validate and normalize shapes
        for i, shape in enumerate(shapes):
            if 'id' not in shape:
                shape['id'] = generate_shape_id()
            if 'type' not in shape:
                return {
                    "success": False,
                    "message": f"Shape {i} is missing required field 'type'"
                }
            if 'fill' in shape:
                shape['fill'] = normalize_color(shape['fill'])
        
        success = create_shapes_batch_in_firestore(
            shapes=shapes,
            canvas_id=canvas_id,
            session_id="ai-agent"
        )
        
        if success:
            return {
                "success": True,
                "message": f"Created {len(shapes)} shapes in batch",
                "shape_count": len(shapes)
            }
        else:
            return {
                "success": False,
                "message": "Failed to create shapes batch"
            }
    except Exception as e:
        return {
            "success": False,
            "message": f"Error creating shapes batch: {str(e)}"
        }


@tool
def update_shapes_batch(
    updates: List[Dict[str, Any]],
    canvas_id: str = "main-canvas"
) -> Dict[str, Any]:
    """
    Update multiple shapes at once. Use for 3+ shapes. Each update must include shape_id and fields to update.
    
    Args:
        updates: List of update dictionaries with shape_id and fields to update (x, y, width, height, fill, rotation)
        canvas_id: Canvas identifier (default: "main-canvas")
    
    Returns:
        Dictionary with success status and message
    """
    try:
        # Validate updates
        for i, update in enumerate(updates):
            if 'shape_id' not in update:
                return {
                    "success": False,
                    "message": f"Update {i} is missing required field 'shape_id'"
                }
            if 'fill' in update:
                update['fill'] = normalize_color(update['fill'])
        
        success = update_shapes_batch_in_firestore(
            updates=updates,
            canvas_id=canvas_id,
            session_id="ai-agent"
        )
        
        if success:
            return {
                "success": True,
                "message": f"Updated {len(updates)} shapes in batch",
                "shape_count": len(updates)
            }
        else:
            return {
                "success": False,
                "message": "Failed to update shapes batch"
            }
    except Exception as e:
        return {
            "success": False,
            "message": f"Error updating shapes batch: {str(e)}"
        }


@tool
def delete_shapes_batch(
    shape_ids: List[str],
    canvas_id: str = "main-canvas"
) -> Dict[str, Any]:
    """
    Delete multiple shapes at once. Use for 3+ shapes.
    
    Args:
        shape_ids: List of shape IDs to delete
        canvas_id: Canvas identifier (default: "main-canvas")
    
    Returns:
        Dictionary with success status and message
    """
    try:
        if not shape_ids or len(shape_ids) == 0:
            return {
                "success": False,
                "message": "No shape IDs provided"
            }
        
        success = delete_shapes_batch_from_firestore(
            shape_ids=shape_ids,
            canvas_id=canvas_id
        )
        
        if success:
            return {
                "success": True,
                "message": f"Deleted {len(shape_ids)} shapes in batch",
                "shape_count": len(shape_ids)
            }
        else:
            return {
                "success": False,
                "message": "Failed to delete shapes batch"
            }
    except Exception as e:
        return {
            "success": False,
            "message": f"Error deleting shapes batch: {str(e)}"
        }


# Export all tools
ALL_TOOLS = [
    # Read operations (call first to understand canvas state)
    get_canvas_shapes,
    
    # Create operations
    create_shape,
    create_text,
    create_random_shapes_simple,  # NEW: Fast creation of many random shapes (50+)
    create_grid,
    create_form,
    
    # Manipulation operations (require shape_id from get_canvas_shapes)
    move_shape,
    move_random_shapes,         # NEW: Move N shapes by offset (FAST! No IDs needed)
    resize_shape,
    rotate_shape,
    change_shape_color,
    arrange_shapes_horizontal,  # NEW: Arrange all shapes in horizontal row
    arrange_shapes_vertical,    # NEW: Arrange all shapes in vertical column
    delete_shape_by_id,
    delete_all_shapes,          # NEW: Delete all shapes (fast clear)
    
    # Batch operations (for 3+ shapes - faster performance)
    create_shapes_batch,
    update_shapes_batch,
    delete_shapes_batch,
]
