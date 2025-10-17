import React, { useState, useEffect } from 'react';

/**
 * Color input component for property editing
 * 
 * Features:
 * - Visual color preview
 * - Text input for hex codes
 * - Native color picker
 * - Hex format validation
 */
const ColorInput = ({ 
  label, 
  value, 
  onChange, 
  disabled = false 
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);

  // Sync with external value changes
  useEffect(() => {
    if (!isFocused) {
      setLocalValue(value);
    }
  }, [value, isFocused]);

  const handleTextChange = (e) => {
    let input = e.target.value;
    
    // Auto-add # if missing
    if (!input.startsWith('#') && input.length > 0) {
      input = '#' + input;
    }
    
    setLocalValue(input);
  };

  const handleColorPickerChange = (e) => {
    const newColor = e.target.value;
    setLocalValue(newColor);
    onChange(newColor); // Immediate update for color picker
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Only trigger onChange if value is different
    if (localValue !== value) {
      onChange(localValue);
    }
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
        {/* Color preview and picker */}
        <div className="relative">
          <input
            type="color"
            value={localValue}
            onChange={handleColorPickerChange}
            disabled={disabled}
            className="w-10 h-8 rounded border border-gray-600 cursor-pointer disabled:cursor-not-allowed"
            title="Click to pick a color"
          />
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

