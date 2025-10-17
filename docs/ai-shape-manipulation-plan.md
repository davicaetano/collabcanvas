# AI Shape Manipulation Implementation Plan

## Overview

This document outlines the implementation plan for enabling the AI agent to **read and manipulate existing shapes** on the canvas by integrating Firebase Admin SDK into the backend. This extends the MVP functionality from "creation only" to "creation + manipulation".

**Status**: Planning Phase  
**Target**: Backend can read canvas state and modify existing shapes  
**Impact**: Enables commands like "move the blue rectangle", "resize the circle", "change color of text"

---

## Current State Analysis

### ✅ What's Already Working

1. **AI Creation**: Agent can create shapes using tools:
   - `create_shape()` - rectangles and circles
   - `create_text()` - text elements
   - `create_grid()` - grid of shapes
   - `create_form()` - complex multi-element forms

2. **Frontend ↔ Firestore Sync**: Real-time synchronization working perfectly
   - Shapes saved to: `canvases/main-canvas/shapes/{shapeId}`
   - All users see updates via Firestore listeners

3. **Backend ↔ Frontend Communication**: API working end-to-end
   - Frontend sends commands via POST `/api/ai/command`
   - Backend returns shape objects
   - Frontend saves to Firestore using `createShape()`

### ⚠️ Current Limitation

**The AI is blind**: The agent cannot see what shapes already exist on the canvas. It can only create new shapes.

Current manipulation tools (`move_shape`, `resize_shape`) return vague "command" objects like:
```python
{
    "command": "move",
    "target": "blue rectangle",  # Vague description
    "x": 200,
    "y": 300
}
```

Problems:
- Backend doesn't know which shape is "the blue rectangle"
- Frontend would need to implement complex shape matching logic
- No way to verify the shape exists before trying to move it
- No access to current shape positions for relative movements

---

## Solution Architecture

### High-Level Flow

```
User: "move the blue rectangle to the right"
    ↓
1. Agent calls: get_canvas_shapes(canvas_id)
   ← Backend reads from Firestore
   ← Returns: [{ id: "abc123", type: "rectangle", fill: "#0000FF", x: 100, y: 100, ... }]
    ↓
2. Agent analyzes shapes and identifies target
   → "blue rectangle" = shape with id "abc123" at x=100
    ↓
3. Agent calls: move_shape(shape_id="abc123", new_x=200, new_y=100, canvas_id, user_id, session_id)
   → Backend updates Firestore directly
   → Updates: { x: 200, updatedAt: serverTimestamp() }
    ↓
4. Firestore notifies all clients via real-time listener
   → Frontend updates canvas automatically (existing multiplayer sync)
```

### Key Design Decisions

1. **Backend manipulates Firestore directly** (not through frontend)
   - ✅ More reliable and atomic operations
   - ✅ Works even if user closes browser
   - ✅ Leverages existing real-time sync infrastructure
   - ✅ No new frontend code needed

2. **Agent uses two-step process** for manipulation
   - Step 1: Read canvas state with `get_canvas_shapes()`
   - Step 2: Identify target and call manipulation tool with specific ID
   - ✅ Makes AI reasoning explicit and debuggable
   - ✅ Allows AI to verify shape exists before acting

3. **Follow frontend data structure exactly**
   - Use same Firestore paths, field names, and conventions
   - Maintain compatibility with existing frontend code
   - No schema changes required

---

## Frontend Data Structure Reference

### Firestore Schema

```
canvases/
  └── {canvasId}/                    # e.g., "main-canvas"
      ├── shapes/
      │   └── {shapeId}/             # Document ID = shape.id (UUID)
      │       ├── id: string         # Same as document ID
      │       ├── type: string       # "rectangle" | "circle" | "text"
      │       ├── x: number          # X position (center point)
      │       ├── y: number          # Y position (center point)
      │       ├── width: number
      │       ├── height: number
      │       ├── fill: string       # Hex color (e.g., "#0000FF")
      │       ├── rotation: number   # Degrees
      │       ├── stroke: string     # Border color
      │       ├── strokeWidth: number
      │       ├── text?: string      # Only for text type
      │       ├── fontSize?: number  # Only for text type
      │       ├── fontFamily?: string # Only for text type
      │       ├── userId: string     # Who created/modified
      │       ├── sessionId: string  # Browser tab/window UUID
      │       ├── createdAt: timestamp
      │       ├── updatedAt: timestamp
      │       └── isAIGenerated?: boolean # Flag for AI-created shapes
      │
      ├── cursors/
      │   └── {userId}/
      │       └── ...
      │
      └── presence/
          └── {userId}/
              └── ...
```

### Key Frontend Functions (for Backend Parity)

