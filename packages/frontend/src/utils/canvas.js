// Canvas constants
export const CANVAS_WIDTH = 3000;
export const CANVAS_HEIGHT = 3000;
export const VIEWPORT_WIDTH = window.innerWidth;
export const VIEWPORT_HEIGHT = window.innerHeight; // Account for expanded header with toolbar

// Performance constants
export const GRID_SIZE = 50;
export const ZOOM_MIN = 0.1;
export const ZOOM_MAX = 5;
export const CURSOR_UPDATE_THROTTLE = 50; // ms - cursor position updates
export const SHAPE_UPDATE_THROTTLE = 100; // ms - shape property/position/resize updates to Firebase
export const VIEWPORT_SAVE_THROTTLE = 500; // ms - viewport (zoom/pan) save to localStorage

// Avatar constants
export const AVATAR_SIZE = 40; // 10 * 4 (w-10 h-10 in Tailwind)
export const AVATAR_FONT_SIZE = 16;

// Shape constants
export const DEFAULT_SHAPE_WIDTH = 100;
export const DEFAULT_SHAPE_HEIGHT = 100;
export const SHAPE_STROKE_WIDTH = 2;
export const MIN_DRAG_DISTANCE = 10;
export const MIN_SHAPE_SIZE = 5;

// Text constants
export const DEFAULT_TEXT_CONTENT = 'Double-click to edit';
export const DEFAULT_FONT_SIZE = 24;
export const DEFAULT_FONT_FAMILY = 'Arial, sans-serif';
export const DEFAULT_FONT_STYLE = 'normal';
export const DEFAULT_TEXT_ALIGN = 'left';
export const DEFAULT_TEXT_WIDTH = 200;
export const DEFAULT_TEXT_HEIGHT = 50;

// Animation and timing constants
export const BUTTON_HOVER_SCALE = 1.05;
export const AVATAR_TRANSITION_DURATION = 200; // ms
export const STATE_UPDATE_DELAY = 100; // ms
export const ZOOM_INTENSITY_MOUSE = 0.1; // 10% per scroll
export const ZOOM_SENSITIVITY_TRACKPAD = 0.01;
export const MOUSE_WHEEL_THRESHOLD = 50; // deltaY threshold to detect mouse vs trackpad

// Batch operation constants
export const FIRESTORE_BATCH_SIZE = 500;
export const STRESS_TEST_SHAPE_COUNT = 500;

// Spacing constants
export const AVATAR_OVERLAP_OFFSET = -10; // px
export const CURRENT_USER_AVATAR_MARGIN = 24; // px
export const HEADER_MIN_HEIGHT = 52; // px

// Color constants
export const PREVIEW_DASH_PATTERN = [5, 5];
export const GRID_COLOR = '#e5e5e5';

// Z-index constants
export const Z_INDEX_INITIALS = 10;
export const Z_INDEX_AVATAR_IMAGE = 20;
export const Z_INDEX_FLOATING_TOOLBAR = 1000;
export const Z_INDEX_PROPERTIES_TOOLBAR = 100;

// Floating Toolbar constants
export const TOOLBAR_BUTTON_SIZE = 48; // px - Figma-style larger buttons
export const TOOLBAR_ICON_SIZE = 24; // px - icon size within buttons
export const TOOLBAR_BUTTON_SPACING = 8; // px - space between buttons
export const TOOLBAR_BOTTOM_OFFSET = 24; // px - distance from bottom of screen
export const TOOLBAR_BORDER_RADIUS = 12; // px - rounded corners
export const TOOLBAR_PADDING = 8; // px - internal padding of toolbar container
export const TOOLBAR_HOVER_SCALE = 1.05; // scale factor on button hover
export const TOOLBAR_TRANSITION_DURATION = 200; // ms - smooth transitions

// Selected button styling constants
export const TOOLBAR_SELECTED_BG = 'bg-blue-100/80'; // selected button background
export const TOOLBAR_SELECTED_BORDER = 'border-blue-300/60'; // selected button border
export const TOOLBAR_SELECTED_ICON_COLOR = 'text-blue-600'; // selected icon color
export const TOOLBAR_DEFAULT_BG = 'bg-transparent'; // default button background
export const TOOLBAR_DEFAULT_BORDER = 'border-transparent'; // default button border
export const TOOLBAR_DEFAULT_ICON_COLOR = 'text-gray-600'; // default icon color

// Properties Toolbar constants
export const PROPERTIES_PANEL_WIDTH = 320; // px - fixed width for properties panel
export const PROPERTIES_PANEL_BACKGROUND = 'bg-gray-800'; // dark theme to match header
export const PROPERTIES_PANEL_BORDER = 'border-gray-700'; // subtle border
export const PROPERTIES_PANEL_TEXT_COLOR = 'text-white'; // text color for dark theme
export const PROPERTIES_SECTION_SPACING = 16; // px - space between property sections
export const PROPERTIES_INPUT_HEIGHT = 32; // px - standard input height
export const PROPERTIES_LABEL_COLOR = 'text-gray-300'; // label color for dark theme

// Selection constants
export const SELECTION_STROKE_WIDTH = 2; // px - selection border
export const SELECTION_STROKE_COLOR = '#3B82F6'; // blue border for selected shapes
export const SELECTION_DASH_PATTERN = []; // solid line for selection
export const SELECTION_HANDLE_SIZE = 8; // px - size of corner/edge handles
export const SELECTION_HANDLE_FILL = '#FFFFFF'; // white fill for handles
export const SELECTION_HANDLE_STROKE = '#3B82F6'; // blue stroke for handles
export const SELECTION_HANDLE_STROKE_WIDTH = 2; // px - handle border width

// Marquee selection constants
export const MARQUEE_STROKE_COLOR = '#3B82F6'; // blue border for marquee
export const MARQUEE_STROKE_WIDTH = 1.5; // px - thinner than selection border
export const MARQUEE_FILL_COLOR = 'rgba(59, 130, 246, 0.1)'; // semi-transparent blue fill
export const MARQUEE_DASH_PATTERN = [5, 5]; // dashed line for marquee
export const Z_INDEX_MARQUEE = 500; // above shapes, below floating toolbar

// Helper function to get the appropriate cursor based on active mode
export const getCursorForMode = (modes) => {
  const { isPanMode, addMode, isDeleteMode, isSelectMode, isDraggingCanvas } = modes;
  
  if (isPanMode) {
    return isDraggingCanvas ? 'grabbing' : 'grab';
  }
  if (addMode !== 'none') return 'crosshair';
  if (isDeleteMode) return 'not-allowed';
  if (isSelectMode) return 'default'; // Using native CSS cursor instead of custom SVG
  return 'default';
};
