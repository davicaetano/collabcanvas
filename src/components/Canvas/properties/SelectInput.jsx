import React from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

/**
 * SelectInput Component
 * 
 * Dropdown select input for the properties panel
 */
const SelectInput = ({ label, value, onChange, options = [] }) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-gray-400 text-xs mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-gray-700 text-white text-sm px-3 py-2 pr-8 rounded border border-gray-600 focus:border-blue-500 focus:outline-none transition-colors appearance-none cursor-pointer"
          style={{
            fontFamily: 'inherit',
          }}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
          <ChevronDownIcon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
};

export default SelectInput;

