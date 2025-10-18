import React, { useState, useEffect, useRef } from 'react';
import { HexColorPicker } from 'react-colorful';
import { subscribeToUserFavoriteColors, addFavoriteColor } from '../../../utils/firestore';

/**
 * Color input component for property editing
 * 
 * Features:
 * - Visual color preview with popover picker
 * - Text input for hex codes
 * - Custom color picker popover with recent colors
 * - Hex format validation
 * - Recent colors history (last 10 used)
 */
const ColorInput = ({ 
  label, 
  value, 
  onChange, 
  disabled = false,
  userId = null
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const [favoriteColors, setFavoriteColors] = useState([]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [colorBeforeOpen, setColorBeforeOpen] = useState(value); // Track color when opened
  const [popoverPosition, setPopoverPosition] = useState({ left: '0', top: '2.5rem' });
  const pickerRef = useRef(null);
  const buttonRef = useRef(null);
  const currentColorRef = useRef(localValue); // Track current color for closePicker
  
  // Keep ref in sync with localValue
  useEffect(() => {
    currentColorRef.current = localValue;
  }, [localValue]);

  // Sync with external value changes
  useEffect(() => {
    if (!isFocused) {
      setLocalValue(value);
    }
  }, [value, isFocused]);

  // Subscribe to user's favorite colors
  useEffect(() => {
    if (!userId) return;
    
    const unsubscribe = subscribeToUserFavoriteColors(userId, (colors) => {
      setFavoriteColors(colors);
    });
    
    return () => unsubscribe();
  }, [userId]);

  // Calculate popover position to keep it in viewport
  useEffect(() => {
    if (isPickerOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const popoverWidth = 180;
      const popoverHeight = favoriteColors.length > 0 ? 280 : 220; // More accurate height
      const gap = 8; // Small gap between button and popover
      
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let leftPos = 0;
      let topPos = buttonRect.height + gap; // Default: below button
      
      // Check if there's space below
      const spaceBelow = viewportHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;
      const spaceRight = viewportWidth - buttonRect.left;
      const spaceLeft = buttonRect.right;
      
      // Vertical positioning: prefer below, fallback to above
      if (spaceBelow < popoverHeight && spaceAbove > spaceBelow) {
        topPos = -(popoverHeight + gap); // Position above
      }
      
      // Horizontal positioning: prefer right side, fallback to left
      if (spaceRight < popoverWidth && spaceLeft > popoverWidth) {
        leftPos = -(popoverWidth - buttonRect.width); // Align right edge with button right edge
      }
      
      setPopoverPosition({
        left: `${leftPos}px`,
        top: `${topPos}px`
      });
    }
  }, [isPickerOpen, favoriteColors.length]);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        // IMPORTANT: Apply changes SYNCHRONOUSLY before the click can propagate
        // This ensures onChange executes even if the component gets unmounted
        const finalColor = currentColorRef.current;
        const beforeColor = colorBeforeOpen;
        
        if (finalColor !== beforeColor) {
          // Save to favorites (onChange already called in real-time during selection)
          saveColorToFavorites(finalColor);
        }
        
        // Close picker AFTER saving to favorites
        setIsPickerOpen(false);
      }
    };

    if (isPickerOpen) {
      // Use mousedown (not click) to execute BEFORE other handlers
      document.addEventListener('mousedown', handleClickOutside, true); // true = capture phase
      return () => document.removeEventListener('mousedown', handleClickOutside, true);
    }
  }, [isPickerOpen, colorBeforeOpen, onChange]);

  // Save color to favorites when it changes
  const saveColorToFavorites = async (color) => {
    if (!userId || !color) {
      return;
    }
    
    // Only save valid hex colors
    const hexPattern = /^#[0-9A-Fa-f]{6}$/;
    if (hexPattern.test(color)) {
      await addFavoriteColor(userId, color.toUpperCase());
    }
  };

  const handleTextChange = (e) => {
    let input = e.target.value;
    
    // Auto-add # if missing
    if (!input.startsWith('#') && input.length > 0) {
      input = '#' + input;
    }
    
    setLocalValue(input);
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Only trigger onChange if value is different
    if (localValue !== value) {
      onChange(localValue);
      saveColorToFavorites(localValue); // Save to favorites when typing
    }
  };

  const handleFavoriteColorClick = (color) => {
    if (disabled) return;
    setLocalValue(color);
    currentColorRef.current = color; // Update ref synchronously
    onChange(color); // Apply change immediately
    // Will save to favorites when picker closes
    closePicker();
  };

  const togglePicker = () => {
    if (!disabled) {
      if (!isPickerOpen) {
        // Opening picker - save current color
        setColorBeforeOpen(localValue);
        setIsPickerOpen(true);
      } else {
        closePicker();
      }
    }
  };

  const closePicker = () => {
    const finalColor = currentColorRef.current;
    // Save to favorites when closing (if changed)
    // Note: onChange is already called in real-time during color selection
    if (finalColor !== colorBeforeOpen) {
      saveColorToFavorites(finalColor); // Save to favorites
    }
    setIsPickerOpen(false);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.target.blur(); // Trigger blur to save
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setLocalValue(value); // Reset to original
      e.target.blur();
    }
  };

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-gray-400 text-xs font-medium">
          {label}
        </label>
      )}
      <div className="flex items-center gap-2">
        {/* Color preview button with popover */}
        <div className="relative">
          <button
            ref={buttonRef}
            type="button"
            onClick={togglePicker}
            disabled={disabled}
            className="w-10 h-8 rounded border-2 border-gray-600 hover:border-blue-500 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: localValue }}
            title="Click to pick a color"
          />
          
          {/* Color picker popover - compact & smart positioning */}
          {isPickerOpen && (
            <div 
              ref={pickerRef}
              className="absolute z-[1200] bg-gray-800 border-2 border-gray-600 rounded-lg shadow-2xl w-[180px] p-3"
              style={popoverPosition}
            >
              {/* Color picker - compact size */}
              <div className="mb-3">
                <HexColorPicker 
                  color={localValue} 
                  onChange={(color) => {
                    // Update local value and apply change immediately for real-time feedback
                    setLocalValue(color);
                    currentColorRef.current = color; // Update ref synchronously
                    onChange(color); // Apply change in real-time
                    // Will save to favorites when picker closes
                  }}
                  style={{ width: '100%', height: '120px' }}
                />
              </div>
              
              {/* Current color display - compact */}
              <div className="mb-3 flex items-center justify-between px-2 py-1.5 bg-gray-700 rounded text-xs">
                <div 
                  className="w-5 h-5 rounded border border-gray-600"
                  style={{ backgroundColor: localValue }}
                />
                <span className="text-gray-200 font-mono">{localValue}</span>
              </div>
              
              {/* Favorite colors - compact grid */}
              {userId && favoriteColors.length > 0 && (
                <div className="border-t border-gray-700 pt-2 mt-2">
                  <label className="text-gray-400 text-[10px] font-medium mb-1.5 block">
                    Recent
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {favoriteColors.map((color, index) => (
                      <button
                        key={`${color}-${index}`}
                        onClick={() => handleFavoriteColorClick(color)}
                        className="w-full aspect-square rounded border border-gray-600 hover:border-blue-500 hover:scale-110 transition-all"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Hex input */}
        <input
          type="text"
          value={localValue}
          onChange={handleTextChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          maxLength={7}
          placeholder="#000000"
          className={`
            flex-1 px-3 py-1.5 rounded
            bg-gray-700 text-gray-200 text-sm font-mono
            border border-gray-600
            focus:border-blue-500 focus:outline-none
            disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed
            transition-colors
          `}
        />
      </div>
    </div>
  );
};

export default ColorInput;

