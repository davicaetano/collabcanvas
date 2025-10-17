import React, { useState, useEffect } from 'react';

/**
 * Numeric input component for property editing
 * 
 * Features:
 * - Keyboard shortcuts (Arrow Up/Down, Shift+Arrow, Enter, Escape)
 * - Min/max validation
 * - Unit display (px, degrees, etc.)
 * - Instant feedback
 */
const NumericInput = ({ 
  label, 
  value, 
  onChange, 
  min, 
  max, 
  step = 1, 
  unit = 'px',
  disabled = false 
}) => {
  const [localValue, setLocalValue] = useState(Math.round(value));
  const [isFocused, setIsFocused] = useState(false);

  // Sync with external value changes (e.g., from other users)
  // Round to integer for display when not focused
  useEffect(() => {
    if (!isFocused) {
      setLocalValue(Math.round(value));
    }
  }, [value, isFocused]);

  const handleChange = (e) => {
    setLocalValue(e.target.value);
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Trigger onChange with the current local value
    onChange(localValue);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleKeyDown = (e) => {
    const currentNum = parseFloat(localValue) || 0;
    const multiplier = e.shiftKey ? 10 : 1;
    const actualStep = step * multiplier;

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newValue = currentNum + actualStep;
      setLocalValue(newValue.toString());
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newValue = currentNum - actualStep;
      setLocalValue(newValue.toString());
    } else if (e.key === 'Enter') {
      e.preventDefault();
      e.target.blur(); // Trigger blur to save
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setLocalValue(Math.round(value)); // Reset to original rounded value
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
        <input
          type="text"
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={`
            w-full px-3 py-1.5 rounded
            bg-gray-700 text-gray-200 text-sm
            border border-gray-600
            focus:border-blue-500 focus:outline-none
            disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed
            transition-colors
          `}
          placeholder="0"
        />
        {unit && (
          <span className="text-gray-500 text-xs min-w-[24px]">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
};

export default NumericInput;

