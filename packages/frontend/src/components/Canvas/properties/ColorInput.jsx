import React, { useState, useEffect, useRef } from 'react';
import { HexColorPicker } from 'react-colorful';
import { subscribeToUserFavoriteColors, addFavoriteColor } from '../../../utils/firestore';

/**
 * Color input component for property editing
 * 
 * Features:
 * - Visual color preview with popup picker
 * - Text input for hex codes
 * - Custom color picker popup with recent colors
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
  const pickerRef = useRef(null);

  // Sync with external value changes
  useEffect(() => {
    if (!isFocused) {
      setLocalValue(value);
    }
  }, [value, isFocused]);

  // Subscribe to user's favorite colors
  useEffect(() => {
    console.log('[ColorInput] userId:', userId);
    if (!userId) return;
    
    const unsubscribe = subscribeToUserFavoriteColors(userId, (colors) => {
      console.log('[ColorInput] Received favorite colors:', colors);
      setFavoriteColors(colors);
    });
    
    return () => unsubscribe();
  }, [userId]);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        closePicker();
      }
    };

    if (isPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isPickerOpen, localValue, colorBeforeOpen]);

  // No need to auto-open - custom picker is always visible

  // Save color to favorites when it changes
  const saveColorToFavorites = async (color) => {
    console.log('[ColorInput] saveColorToFavorites called:', { userId, color });
    if (!userId || !color) {
      console.log('[ColorInput] Skipping save - no userId or color');
      return;
    }
    
    // Only save valid hex colors
    const hexPattern = /^#[0-9A-Fa-f]{6}$/;
    if (hexPattern.test(color)) {
      console.log('[ColorInput] Saving color to Firebase:', color);
      await addFavoriteColor(userId, color.toUpperCase());
    } else {
      console.log('[ColorInput] Invalid color format:', color);
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
    onChange(color);
    // Don't save yet - will save on close
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
    // Save color to favorites when closing (if changed)
    if (localValue !== colorBeforeOpen) {
      saveColorToFavorites(localValue);
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
        {/* Color preview button with popup */}
        <div className="relative" ref={pickerRef}>
          <button
            type="button"
            onClick={togglePicker}
            disabled={disabled}
            className="w-10 h-8 rounded border-2 border-gray-600 hover:border-blue-500 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: localValue }}
            title="Click to pick a color"
          />
          
          {/* Color picker popup - single view with picker + favorites */}
          {isPickerOpen && (
            <div className="absolute left-0 top-10 z-50 bg-gray-800 border border-gray-600 rounded-lg shadow-2xl min-w-[280px] p-3">
              {/* Color picker */}
              <div className="mb-3">
                <HexColorPicker 
                  color={localValue} 
                  onChange={(color) => {
                    setLocalValue(color);
                    onChange(color);
                  }}
                  style={{ width: '100%' }}
                />
              </div>
              
              {/* Favorite colors */}
              {userId && favoriteColors.length > 0 && (
                <div className="border-t border-gray-700 pt-3">
                  <label className="text-gray-400 text-xs font-medium mb-2 block">
                    Recent Colors
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {favoriteColors.map((color, index) => (
                      <button
                        key={`${color}-${index}`}
                        onClick={() => handleFavoriteColorClick(color)}
                        className="w-full aspect-square rounded border-2 border-gray-600 hover:border-blue-500 hover:scale-110 transition-all"
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

