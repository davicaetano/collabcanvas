import React from 'react';

/**
 * TextInput Component
 * 
 * Textarea input for text content in the properties panel
 */
const TextInput = ({ label, value, onChange, placeholder = '', maxLength = 5000 }) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-gray-400 text-xs mb-1">
          {label}
        </label>
      )}
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full bg-gray-700 text-white text-sm px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none transition-colors resize-none"
        rows={3}
        style={{
          fontFamily: 'inherit',
        }}
      />
      {maxLength && (
        <div className="text-gray-500 text-xs mt-1 text-right">
          {(value || '').length} / {maxLength}
        </div>
      )}
    </div>
  );
};

export default TextInput;