```javascript
// Create shape
createShape(shape, userId, sessionId)
  → setDoc(doc(db, 'canvases', CANVAS_ID, 'shapes', shape.id), {
      ...shape,
      userId,
      sessionId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

// Update shape
updateShape(shapeId, updates, sessionId)
  → updateDoc(doc(db, 'canvases', CANVAS_ID, 'shapes', shapeId), {
      ...updates,
      sessionId,
      updatedAt: serverTimestamp()
    })

// Read all shapes
subscribeToShapes(callback)
  → onSnapshot(collection(db, 'canvases', CANVAS_ID, 'shapes'))
```

### Important Frontend Conventions

1. **Canvas ID**: Currently hardcoded as `"main-canvas"` (MVP single-canvas)
2. **Shape ID**: UUID v4 generated with `crypto.randomUUID()` or Python's `uuid.uuid4()`
3. **Document ID = Shape ID**: The Firestore document ID matches the `shape.id` field
4. **Session ID**: UUID v4 generated per browser tab, identifies which window made changes
5. **Timestamps**: Uses `serverTimestamp()` for `createdAt` and `updatedAt`
6. **Colors**: Always hex format (e.g., "#0000FF" not "blue")

---

## Implementation Plan

### Phase 1: Firebase Admin SDK Integration (45 min)

**Goal**: Backend can connect to Firestore and perform read/write operations

#### Tasks:

1. **Install Firebase Admin SDK**
   ```bash
   cd packages/backend
   pip install firebase-admin
   ```

2. **Get Firebase Service Account Credentials**
   - Go to Firebase Console → Project Settings → Service Accounts
   - Generate new private key (downloads JSON file)
   - Save as `packages/backend/firebase-service-account.json`
   - Add to `.gitignore` ⚠️

3. **Create Firebase Service Module**
   
   **File**: `packages/backend/services/firebase_service.py`
   
   ```python
   """
   Firebase Admin SDK service for Firestore operations
   
   This module provides functions to interact with Firestore using the
   Firebase Admin SDK. It mirrors the frontend's Firestore operations
   to maintain data consistency.
   """
   
   import os
   import firebase_admin
   from firebase_admin import credentials, firestore
   from typing import List, Dict, Any, Optional
   from datetime import datetime
   
   # Initialize Firebase Admin (singleton)
   _db = None
   
   def initialize_firebase():
       """Initialize Firebase Admin SDK"""
       global _db
       if _db is not None:
           return _db
       
       # Load service account credentials
       cred_path = os.getenv('FIREBASE_SERVICE_ACCOUNT_PATH', 
                            './firebase-service-account.json')
       
       if not os.path.exists(cred_path):
           raise FileNotFoundError(
               f"Firebase service account file not found at {cred_path}"
           )
       
       cred = credentials.Certificate(cred_path)
       firebase_admin.initialize_app(cred)
       _db = firestore.client()
       
       return _db
   
   def get_firestore_client():
       """Get Firestore client instance"""
       if _db is None:
           initialize_firebase()
       return _db
   
   # ==================== SHAPE OPERATIONS ====================
   
   def get_all_shapes(canvas_id: str = "main-canvas") -> List[Dict[str, Any]]:
       """
       Fetch all shapes from a canvas
       
       Args:
           canvas_id: ID of the canvas (default: "main-canvas")
       
       Returns:
           List of shape dictionaries
       """
       db = get_firestore_client()
       shapes_ref = db.collection('canvases').document(canvas_id).collection('shapes')
       
       shapes = []
       docs = shapes_ref.stream()
       
       for doc in docs:
           shape_data = doc.to_dict()
           shape_data['id'] = doc.id  # Ensure ID is included
           shapes.append(shape_data)
       
       return shapes
   
   def get_shape_by_id(shape_id: str, canvas_id: str = "main-canvas") -> Optional[Dict[str, Any]]:
       """
       Fetch a single shape by ID
       
       Args:
           shape_id: ID of the shape
           canvas_id: ID of the canvas (default: "main-canvas")
       
       Returns:
           Shape dictionary or None if not found
       """
       db = get_firestore_client()
       doc_ref = db.collection('canvases').document(canvas_id).collection('shapes').document(shape_id)
       doc = doc_ref.get()
       
       if doc.exists:
           shape_data = doc.to_dict()
           shape_data['id'] = doc.id
           return shape_data
       
       return None
   
   def update_shape(
       shape_id: str,
       updates: Dict[str, Any],
       user_id: str = None,
       session_id: str = "ai-agent",
       canvas_id: str = "main-canvas"
   ) -> bool:
       """
       Update a shape in Firestore
       
       Args:
           shape_id: ID of the shape to update
           updates: Dictionary of fields to update
           user_id: ID of user making the change
           session_id: Session ID (default: "ai-agent" for backend)
           canvas_id: ID of the canvas (default: "main-canvas")
       
       Returns:
           True if successful, False otherwise
       """
       db = get_firestore_client()
       doc_ref = db.collection('canvases').document(canvas_id).collection('shapes').document(shape_id)
       
       # Add metadata
       update_data = {
           **updates,
           'updatedAt': firestore.SERVER_TIMESTAMP,
           'sessionId': session_id,
       }
       
       if user_id:
           update_data['userId'] = user_id
       
       try:
           doc_ref.update(update_data)
           return True
       except Exception as e:
           print(f"Error updating shape {shape_id}: {e}")
           return False
   
   def create_shape(
       shape: Dict[str, Any],
       user_id: str = None,
       session_id: str = "ai-agent",
       canvas_id: str = "main-canvas"
   ) -> bool:
       """
       Create a new shape in Firestore
       
       Args:
           shape: Shape dictionary (must include 'id' field)
           user_id: ID of user creating the shape
           session_id: Session ID (default: "ai-agent")
           canvas_id: ID of the canvas (default: "main-canvas")
       
       Returns:
           True if successful, False otherwise
       """
       db = get_firestore_client()
       
       if 'id' not in shape:
           raise ValueError("Shape must have an 'id' field")
       
       shape_id = shape['id']
       doc_ref = db.collection('canvases').document(canvas_id).collection('shapes').document(shape_id)
       
       # Add metadata
       shape_data = {
           **shape,
           'createdAt': firestore.SERVER_TIMESTAMP,
           'updatedAt': firestore.SERVER_TIMESTAMP,
           'sessionId': session_id,
       }
       
       if user_id:
           shape_data['userId'] = user_id
       
       try:
           doc_ref.set(shape_data)
           return True
       except Exception as e:
           print(f"Error creating shape {shape_id}: {e}")
           return False
   
   def delete_shape(
       shape_id: str,
       canvas_id: str = "main-canvas"
   ) -> bool:
       """
       Delete a shape from Firestore
       
       Args:
           shape_id: ID of the shape to delete
           canvas_id: ID of the canvas (default: "main-canvas")
       
       Returns:
           True if successful, False otherwise
       """
       db = get_firestore_client()
       doc_ref = db.collection('canvases').document(canvas_id).collection('shapes').document(shape_id)
       
       try:
           doc_ref.delete()
           return True
       except Exception as e:
           print(f"Error deleting shape {shape_id}: {e}")
           return False
   ```

