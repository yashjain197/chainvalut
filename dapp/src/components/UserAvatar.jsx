import React from 'react';
import '../styles/UserAvatar.css';

/**
 * Reusable avatar component that displays ENS avatar or generates an identicon
 * @param {string} address - Ethereum address
 * @param {string} ensAvatar - ENS avatar URL (optional)
 * @param {string} ensName - ENS name (optional)
 * @param {number} size - Avatar size in pixels (default: 40)
 * @param {boolean} showBorder - Show gradient border (default: true)
 */
const UserAvatar = ({ 
  address, 
  ensAvatar, 
  ensName, 
  size = 40, 
  showBorder = true,
  className = '' 
}) => {
  // Generate a simple identicon from address
  const generateIdenticon = (addr) => {
    if (!addr) return null;
    
    // Use first 6 characters after 0x for identicon
    const seed = addr.slice(2, 8);
    
    // Generate a simple gradient based on address
    const hue1 = parseInt(seed.slice(0, 2), 16);
    const hue2 = parseInt(seed.slice(2, 4), 16);
    const hue3 = parseInt(seed.slice(4, 6), 16);
    
    return {
      background: `linear-gradient(135deg, 
        hsl(${hue1}, 70%, 60%), 
        hsl(${hue2}, 70%, 50%), 
        hsl(${hue3}, 70%, 60%)
      )`,
      text: seed.slice(0, 4).toUpperCase()
    };
  };

  const identicon = generateIdenticon(address);
  const avatarStyle = {
    width: `${size}px`,
    height: `${size}px`,
  };

  return (
    <div 
      className={`user-avatar ${showBorder ? 'with-border' : ''} ${className}`}
      style={avatarStyle}
    >
      {ensAvatar ? (
        <img 
          src={ensAvatar} 
          alt={ensName || address} 
          className="avatar-image"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      ) : null}
      
      <div 
        className="avatar-identicon"
        style={{
          background: identicon?.background,
          display: ensAvatar ? 'none' : 'flex',
        }}
      >
        <span className="identicon-text">
          {identicon?.text || '????'}
        </span>
      </div>
    </div>
  );
};

export default UserAvatar;
