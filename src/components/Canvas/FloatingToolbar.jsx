import React, { useState } from 'react';
import { MousePointer2, Hand, Square, Trash2 } from 'lucide-react';
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

const FloatingToolbar = () => {
  // State to track which tool is currently selected
  const [selectedTool, setSelectedTool] = useState('select'); // Default to select tool

  // Define toolbar buttons with their icons
  const toolbarButtons = [
    {
      id: 'select',
      icon: MousePointer2,
      tooltip: 'Select Tool',
    },
    {
      id: 'pan',
      icon: Hand,
      tooltip: 'Pan Tool',
    },
    {
      id: 'rectangle',
      icon: Square,
      tooltip: 'Rectangle Tool',
    },
    {
      id: 'delete',
      icon: Trash2,
      tooltip: 'Delete Tool',
    },
  ];

  const handleButtonClick = (buttonId) => {
    // Update selected tool state
    setSelectedTool(buttonId);
  };

  return (
    <div
      className="fixed left-1/2 transform -translate-x-1/2"
      style={{
        bottom: `${TOOLBAR_BOTTOM_OFFSET}px`,
        zIndex: Z_INDEX_FLOATING_TOOLBAR,
      }}
    >
      {/* Glass effect container */}
      <div
        className="flex items-center bg-white/80 backdrop-blur-md border border-white/20 shadow-lg"
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
              className={`flex items-center justify-center hover:bg-blue-100/80 border hover:border-blue-300/60 transition-all duration-200 ease-out group ${
                isSelected 
                  ? `${TOOLBAR_SELECTED_BG} ${TOOLBAR_SELECTED_BORDER}` 
                  : `${TOOLBAR_DEFAULT_BG} ${TOOLBAR_DEFAULT_BORDER}`
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
                className={`group-hover:text-blue-600 transition-colors duration-200 ${
                  isSelected ? TOOLBAR_SELECTED_ICON_COLOR : TOOLBAR_DEFAULT_ICON_COLOR
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
