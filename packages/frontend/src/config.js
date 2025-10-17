/**
 * Application Configuration
 * 
 * Central place for app-wide constants and settings
 */

/**
 * App Version
 * 
 * This version number helps verify that the browser has loaded the latest code.
 * Increment this number whenever making changes to the codebase.
 * 
 * Displayed in the header (dev mode only) to confirm deployment status.
 */
export const APP_VERSION = 9;

/**
 * Check if running in development mode
 */
export const isDevelopmentMode = () => {
  return import.meta.env.VITE_DEV_MODE === 'true' || import.meta.env.DEV;
};