4. **Update `.env` Configuration**
   
   Add to `packages/backend/.env`:
   ```bash
   # Firebase Admin SDK
   FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
   ```

5. **Update `.gitignore`**
   
   Ensure these lines exist in `packages/backend/.gitignore`:
   ```
   # Firebase credentials
   firebase-service-account.json
   *.json
   !package.json
   ```

6. **Update `requirements.txt`**
   
   Add:
   ```
   firebase-admin==6.5.0
   ```

#### Validation:

```python
# Test script: packages/backend/test_firebase.py
from services.firebase_service import get_all_shapes, initialize_firebase

initialize_firebase()
shapes = get_all_shapes()
print(f"Found {len(shapes)} shapes on canvas")
for shape in shapes:
    print(f"  - {shape['type']} at ({shape['x']}, {shape['y']})")
```

---

### Phase 2: New Agent Tool - Read Canvas (30 min)

**Goal**: Agent can query current canvas state

#### Tasks:

1. **Create `get_canvas_shapes` Tool**
   
   **Update**: `packages/backend/agents/tools.py`
   
   Add at the top:
   ```python
   from services.firebase_service import get_all_shapes as get_shapes_from_firestore
   ```
   
   Add new tool:
   ```python
   @tool
   def get_canvas_shapes(canvas_id: str = "main-canvas") -> List[Dict[str, Any]]:
       """
       Get all shapes currently on the canvas.
       Use this tool FIRST when you need to manipulate existing shapes.
       
       Args:
           canvas_id: ID of the canvas to query (default: "main-canvas")
       
       Returns:
           List of shape dictionaries with properties:
           - id: unique identifier
           - type: "rectangle", "circle", or "text"
           - x, y: position coordinates
           - width, height: dimensions
           - fill: color in hex format (e.g., "#0000FF")
           - rotation: rotation angle in degrees
           - text: text content (only for text type)
           - And other properties...
       
       Example output:
       [
           {
               "id": "abc-123",
               "type": "rectangle",
               "x": 200,
               "y": 150,
               "width": 100,
               "height": 80,
               "fill": "#0000FF",  # Blue
               "rotation": 0
           },
           {
               "id": "def-456",
               "type": "circle",
               "x": 400,
               "y": 300,
               "width": 60,
               "height": 60,
               "fill": "#FF0000",  # Red
               "rotation": 0
           }
       ]
       """
       try:
           shapes = get_shapes_from_firestore(canvas_id)
           
           # Return simplified view for the agent
           # (Remove metadata that might confuse the AI)
           simplified_shapes = []
           for shape in shapes:
               simplified = {
                   'id': shape.get('id'),
                   'type': shape.get('type'),
                   'x': shape.get('x'),
                   'y': shape.get('y'),
                   'width': shape.get('width'),
                   'height': shape.get('height'),
                   'fill': shape.get('fill'),
                   'rotation': shape.get('rotation', 0),
               }
               
               # Add text-specific fields
               if shape.get('type') == 'text':
                   simplified['text'] = shape.get('text')
                   simplified['fontSize'] = shape.get('fontSize')
               
               simplified_shapes.append(simplified)
           
           return simplified_shapes
       
       except Exception as e:
           print(f"Error fetching canvas shapes: {e}")
           return []
   ```

