import React, { useState, useEffect } from 'react';
import NumericInput from './NumericInput';
import ColorInput from './ColorInput';

/**
 * Test page for input components
 * Access via: http://localhost:5173/test-inputs (after adding route)
 */
const TestInputs = () => {
  const [xPos, setXPos] = useState(100);

  const [yPos, setYPos] = useState(200);
  const [width, setWidth] = useState(150);
  const [height, setHeight] = useState(100);
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [fillColor, setFillColor] = useState('#3B82F6');
  const [strokeColor, setStrokeColor] = useState('#000000');

  // Enable scroll for this test page by overriding root styles
  useEffect(() => {
    const root = document.getElementById('root');
    if (root) {
      root.style.overflow = 'auto';
      root.style.height = 'auto';
    }
    
    // Cleanup: restore original styles when component unmounts
    return () => {
      if (root) {
        root.style.overflow = 'hidden';
        root.style.height = '100vh';
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-white text-3xl font-bold mb-8">
          Input Components Test
        </h1>

        {/* Test Section: Position */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-white text-xl font-semibold mb-4">
            Position Properties
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <NumericInput
              label="X Position"
              value={xPos}
              onChange={(val) => setXPos(val)}
              step={1}
              unit="px"
            />
            <NumericInput
              label="Y Position"
              value={yPos}
              onChange={(val) => setYPos(val)}
              step={1}
              unit="px"
            />
          </div>
          <div className="mt-4 text-gray-400 text-sm">
            Current: X={xPos}, Y={yPos}
          </div>
        </div>

        {/* Test Section: Size */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-white text-xl font-semibold mb-4">
            Size Properties
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <NumericInput
              label="Width"
              value={width}
              onChange={(val) => setWidth(val)}
              step={1}
              unit="px"
              min={1}
            />
            <NumericInput
              label="Height"
              value={height}
              onChange={(val) => setHeight(val)}
              step={1}
              unit="px"
              min={1}
            />
          </div>
          <div className="mt-4 text-gray-400 text-sm">
            Current: {width} × {height}
          </div>
        </div>

        {/* Test Section: Stroke */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-white text-xl font-semibold mb-4">
            Stroke Width
          </h2>
          <NumericInput
            label="Stroke Width"
            value={strokeWidth}
            onChange={(val) => setStrokeWidth(val)}
            step={1}
            unit="px"
            min={0}
            max={100}
          />
          <div className="mt-4 text-gray-400 text-sm">
            Current: {strokeWidth}px
          </div>
        </div>

        {/* Test Section: Colors */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-white text-xl font-semibold mb-4">
            Color Properties
          </h2>
          <div className="space-y-4">
            <ColorInput
              label="Fill Color"
              value={fillColor}
              onChange={(val) => setFillColor(val)}
            />
            <ColorInput
              label="Stroke Color"
              value={strokeColor}
              onChange={(val) => setStrokeColor(val)}
            />
          </div>
          <div className="mt-4 text-gray-400 text-sm">
            Fill: {fillColor} | Stroke: {strokeColor}
          </div>
        </div>

        {/* Visual Preview */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-white text-xl font-semibold mb-4">
            Preview Rectangle
          </h2>
          <div className="bg-gray-700 p-8 rounded flex items-center justify-center">
            <svg width="300" height="300">
              <rect
                x={(300 - width) / 2}
                y={(300 - height) / 2}
                width={width}
                height={height}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
              />
            </svg>
          </div>
        </div>

        {/* Test Instructions */}
        <div className="bg-blue-900 bg-opacity-30 border border-blue-500 rounded-lg p-6 mt-6">
          <h3 className="text-blue-300 font-semibold mb-3">
            🧪 Test Instructions
          </h3>
          <ul className="text-blue-200 text-sm space-y-2">
            <li>• Click on inputs and type values</li>
            <li>• Press <kbd className="px-2 py-0.5 bg-blue-800 rounded">↑</kbd> / <kbd className="px-2 py-0.5 bg-blue-800 rounded">↓</kbd> to increment/decrement</li>
            <li>• Hold <kbd className="px-2 py-0.5 bg-blue-800 rounded">Shift</kbd> + Arrow for 10x step</li>
            <li>• Press <kbd className="px-2 py-0.5 bg-blue-800 rounded">Enter</kbd> to confirm</li>
            <li>• Press <kbd className="px-2 py-0.5 bg-blue-800 rounded">Esc</kbd> to cancel</li>
            <li>• Click color squares to open color picker</li>
            <li>• Type hex codes directly in color inputs</li>
            <li>• See preview rectangle update in real-time</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TestInputs;

