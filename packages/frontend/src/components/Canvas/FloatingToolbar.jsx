import React from 'react';
import { MousePointer2, Hand, Square, Circle, Type } from 'lucide-react';
import {
  TOOLBAR_BUTTON_SIZE,
  TOOLBAR_ICON_SIZE,
  TOOLBAR_BUTTON_SPACING,
  TOOLBAR_BOTTOM_OFFSET,
  TOOLBAR_BORDER_RADIUS,
  TOOLBAR_PADDING,
  TOOLBAR_HOVER_SCALE,
  TOOLBAR_TRANSITION_DURATION,
  Z_INDEX_FLOATING_TOOLBAR,
  TOOLBAR_SELECTED_BG,
  TOOLBAR_SELECTED_BORDER,
  TOOLBAR_SELECTED_ICON_COLOR,
  TOOLBAR_DEFAULT_BG,
  TOOLBAR_DEFAULT_BORDER,
  TOOLBAR_DEFAULT_ICON_COLOR
} from '../../utils/canvas';

const FloatingToolbar = ({ selectedTool, onToolChange }) => {
  // Define toolbar buttons with their icons
  const toolbarButtons = [
    {
      id: 'select',
      icon: MousePointer2,
      tooltip: 'Select (V)',
    },
    {
      id: 'pan',
      icon: Hand,
      tooltip: 'Pan (H)',
    },
    {
      id: 'rectangle',
      icon: Square,
      tooltip: 'Rectangle (R)',
    },
    {
      id: 'circle',
      icon: Circle,
      tooltip: 'Circle (C)',
    },
    {
      id: 'text',
      icon: Type,
      tooltip: 'Text (T)',
    },
  ];

  const handleButtonClick = (buttonId) => {
    // Call parent handler to update tool selection and canvas modes
    onToolChange(buttonId);
  };

  return (
    <div
      className="fixed left-1/2 transform -translate-x-1/2"
      style={{
        top: '88px', // Header height (~64px) + spacing (24px)
        zIndex: Z_INDEX_FLOATING_TOOLBAR,
      }}
    >
      {/* Dark toolbar container */}
      <div
        className="flex items-center bg-gray-800/95 backdrop-blur-md border border-gray-700 shadow-lg"
        style={{
          borderRadius: `${TOOLBAR_BORDER_RADIUS}px`,
          padding: `${TOOLBAR_PADDING}px`,
          gap: `${TOOLBAR_BUTTON_SPACING}px`,
        }}
      >
        {toolbarButtons.map((button) => {
          const IconComponent = button.icon;
          const isSelected = selectedTool === button.id;
          
          return (
            <button
              key={button.id}
              onClick={() => handleButtonClick(button.id)}
              className={`flex items-center justify-center hover:bg-blue-600/20 border hover:border-blue-500 transition-all duration-200 ease-out group ${
                isSelected 
                  ? 'bg-blue-600/30 border-blue-500' 
                  : 'bg-transparent border-gray-700'
              }`}
              style={{
                width: `${TOOLBAR_BUTTON_SIZE}px`,
                height: `${TOOLBAR_BUTTON_SIZE}px`,
                borderRadius: `${TOOLBAR_BORDER_RADIUS - 4}px`, // Slightly smaller radius for buttons
                transitionDuration: `${TOOLBAR_TRANSITION_DURATION}ms`,
              }}
              title={button.tooltip}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = `scale(${TOOLBAR_HOVER_SCALE})`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <IconComponent
                size={TOOLBAR_ICON_SIZE}
                className={`group-hover:text-blue-400 transition-colors duration-200 ${
                  isSelected ? 'text-blue-400' : 'text-gray-300'
                }`}
                strokeWidth={1.5}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FloatingToolbar;