2. **Add Tool to Tool List**
   
   Update `ALL_TOOLS` at the bottom:
   ```python
   ALL_TOOLS = [
       get_canvas_shapes,  # NEW - Add this first
       create_shape,
       create_text,
       move_shape,
       resize_shape,
       create_grid,
       create_form,
   ]
   ```

#### Validation:

Test via command: `"what shapes are on the canvas?"`

Expected: Agent calls `get_canvas_shapes()` and describes what it found

---

### Phase 3: Update Manipulation Tools (45 min)

**Goal**: Tools can actually modify shapes in Firestore

#### Tasks:

1. **Update `move_shape` Tool**
   
   Replace existing implementation:
   
   ```python
   @tool
   def move_shape(
       shape_id: str,
       new_x: float,
       new_y: float,
       canvas_id: str = "main-canvas"
   ) -> Dict[str, Any]:
       """
       Move a shape to a new position by its ID.
       
       IMPORTANT: First call get_canvas_shapes() to find the shape ID!
       
       Args:
           shape_id: The unique ID of the shape to move (get this from get_canvas_shapes)
           new_x: New X position (center point)
           new_y: New Y position (center point)
           canvas_id: ID of the canvas (default: "main-canvas")
       
       Returns:
           Dictionary with success status and message
       
       Example:
           # First, get shapes to find the ID
           shapes = get_canvas_shapes()
           # Find the blue rectangle: shape_id = "abc-123"
           
           # Then move it
           move_shape(shape_id="abc-123", new_x=300, new_y=200)
       """
       from services.firebase_service import update_shape as update_shape_in_firestore
       
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
                   "message": f"Failed to move shape {shape_id}. It may not exist.",
                   "shape_id": shape_id
               }
       
       except Exception as e:
           return {
               "success": False,
               "message": f"Error moving shape: {str(e)}",
               "shape_id": shape_id
           }
   ```

2. **Update `resize_shape` Tool**
   
   Replace existing implementation:
   
   ```python
   @tool
   def resize_shape(
       shape_id: str,
       new_width: float,
       new_height: Optional[float] = None,
       canvas_id: str = "main-canvas"
   ) -> Dict[str, Any]:
       """
       Resize a shape to new dimensions by its ID.
       
       IMPORTANT: First call get_canvas_shapes() to find the shape ID!
       
       Args:
           shape_id: The unique ID of the shape to resize (get this from get_canvas_shapes)
           new_width: New width in pixels
           new_height: New height in pixels (optional, defaults to new_width for circles)
           canvas_id: ID of the canvas (default: "main-canvas")
       
       Returns:
           Dictionary with success status and message
       """
       from services.firebase_service import update_shape as update_shape_in_firestore
       
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
                   "message": f"Failed to resize shape {shape_id}. It may not exist.",
                   "shape_id": shape_id
               }
       
       except Exception as e:
           return {
               "success": False,
               "message": f"Error resizing shape: {str(e)}",
               "shape_id": shape_id
           }
   ```

3. **Add New Tool: `change_shape_color`**
   
   Add new tool for color manipulation:
   
   ```python
   @tool
   def change_shape_color(
       shape_id: str,
       new_color: str,
       canvas_id: str = "main-canvas"
   ) -> Dict[str, Any]:
       """
       Change the color of a shape by its ID.
       
       IMPORTANT: First call get_canvas_shapes() to find the shape ID!
       
       Args:
           shape_id: The unique ID of the shape (get this from get_canvas_shapes)
           new_color: New color (name like "red" or hex like "#FF0000")
           canvas_id: ID of the canvas (default: "main-canvas")
       
       Returns:
           Dictionary with success status and message
       """
       from services.firebase_service import update_shape as update_shape_in_firestore
       
       # Normalize color
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
                   "message": f"Failed to change color of shape {shape_id}",
                   "shape_id": shape_id
               }
       
       except Exception as e:
           return {
               "success": False,
               "message": f"Error changing color: {str(e)}",
               "shape_id": shape_id
           }
   ```

