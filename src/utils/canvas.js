// Canvas constants
export const CANVAS_WIDTH = 3000;
export const CANVAS_HEIGHT = 3000;
export const VIEWPORT_WIDTH = window.innerWidth;
export const VIEWPORT_HEIGHT = window.innerHeight; // Account for expanded header with toolbar

// Performance constants
export const GRID_SIZE = 50;
export const ZOOM_MIN = 0.1;
export const ZOOM_MAX = 5;
export const CURSOR_UPDATE_THROTTLE = 50; // ms - synchronized updates

// Avatar constants
export const AVATAR_SIZE = 40; // 10 * 4 (w-10 h-10 in Tailwind)
export const AVATAR_FONT_SIZE = 16;

// Shape constants
export const DEFAULT_SHAPE_WIDTH = 100;
export const DEFAULT_SHAPE_HEIGHT = 100;
export const SHAPE_STROKE_WIDTH = 2;
export const MIN_DRAG_DISTANCE = 10;
export const MIN_SHAPE_SIZE = 5;

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
