import React, { useState } from 'react';
import { getUserColor, getUserInitials } from '../../utils/colors';
import { AVATAR_SIZE, AVATAR_FONT_SIZE } from '../../utils/canvas';

// Current User Avatar component
export const CurrentUserAvatar = React.memo(({ user }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const initials = getUserInitials(user?.displayName);
  const bgColor = getUserColor(user?.uid);
  
  const hasPhoto = user?.photoURL && !imageError;
  const showImage = hasPhoto && imageLoaded;
  
  return (
    <div 
      className="w-10 h-10 rounded-full relative shadow-sm overflow-hidden"
      style={{ 
        backgroundColor: bgColor,
        width: '40px',
        height: '40px',
        minWidth: '40px',
        minHeight: '40px'
      }}
    >
      {/* Initials - show when no photo, error, or image not loaded yet */}
      {!showImage && (
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
      
      {/* Photo - always render when hasPhoto, but control visibility */}
      {hasPhoto && (
        <img
          src={user.photoURL}
          alt={user.displayName}
          className="w-full h-full rounded-full object-cover absolute inset-0"
          style={{ 
            zIndex: 20,
            opacity: imageLoaded ? 1 : 0,
            transition: 'opacity 0.2s ease-in-out'
          }}
          onError={(e) => {
            setImageError(true);
            setImageLoaded(false);
          }}
          onLoad={(e) => {
            setImageLoaded(true);
          }}
        />
      )}
    </div>
  );
});

// Avatar component for online users
export const AvatarComponent = React.memo(({ user }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const initials = getUserInitials(user.name);
  const bgColor = getUserColor(user.uid);
  
  const hasPhoto = user.photo && !imageError;
  const showImage = hasPhoto && imageLoaded;
  
  return (
    <div
      className="w-10 h-10 rounded-full border-2 border-gray-800 relative shadow-sm overflow-hidden"
      title={user.name}
      style={{ 
        backgroundColor: bgColor,
        width: '40px',
        height: '40px',
        minWidth: '40px',
        minHeight: '40px'
      }}
    >
      {/* Initials - show when no photo, error, or image not loaded yet */}
      {!showImage && (
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
      
      {/* Photo - always render when hasPhoto, but control visibility */}
      {hasPhoto && (
        <img
          src={user.photo}
          alt={user.name}
          className="w-full h-full rounded-full object-cover absolute inset-0"
          style={{ 
            zIndex: 20,
            opacity: imageLoaded ? 1 : 0,
            transition: 'opacity 0.2s ease-in-out'
          }}
          onError={(e) => {
            setImageError(true);
            setImageLoaded(false);
          }}
          onLoad={(e) => {
            setImageLoaded(true);
          }}
        />
      )}
    </div>
  );
});
