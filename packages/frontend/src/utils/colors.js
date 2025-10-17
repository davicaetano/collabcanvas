// Helper function to generate consistent unique colors for all user elements
export const getUserColor = (userId) => {
  if (!userId) return '#9CA3AF'; // gray-400 fallback
  
  // Unified color palette with excellent contrast and visibility
  // Works well for both cursors and avatar backgrounds
  const colors = [
    '#E53E3E', // Red
    '#3182CE', // Blue
    '#38A169', // Green
    '#D69E2E', // Yellow/Orange
    '#805AD5', // Purple
    '#DD6B20', // Orange
    '#319795', // Teal
    '#E53E3E', // Red variant
    '#2B6CB0', // Blue variant
    '#2F855A', // Green variant
    '#B7791F', // Yellow variant
    '#6B46C1', // Purple variant
    '#C05621', // Orange variant
    '#2C7A7B', // Teal variant
    '#9F1239', // Rose
    '#1E40AF', // Indigo
    '#059669', // Emerald
    '#DC2626', // Red-600
    '#7C3AED', // Violet
    '#0891B2'  // Cyan
  ];

  // Create robust hash from the entire userId
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Use absolute value and modulo to get consistent color index
  const colorIndex = Math.abs(hash) % colors.length;
  return colors[colorIndex];
};

// Helper function to get user initials (Google style - prefer 1 initial)
export const getUserInitials = (name) => {
  if (!name) return '?';
  const names = name.trim().split(' ');
  // Google style: prefer first initial only, unless it's a very short name
  return names[0].charAt(0).toUpperCase();
};
