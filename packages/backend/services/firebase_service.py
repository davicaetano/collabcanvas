"""
Firebase Admin SDK service for Firestore operations

This module provides functions to interact with Firestore using the
Firebase Admin SDK. It mirrors the frontend's Firestore operations
to maintain data consistency.
"""

import os
import json
import firebase_admin
from firebase_admin import credentials, firestore
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# Initialize Firebase Admin (singleton)
_db = None
_initialized = False


def initialize_firebase():
    """
    Initialize Firebase Admin SDK
    
    Supports two methods:
    1. Service account file (development): FIREBASE_SERVICE_ACCOUNT_PATH
    2. Service account JSON string (production): FIREBASE_SERVICE_ACCOUNT_JSON
    
    Returns:
        Firestore client instance
    """
    global _db, _initialized
    
    if _initialized and _db is not None:
        return _db
    
    try:
        # Option 1: Try to load from JSON environment variable (production)
        service_account_json = os.getenv('FIREBASE_SERVICE_ACCOUNT_JSON')
        
        if service_account_json:
            logger.info("Initializing Firebase Admin from JSON environment variable")
            cred_dict = json.loads(service_account_json)
            cred = credentials.Certificate(cred_dict)
        else:
            # Option 2: Load from file path (development)
            cred_path = os.getenv('FIREBASE_SERVICE_ACCOUNT_PATH', './firebase-service-account.json')
            
            if not os.path.exists(cred_path):
                raise FileNotFoundError(
                    f"Firebase service account file not found at {cred_path}. "
                    f"Please download it from Firebase Console and place it in the backend directory."
                )
            
            logger.info(f"Initializing Firebase Admin from file: {cred_path}")
            cred = credentials.Certificate(cred_path)
        
        # Initialize app
        firebase_admin.initialize_app(cred)
        _db = firestore.client()
        _initialized = True
        
        logger.info("✓ Firebase Admin SDK initialized successfully")
        return _db
    
    except Exception as e:
        logger.error(f"Failed to initialize Firebase Admin SDK: {e}")
        raise


def get_firestore_client():
    """
    Get Firestore client instance
    
    Returns:
        Firestore client
    """
    if _db is None or not _initialized:
        initialize_firebase()
    return _db


# ==================== SHAPE OPERATIONS ====================

def get_all_shapes(canvas_id: str = "main-canvas") -> List[Dict[str, Any]]:
    """
    Fetch all shapes from a canvas
    
    This replicates the frontend's subscribeToShapes() function
    Path: canvases/{canvas_id}/shapes
    
    Args:
        canvas_id: ID of the canvas (default: "main-canvas")
    
    Returns:
        List of shape dictionaries
    """
    try:
        db = get_firestore_client()
        shapes_ref = db.collection('canvases').document(canvas_id).collection('shapes')
        
        shapes = []
        docs = shapes_ref.stream()
        
        for doc in docs:
            shape_data = doc.to_dict()
            shape_data['id'] = doc.id  # Ensure ID is included
            shapes.append(shape_data)
        
        logger.info(f"Fetched {len(shapes)} shapes from canvas '{canvas_id}'")
        return shapes
    
    except Exception as e:
        logger.error(f"Error fetching shapes from canvas '{canvas_id}': {e}")
        return []