4. **Add New Tool: `delete_shape_by_id`**
   
   ```python
   @tool
   def delete_shape_by_id(
       shape_id: str,
       canvas_id: str = "main-canvas"
   ) -> Dict[str, Any]:
       """
       Delete a shape from the canvas by its ID.
       
       IMPORTANT: First call get_canvas_shapes() to find the shape ID!
       
       Args:
           shape_id: The unique ID of the shape to delete
           canvas_id: ID of the canvas (default: "main-canvas")
       
       Returns:
           Dictionary with success status and message
       """
       from services.firebase_service import delete_shape as delete_shape_from_firestore
       
       try:
           success = delete_shape_from_firestore(
               shape_id=shape_id,
               canvas_id=canvas_id
           )
           
           if success:
               return {
                   "success": True,
                   "message": f"Deleted shape {shape_id}",
                   "shape_id": shape_id
               }
           else:
               return {
                   "success": False,
                   "message": f"Failed to delete shape {shape_id}",
                   "shape_id": shape_id
               }
       
       except Exception as e:
           return {
               "success": False,
               "message": f"Error deleting shape: {str(e)}",
               "shape_id": shape_id
           }
   ```

5. **Update Tool List**
   
   ```python
   ALL_TOOLS = [
       get_canvas_shapes,
       create_shape,
       create_text,
       move_shape,
       resize_shape,
       change_shape_color,  # NEW
       delete_shape_by_id,   # NEW
       create_grid,
       create_form,
   ]
   ```

#### Validation:

Test commands:
- `"move the blue rectangle to position 500, 300"`
- `"make the circle bigger"`
- `"change the text color to red"`
- `"delete the yellow square"`

---

### Phase 4: Update Agent Prompt (30 min)

**Goal**: Agent knows when and how to use manipulation tools

#### Tasks:

1. **Update System Prompt**
   
   **File**: `packages/backend/agents/prompts.py`
   
   Update `CANVAS_AGENT_SYSTEM_PROMPT`:
   
   ```python
   CANVAS_AGENT_SYSTEM_PROMPT = """You are an AI assistant that helps users create and manipulate shapes on a collaborative canvas.

You have access to tools that let you:
1. **Read** the current canvas state
2. **Create** new shapes (rectangles, circles, text, grids, forms)
3. **Manipulate** existing shapes (move, resize, change color, delete)

## IMPORTANT: Two-Step Process for Manipulation

When a user asks to manipulate existing shapes (move, resize, change color, delete):

**STEP 1**: ALWAYS call `get_canvas_shapes()` first to see what's on the canvas
**STEP 2**: Identify the target shape by analyzing:
   - Shape type (rectangle, circle, text)
   - Color (fill property in hex)
   - Position (x, y coordinates)
   - Text content (for text shapes)

**STEP 3**: Call the appropriate manipulation tool with the shape's ID

### Examples:

**User**: "move the blue rectangle to the right"
**You should**:
1. Call get_canvas_shapes() → finds shape with id="abc-123", type="rectangle", fill="#0000FF", x=100
2. Calculate new position: x=100 + 150 = 250 (move right)
3. Call move_shape(shape_id="abc-123", new_x=250, new_y=100)

**User**: "make the red circle bigger"
**You should**:
1. Call get_canvas_shapes() → finds shape with id="def-456", type="circle", fill="#FF0000", width=60
2. Calculate new size: 60 * 1.5 = 90 (50% bigger)
3. Call resize_shape(shape_id="def-456", new_width=90, new_height=90)

**User**: "change the text to green"
**You should**:
1. Call get_canvas_shapes() → finds shape with id="ghi-789", type="text"
2. Call change_shape_color(shape_id="ghi-789", new_color="green")

## Shape Properties Reference

### Rectangle / Circle
- x, y: Center position on canvas
- width, height: Dimensions in pixels
- fill: Color in hex format (e.g., "#0000FF" for blue)
- rotation: Angle in degrees (0-360)

### Text
- x, y: Position on canvas
- text: The text content
- fontSize: Size in pixels
- fill: Text color in hex format

## Color Guidelines

Always use hex colors in your output:
- Red: #FF0000
- Blue: #0000FF
- Green: #00FF00
- Yellow: #FFFF00
- Purple: #800080
- Orange: #FFA500
- Black: #000000
- White: #FFFFFF

## Position Guidelines

- Canvas is typically 1200x800 pixels
- Origin (0, 0) is top-left corner
- x increases to the right
- y increases downward
- Default position for new shapes: around (200, 150)
- Space shapes at least 50-100 pixels apart for grids

## Helpful Behaviors

1. **Be specific**: Always use exact IDs when manipulating shapes
2. **Be descriptive**: Explain what you're doing in your responses
3. **Handle ambiguity**: If multiple shapes match (e.g., two blue rectangles), ask the user to clarify
4. **Validate**: If a shape doesn't exist, tell the user
5. **Relative movements**: 
   - "move right" → add ~100-150 to x
   - "move down" → add ~100-150 to y
   - "move up" → subtract from y
   - "move left" → subtract from x

6. **Relative sizing**:
   - "bigger" → multiply by 1.5
   - "smaller" → multiply by 0.7
   - "double size" → multiply by 2
   - "half size" → multiply by 0.5

Remember: You are helpful, precise, and always verify before making changes!
"""
   ```

