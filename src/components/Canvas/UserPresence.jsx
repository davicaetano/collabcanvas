import React from 'react';
import { AvatarComponent } from '../shared/Avatar';

const UserPresence = ({ onlineUsers }) => {
  const userCount = Object.keys(onlineUsers).length;
  
  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-300">
        Online: {userCount}
      </span>
      <div className="flex min-h-[40px]">
        {Object.entries(onlineUsers).slice(0, 5).map(([userId, user], index) => (
          <div 
            key={`${userId}-${index}`} 
            className="w-10 h-10 flex-shrink-0"
            style={{ 
              zIndex: 10 - index,
              marginLeft: index > 0 ? '-10px' : '0px',
              width: '40px',
              height: '40px',
              minWidth: '40px',
              minHeight: '40px'
            }}
          >
            <AvatarComponent user={{...user, uid: userId}} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserPresence;