def get_shape_by_id(shape_id: str, canvas_id: str = "main-canvas") -> Optional[Dict[str, Any]]:
    """
    Fetch a single shape by ID
    
    Path: canvases/{canvas_id}/shapes/{shape_id}
    
    Args:
        shape_id: ID of the shape
        canvas_id: ID of the canvas (default: "main-canvas")
    
    Returns:
        Shape dictionary or None if not found
    """
    try:
        db = get_firestore_client()
        doc_ref = db.collection('canvases').document(canvas_id).collection('shapes').document(shape_id)
        doc = doc_ref.get()
        
        if doc.exists:
            shape_data = doc.to_dict()
            shape_data['id'] = doc.id
            logger.info(f"Found shape '{shape_id}' on canvas '{canvas_id}'")
            return shape_data
        
        logger.warning(f"Shape '{shape_id}' not found on canvas '{canvas_id}'")
        return None
    
    except Exception as e:
        logger.error(f"Error fetching shape '{shape_id}': {e}")
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
    
    This replicates the frontend's updateShape() function
    Automatically adds updatedAt timestamp and sessionId
    
    Args:
        shape_id: ID of the shape to update
        updates: Dictionary of fields to update
        user_id: ID of user making the change
        session_id: Session ID (default: "ai-agent" for backend)
        canvas_id: ID of the canvas (default: "main-canvas")
    
    Returns:
        True if successful, False otherwise
    """
    try:
        db = get_firestore_client()
        doc_ref = db.collection('canvases').document(canvas_id).collection('shapes').document(shape_id)
        
        # Add metadata (matching frontend behavior)
        update_data = {
            **updates,
            'updatedAt': firestore.SERVER_TIMESTAMP,
            'sessionId': session_id,
        }
        
        if user_id:
            update_data['userId'] = user_id
        
        doc_ref.update(update_data)
        logger.info(f"Updated shape '{shape_id}' on canvas '{canvas_id}': {list(updates.keys())}")
        return True
    
    except Exception as e:
        logger.error(f"Error updating shape '{shape_id}': {e}")
        return False


def create_shape(
    shape: Dict[str, Any],
    user_id: str = None,
    session_id: str = "ai-agent",
    canvas_id: str = "main-canvas"
) -> bool:
    """
    Create a new shape in Firestore
    
    This replicates the frontend's createShape() function
    Automatically adds createdAt, updatedAt timestamps and sessionId
    
    Args:
        shape: Shape dictionary (must include 'id' field)
        user_id: ID of user creating the shape
        session_id: Session ID (default: "ai-agent")
        canvas_id: ID of the canvas (default: "main-canvas")
    
    Returns:
        True if successful, False otherwise
    """
    try:
        db = get_firestore_client()
        
        if 'id' not in shape:
            raise ValueError("Shape must have an 'id' field")
        
        shape_id = shape['id']
        doc_ref = db.collection('canvases').document(canvas_id).collection('shapes').document(shape_id)
        
        # Add metadata (matching frontend behavior)
        shape_data = {
            **shape,
            'createdAt': firestore.SERVER_TIMESTAMP,
            'updatedAt': firestore.SERVER_TIMESTAMP,
            'sessionId': session_id,
        }
        
        if user_id:
            shape_data['userId'] = user_id
        
        doc_ref.set(shape_data)
        logger.info(f"Created shape '{shape_id}' (type: {shape.get('type')}) on canvas '{canvas_id}'")
        return True
    
    except Exception as e:
        logger.error(f"Error creating shape: {e}")
        return False


def delete_shape(
    shape_id: str,
    canvas_id: str = "main-canvas"
) -> bool:
    """
    Delete a shape from Firestore
    
    This replicates the frontend's deleteShape() function
    
    Args:
        shape_id: ID of the shape to delete
        canvas_id: ID of the canvas (default: "main-canvas")
    
    Returns:
        True if successful, False otherwise
    """
    try:
        db = get_firestore_client()
        doc_ref = db.collection('canvases').document(canvas_id).collection('shapes').document(shape_id)
        
        doc_ref.delete()
        logger.info(f"Deleted shape '{shape_id}' from canvas '{canvas_id}'")
        return True
    
    except Exception as e:
        logger.error(f"Error deleting shape '{shape_id}': {e}")
        return False


def create_shapes_batch(
    shapes: List[Dict[str, Any]],
    user_id: str = None,
    session_id: str = "ai-agent",
    canvas_id: str = "main-canvas"
) -> bool:
    """
    Create multiple shapes in a batch operation
    
    This replicates the frontend's addShapesBatch() function
    
    Args:
        shapes: List of shape dictionaries (each must include 'id' field)
        user_id: ID of user creating the shapes
        session_id: Session ID (default: "ai-agent")
        canvas_id: ID of the canvas (default: "main-canvas")
    
    Returns:
        True if successful, False otherwise
    """
    try:
        db = get_firestore_client()
        batch = db.batch()
        
        shapes_ref = db.collection('canvases').document(canvas_id).collection('shapes')
        
        for shape in shapes:
            if 'id' not in shape:
                raise ValueError("Each shape must have an 'id' field")
            
            shape_id = shape['id']
            doc_ref = shapes_ref.document(shape_id)
            
            # Add metadata
            shape_data = {
                **shape,
                'createdAt': firestore.SERVER_TIMESTAMP,
                'updatedAt': firestore.SERVER_TIMESTAMP,
                'sessionId': session_id,
            }
            
            if user_id:
                shape_data['userId'] = user_id
            
            batch.set(doc_ref, shape_data)
        
        batch.commit()
        logger.info(f"Created {len(shapes)} shapes in batch on canvas '{canvas_id}'")
        return True
    
    except Exception as e:
        logger.error(f"Error creating shapes batch: {e}")
        return False


# ==================== HELPER FUNCTIONS ====================

def shapes_to_simple_format(shapes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Convert shapes to a simplified format for the AI agent
    
    Removes metadata fields that might confuse the AI and only keeps
    the essential shape properties.
    
    Args:
        shapes: List of shape dictionaries from Firestore
    
    Returns:
        List of simplified shape dictionaries
    """
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
        
        # Add type-specific fields
        if shape.get('type') == 'text':
            simplified['text'] = shape.get('text')
            simplified['fontSize'] = shape.get('fontSize')
            simplified['fontFamily'] = shape.get('fontFamily')
        
        # Add optional fields if present
        if 'stroke' in shape:
            simplified['stroke'] = shape.get('stroke')
        if 'strokeWidth' in shape:
            simplified['strokeWidth'] = shape.get('strokeWidth')
        
        simplified_shapes.append(simplified)
    
    return simplified_shapes