2. **Test Prompt Understanding**
   
   Test with commands that require reasoning:
   - `"what's on the canvas?"` - Should call get_canvas_shapes
   - `"move all rectangles to the right"` - Should get shapes, filter rectangles, move each
   - `"delete shapes in the top-left corner"` - Should get shapes, filter by position, delete

#### Validation:

Agent should now:
1. Automatically call `get_canvas_shapes()` before manipulation
2. Correctly identify shapes by properties
3. Handle ambiguous cases (ask for clarification)
4. Provide clear feedback about what it did

---

### Phase 5: Update API to Pass `session_id` (15 min)

**Goal**: Backend receives and uses `session_id` from frontend

#### Tasks:

1. **Update Request Model**
   
   **File**: `packages/backend/main.py`
   
   Update `AICommandRequest`:
   ```python
   class AICommandRequest(BaseModel):
       """Request model for AI command execution"""
       command: str = Field(..., description="Natural language command to execute")
       canvas_id: Optional[str] = Field("main-canvas", description="ID of the canvas")
       user_id: Optional[str] = Field(None, description="ID of the user making the request")
       session_id: Optional[str] = Field("ai-agent", description="Session ID of the browser tab")
   ```

2. **Update Agent Execution**
   
   Modify `execute_canvas_command` in `agents/canvas_agent.py`:
   
   ```python
   def execute_canvas_command(
       command: str,
       canvas_id: str = "main-canvas",
       user_id: str = None,
       session_id: str = "ai-agent"  # NEW parameter
   ) -> Dict[str, Any]:
       """Execute a canvas command and return the resulting shapes."""
       try:
           # Create agent
           agent = create_canvas_agent()
           
           # Build context for the agent
           # Note: canvas_id and session_id are used by tools, not passed directly
           agent_input = {
               "input": command,
               "canvas_id": canvas_id,
               "session_id": session_id,
           }
           
           # Execute command
           result = agent.invoke(agent_input)
           
           # ... rest of function
   ```

3. **Update API Endpoint**
   
   In `main.py`, update the endpoint call:
   ```python
   @app.post("/api/ai/command", response_model=AICommandResponse)
   async def execute_ai_command(request: AICommandRequest):
       # ...
       result = execute_canvas_command(
           command=request.command,
           canvas_id=request.canvas_id,
           user_id=request.user_id,
           session_id=request.session_id  # NEW
       )
       # ...
   ```

4. **Update Frontend Hook**
   
   **File**: `packages/frontend/src/hooks/useAIAgent.js`
   
   Add `sessionId` parameter:
   ```javascript
   export const useAIAgent = (canvasId, userId, sessionId) => {  // NEW param
     // ...
     
     const executeCommand = useCallback(async (command) => {
       // ...
       body: JSON.stringify({
         command: command.trim(),
         canvas_id: canvasId,
         user_id: userId,
         session_id: sessionId,  // NEW field
       }),
       // ...
     }, [canvasId, userId, sessionId]);  // Updated deps
     
     // ...
   };
   ```

5. **Update AIPanel to Pass `sessionId`**
   
   **File**: `packages/frontend/src/components/Canvas/AIPanel.jsx`
   
   Update hook usage (line 28):
   ```javascript
   const { executeCommand, isLoading, error, clearError, lastResponse } = useAIAgent(
     canvasId,
     currentUser?.uid,
     sessionId  // Already being passed as prop!
   );
   ```

#### Validation:

- Check backend logs: should show `session_id` in requests
- Verify Firestore: updated shapes should have `sessionId` field
- Check if it's the frontend's session ID (UUID) or "ai-agent"

---

### Phase 6: Update Tools to Use Context (30 min)

**Goal**: Tools have access to `canvas_id`, `user_id`, `session_id` from context

