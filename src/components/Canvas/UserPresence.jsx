import React from 'react';
import { AvatarComponent } from '../shared/Avatar';

const UserPresence = ({ onlineUsers }) => {
  const userCount = Object.keys(onlineUsers).length;
  
  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-300">
        Online: {userCount}
      </span>
      <div className="flex -space-x-2">
        {Object.entries(onlineUsers).slice(0, 5).map(([userId, user], index) => (
          <AvatarComponent key={`${userId}-${index}`} user={{...user, uid: userId}} />
        ))}
      </div>
    </div>
  );
};

export default UserPresence;
