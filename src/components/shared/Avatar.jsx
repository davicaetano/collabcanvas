import React, { useState } from 'react';
import { getUserColor, getUserInitials } from '../../utils/colors';
import { AVATAR_SIZE, AVATAR_FONT_SIZE } from '../../utils/canvas';

// Current User Avatar component
export const CurrentUserAvatar = React.memo(({ user }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const initials = getUserInitials(user?.displayName);
  const bgColor = getUserColor(user?.uid);
  
  return (
    <div 
      className="w-8 h-8 rounded-full relative shadow-sm overflow-hidden"
      style={{ backgroundColor: bgColor }}
    >
      {/* Initials - always render for fallback */}
      {(!user?.photoURL || imageError || !imageLoaded) && (
        <div 
          className="w-full h-full flex items-center justify-center text-white font-medium pointer-events-none"
          style={{
            fontSize: `${AVATAR_FONT_SIZE}px`,
            fontWeight: '500',
            lineHeight: `${AVATAR_SIZE}px`,
            zIndex: 10,
          }}
        >
          {initials}
        </div>
      )}
      
      {/* Photo - only render if user has photo AND no error */}
      {user?.photoURL && !imageError && (
        <img
          src={user.photoURL}
          alt={user.displayName}
          className="w-full h-full rounded-full object-cover absolute inset-0"
          onError={() => {
            setImageError(true);
            setImageLoaded(false);
          }}
          onLoad={() => {
            setImageError(false);
            setImageLoaded(true);
          }}
        />
      )}
    </div>
  );
});

// Avatar component for online users
export const AvatarComponent = React.memo(({ user }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const initials = getUserInitials(user.name);
  const bgColor = getUserColor(user.uid);
  
  return (
    <div
      className="w-8 h-8 rounded-full border-2 border-gray-800 relative shadow-sm overflow-hidden"
      title={user.name}
      style={{ backgroundColor: bgColor }}
    >
      {/* Initials - always render for fallback */}
      {(!user.photo || imageError || !imageLoaded) && (
        <div 
          className="w-full h-full flex items-center justify-center text-white font-medium pointer-events-none"
          style={{
            fontSize: `${AVATAR_FONT_SIZE}px`,
            fontWeight: '500',
            lineHeight: `${AVATAR_SIZE}px`,
            zIndex: 10,
          }}
        >
          {initials}
        </div>
      )}
      
      {/* Photo - only render if user has photo AND no error */}
      {user.photo && !imageError && (
        <img
          src={user.photo}
          alt={user.name}
          className="w-full h-full rounded-full object-cover absolute inset-0"
          onError={() => {
            setImageError(true);
            setImageLoaded(false);
          }}
          onLoad={() => {
            setImageError(false);
            setImageLoaded(true);
          }}
        />
      )}
    </div>
  );
});