This is needed because LangChain tools don't automatically receive context from the agent invocation.

#### Tasks:

1. **Create Context Manager**
   
   **File**: `packages/backend/agents/context.py`
   
   ```python
   """
   Agent execution context
   
   Provides a way to pass context (canvas_id, user_id, session_id) to tools
   during agent execution.
   """
   
   from contextvars import ContextVar
   from typing import Optional
   
   # Context variables (thread-safe)
   _canvas_id: ContextVar[str] = ContextVar('canvas_id', default='main-canvas')
   _user_id: ContextVar[Optional[str]] = ContextVar('user_id', default=None)
   _session_id: ContextVar[str] = ContextVar('session_id', default='ai-agent')
   
   def set_context(canvas_id: str, user_id: Optional[str], session_id: str):
       """Set execution context for the current agent run"""
       _canvas_id.set(canvas_id)
       _user_id.set(user_id)
       _session_id.set(session_id)
   
   def get_canvas_id() -> str:
       """Get current canvas_id from context"""
       return _canvas_id.get()
   
   def get_user_id() -> Optional[str]:
       """Get current user_id from context"""
       return _user_id.get()
   
   def get_session_id() -> str:
       """Get current session_id from context"""
       return _session_id.get()
   ```

2. **Update Agent to Set Context**
   
   **File**: `packages/backend/agents/canvas_agent.py`
   
   ```python
   from .context import set_context
   
   def execute_canvas_command(
       command: str,
       canvas_id: str = "main-canvas",
       user_id: str = None,
       session_id: str = "ai-agent"
   ) -> Dict[str, Any]:
       """Execute a canvas command and return the resulting shapes."""
       try:
           # Set context for tools to use
           set_context(canvas_id, user_id, session_id)
           
           # Create agent
           agent = create_canvas_agent()
           
           # Execute command
           result = agent.invoke({"input": command})
           
           # ... rest
   ```

3. **Update Tools to Use Context**
   
   **File**: `packages/backend/agents/tools.py`
   
   Add import at top:
   ```python
   from .context import get_canvas_id, get_user_id, get_session_id
   ```
   
   Update each manipulation tool to use context:
   ```python
   @tool
   def move_shape(
       shape_id: str,
       new_x: float,
       new_y: float
   ) -> Dict[str, Any]:
       """Move a shape to a new position by its ID."""
       from services.firebase_service import update_shape as update_shape_in_firestore
       
       # Get context
       canvas_id = get_canvas_id()
       session_id = get_session_id()
       user_id = get_user_id()
       
       try:
           success = update_shape_in_firestore(
               shape_id=shape_id,
               updates={'x': float(new_x), 'y': float(new_y)},
               canvas_id=canvas_id,
               session_id=session_id,
               user_id=user_id
           )
           # ... rest
   ```
   
   Apply same pattern to:
   - `resize_shape`
   - `change_shape_color`
   - `delete_shape_by_id`
   - `get_canvas_shapes`

#### Validation:

- Create a shape via frontend
- Ask AI to move it
- Check Firestore: `sessionId` should be the frontend's session UUID, not "ai-agent"
- Check `userId` field matches the current user

---

## Testing Plan

### Test Cases

#### Basic Reading
- [ ] `"what shapes are on the canvas?"` → Agent lists all shapes
- [ ] `"how many rectangles are there?"` → Agent counts and reports
- [ ] `"describe the canvas"` → Agent provides detailed description

#### Move Operations
- [ ] `"move the blue rectangle to 500, 300"` → Shape moves to exact position
- [ ] `"move the circle to the right"` → Circle x increases by ~100-150
- [ ] `"move all text up"` → All text shapes y decreases

#### Resize Operations
- [ ] `"make the square bigger"` → Shape increases in size
- [ ] `"double the size of the red circle"` → Circle doubles
- [ ] `"make the rectangle smaller"` → Rectangle shrinks

#### Color Changes
- [ ] `"change the blue square to red"` → Color updates
- [ ] `"make everything green"` → All shapes turn green
- [ ] `"change the text color to purple"` → Text color updates

#### Delete Operations
- [ ] `"delete the yellow circle"` → Shape is removed
- [ ] `"remove all rectangles"` → All rectangles deleted
- [ ] `"clear shapes in the top-left"` → Shapes in that area deleted

#### Edge Cases
- [ ] `"move the blue rectangle"` when there are 2 blue rectangles → Agent asks for clarification
- [ ] `"resize the circle"` when no circle exists → Agent reports not found
- [ ] `"move everything right"` → Agent moves all shapes
- [ ] Empty canvas: `"what's on the canvas?"` → Agent reports empty

