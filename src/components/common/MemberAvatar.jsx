import { useState, useEffect } from 'react';
import { blobToUrl } from '../../lib/photos';

export default function MemberAvatar({ member, size = 48, className = '' }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (member?.profilePhoto) {
      const u = blobToUrl(member.profilePhoto);
      setUrl(u);
      return () => URL.revokeObjectURL(u);
    }
    setUrl(null);
  }, [member?.profilePhoto]);

  const px = `${size}px`;

  if (url) {
    return (
      <img
        src={url}
        alt={member?.name || ''}
        className={`rounded-full object-cover ${className}`}
        style={{ width: px, height: px }}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-surface-bright flex items-center justify-center border-2 border-outline-variant/30 ${className}`}
      style={{ width: px, height: px }}
    >
      <span className="font-bold text-on-surface-variant" style={{ fontSize: `${size * 0.38}px` }}>
        {member?.avatar || member?.name?.[0] || '?'}
      </span>
    </div>
  );
}
