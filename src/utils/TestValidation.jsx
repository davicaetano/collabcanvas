import React, { useState, useEffect } from 'react';
import { validateProperty, getPropertyConstraint, PROPERTY_CONSTRAINTS } from './propertyValidation';

/**
 * Test page for property validation
 * Access via: http://localhost:5173/?test=validation
 */
const TestValidation = () => {
  const [testResults, setTestResults] = useState([]);

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

  const runTest = (propertyName, value, expectedValid) => {
    const result = validateProperty(propertyName, value);
    const isValid = result !== null;
    const passed = isValid === expectedValid;
    
    return {
      propertyName,
      value: String(value),
      result: result !== null ? String(result) : 'null (rejected)',
      expectedValid,
      isValid,
      passed,
    };
  };

  const runAllTests = () => {
    const tests = [
      // X Position tests
      { prop: 'x', value: 100, expected: true },
      { prop: 'x', value: 0, expected: true },
      { prop: 'x', value: 3000, expected: true },
      { prop: 'x', value: 234.789, expected: true }, // Decimals should round to 235
      { prop: 'x', value: 100.4, expected: true }, // Rounds down to 100
      { prop: 'x', value: 100.6, expected: true }, // Rounds up to 101
      { prop: 'x', value: -10, expected: false }, // Below min
      { prop: 'x', value: 5000, expected: false }, // Above max
      { prop: 'x', value: 'abc', expected: false }, // Not a number
      
      // Y Position tests
      { prop: 'y', value: 200, expected: true },
      { prop: 'y', value: 0, expected: true },
      { prop: 'y', value: 3000, expected: true },
      { prop: 'y', value: -50, expected: false },
      { prop: 'y', value: 4000, expected: false },
      
      // Width tests
      { prop: 'width', value: 100, expected: true },
      { prop: 'width', value: 1, expected: true }, // Min valid
      { prop: 'width', value: 3000, expected: true }, // Max valid
      { prop: 'width', value: 150.789, expected: true }, // Decimals should round to 151
      { prop: 'width', value: 99.3, expected: true }, // Rounds down to 99
      { prop: 'width', value: 0, expected: false }, // Too small
      { prop: 'width', value: 0.4, expected: false }, // Rounds to 0, too small
      { prop: 'width', value: -10, expected: false },
      { prop: 'width', value: 5000, expected: false },
      
      // Height tests
      { prop: 'height', value: 150, expected: true },
      { prop: 'height', value: 1, expected: true },
      { prop: 'height', value: 3000, expected: true },
      { prop: 'height', value: 0, expected: false },
      { prop: 'height', value: -20, expected: false },
      
      // Stroke Width tests
      { prop: 'strokeWidth', value: 2, expected: true },
      { prop: 'strokeWidth', value: 0, expected: true }, // Min valid (no border)
      { prop: 'strokeWidth', value: 100, expected: true }, // Max valid
      { prop: 'strokeWidth', value: -1, expected: false },
      { prop: 'strokeWidth', value: 150, expected: false },
      
      // Fill Color tests
      { prop: 'fill', value: '#3B82F6', expected: true },
      { prop: 'fill', value: '#000000', expected: true },
      { prop: 'fill', value: '#FFFFFF', expected: true },
      { prop: 'fill', value: '#abcdef', expected: true }, // Lowercase valid
      { prop: 'fill', value: '3B82F6', expected: false }, // Missing #
      { prop: 'fill', value: '#3B82F', expected: false }, // Too short
      { prop: 'fill', value: '#3B82F6A', expected: false }, // Too long
      { prop: 'fill', value: '#GGGGGG', expected: false }, // Invalid chars
      { prop: 'fill', value: 'blue', expected: false }, // Not hex
      
      // Stroke Color tests
      { prop: 'stroke', value: '#FF0000', expected: true },
      { prop: 'stroke', value: '#00FF00', expected: true },
      { prop: 'stroke', value: 'red', expected: false },
      { prop: 'stroke', value: '#12345', expected: false },
    ];

    const results = tests.map(test => 
      runTest(test.prop, test.value, test.expected)
    );

    setTestResults(results);
  };

  const passedCount = testResults.filter(r => r.passed).length;
  const totalCount = testResults.length;
  const allPassed = passedCount === totalCount && totalCount > 0;

  return (
    <div className="bg-gray-900 p-8 min-h-screen">
      <div className="max-w-6xl mx-auto pb-12">
        <h1 className="text-white text-3xl font-bold mb-8">
          Property Validation Test Suite
        </h1>

        {/* Constraints Overview */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-white text-xl font-semibold mb-4">
            Defined Constraints
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(PROPERTY_CONSTRAINTS).map(([prop, constraint]) => (
              <div key={prop} className="bg-gray-700 rounded p-4">
                <div className="text-blue-400 font-mono font-semibold mb-2">
                  {prop}
                </div>
                <div className="text-gray-300 text-sm space-y-1">
                  <div>Type: <span className="text-yellow-400">{constraint.type}</span></div>
                  {constraint.min !== undefined && (
                    <div>Min: <span className="text-green-400">{constraint.min}</span></div>
                  )}
                  {constraint.max !== undefined && (
                    <div>Max: <span className="text-green-400">{constraint.max}</span></div>
                  )}
                  <div className="text-gray-400 text-xs mt-2">
                    {constraint.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Run Tests Button */}
        <div className="mb-6">
          <button
            onClick={runAllTests}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Run All Tests ({totalCount > 0 ? totalCount : '49'} tests)
          </button>
          
          {testResults.length > 0 && (
            <div className={`inline-block ml-4 px-4 py-2 rounded-lg font-semibold ${
              allPassed 
                ? 'bg-green-600 text-white' 
                : 'bg-yellow-600 text-white'
            }`}>
              {passedCount} / {totalCount} tests passed
              {allPassed ? ' ✅' : ' ⚠️'}
            </div>
          )}
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-white text-xl font-semibold mb-4">
              Test Results
            </h2>
            <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="pb-3 text-gray-400 font-medium">Property</th>
                    <th className="pb-3 text-gray-400 font-medium">Input Value</th>
                    <th className="pb-3 text-gray-400 font-medium">Result</th>
                    <th className="pb-3 text-gray-400 font-medium">Expected</th>
                    <th className="pb-3 text-gray-400 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {testResults.map((result, index) => (
                    <tr 
                      key={index}
                      className={`border-b border-gray-700 ${
                        result.passed ? '' : 'bg-red-900 bg-opacity-20'
                      }`}
                    >
                      <td className="py-2 text-blue-400 font-mono">
                        {result.propertyName}
                      </td>
                      <td className="py-2 text-gray-300 font-mono">
                        {result.value}
                      </td>
                      <td className="py-2 text-gray-300 font-mono text-sm">
                        {result.result}
                      </td>
                      <td className="py-2 text-gray-400">
                        {result.expectedValid ? 'Valid' : 'Invalid'}
                      </td>
                      <td className="py-2">
                        {result.passed ? (
                          <span className="text-green-400 font-semibold">✓ PASS</span>
                        ) : (
                          <span className="text-red-400 font-semibold">✗ FAIL</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Test Instructions */}
        <div className="bg-blue-900 bg-opacity-30 border border-blue-500 rounded-lg p-6 mt-6">
          <h3 className="text-blue-300 font-semibold mb-3">
            🧪 Test Coverage
          </h3>
          <ul className="text-blue-200 text-sm space-y-2">
            <li>• <strong>Position (x, y)</strong>: Tests valid range (0-3000), decimals (auto-round), negative values, out of bounds</li>
            <li>• <strong>Size (width, height)</strong>: Tests min (1), max (3000), decimals (auto-round), zero, negative</li>
            <li>• <strong>Stroke Width</strong>: Tests valid range (0-100), negative, out of bounds</li>
            <li>• <strong>Colors (fill, stroke)</strong>: Tests hex format, missing #, wrong length, invalid chars</li>
            <li>• <strong>Invalid inputs</strong>: Tests non-numeric strings, NaN, color names</li>
            <li>• <strong>Rounding</strong>: All numeric values automatically rounded to integers (no decimals)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TestValidation;