#### Complex Commands
- [ ] `"move the login form to the center"` → Moves all related shapes
- [ ] `"arrange all circles in a line"` → Repositions multiple shapes
- [ ] `"make the blue shapes bigger than the red ones"` → Comparative resizing

---

## Deployment Updates

### Environment Variables

Add to production environment (Render.com):

```bash
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

### Service Account Deployment

**Option A: Environment Variable (Recommended)**
Store the entire JSON as an environment variable:

1. In Render dashboard, add env var:
   ```
   FIREBASE_SERVICE_ACCOUNT_JSON=<paste entire JSON content>
   ```

2. Update `firebase_service.py`:
   ```python
   import json
   
   def initialize_firebase():
       # Try environment variable first (production)
       service_account_json = os.getenv('FIREBASE_SERVICE_ACCOUNT_JSON')
       if service_account_json:
           cred_dict = json.loads(service_account_json)
           cred = credentials.Certificate(cred_dict)
       else:
           # Fall back to file (development)
           cred_path = os.getenv('FIREBASE_SERVICE_ACCOUNT_PATH',
                                './firebase-service-account.json')
           cred = credentials.Certificate(cred_path)
       
       firebase_admin.initialize_app(cred)
       # ...
   ```

**Option B: Secret File (Alternative)**
Upload file directly to Render using their secret files feature.

---

## Success Criteria

### Must Have ✅
- [ ] Backend can read all shapes from Firestore
- [ ] Backend can update shape properties (position, size, color)
- [ ] Backend can delete shapes
- [ ] Agent correctly calls `get_canvas_shapes()` before manipulation
- [ ] Agent identifies shapes by analyzing properties (type, color, position)
- [ ] Frontend updates automatically when backend modifies Firestore
- [ ] `sessionId` and `userId` are correctly tracked
- [ ] All manipulation commands work end-to-end

### Should Have 🎯
- [ ] Agent handles ambiguous cases (multiple matching shapes)
- [ ] Agent provides clear feedback about what it did
- [ ] Agent handles empty canvas gracefully
- [ ] Error handling for non-existent shapes
- [ ] Relative movements ("move right", "make bigger")

### Nice to Have 💎
- [ ] Batch operations (move all X shapes)
- [ ] Complex queries ("shapes in the top-left")
- [ ] Undo/redo support (command history)
- [ ] Preview before applying changes

---

## Rollback Plan

If issues occur in production:

1. **Quick Fix**: Disable manipulation tools, keep creation working
   ```python
   # In tools.py
   ALL_TOOLS = [
       create_shape,
       create_text,
       create_grid,
       create_form,
       # Temporarily disable manipulation
       # get_canvas_shapes,
       # move_shape,
       # resize_shape,
       # ...
   ]
   ```

2. **Full Rollback**: Revert to previous backend version
   ```bash
   git revert <commit-hash>
   git push
   ```

3. **Frontend**: No changes needed, continues working as before

---

## Performance Considerations

### Firestore Read Limits
- Free tier: 50,000 reads/day
- Each `get_canvas_shapes()` call = 1 read per shape
- Estimated usage: ~100 shapes × 100 commands/day = 10,000 reads/day ✅

### Optimization Ideas
1. **Cache canvas state** for 5-10 seconds between tool calls
2. **Batch updates** when moving multiple shapes
3. **Lazy loading**: Only fetch shapes that match certain criteria

---

## Future Enhancements

### Short Term
1. **Shape grouping**: "move the login form" moves all related shapes
2. **Undo/redo**: Track command history
3. **Animations**: Smooth transitions for AI changes
4. **Preview mode**: Show what will change before applying

### Medium Term
1. **Natural language queries**: "show me shapes created by John"
2. **Conditional operations**: "if there's a blue rectangle, move it"
3. **Patterns**: "arrange in a circle", "distribute evenly"
4. **Smart suggestions**: Agent suggests improvements

### Long Term
1. **Voice commands**: Speech-to-text integration
2. **Image recognition**: "move the logo" (identifies logo)
3. **Collaborative AI**: Multiple agents working together
4. **Learning**: Agent learns user preferences over time

---

## Notes

- **Data Consistency**: Backend writes use `SERVER_TIMESTAMP` just like frontend
- **Real-time Sync**: No polling needed, Firestore handles it
- **Error Handling**: Tools return success/failure, agent can retry
- **Security**: Firestore rules still apply (authenticated users only)
- **Testing**: Use dev Firebase project to avoid affecting production

---

## References

- Frontend Firestore utilities: `packages/frontend/src/utils/firestore.js`
- Backend agent tools: `packages/backend/agents/tools.py`
- Firebase Admin SDK docs: https://firebase.google.com/docs/admin/setup
- LangChain tool docs: https://python.langchain.com/docs/modules/agents/tools/

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-17  
**Author**: AI Implementation Team

