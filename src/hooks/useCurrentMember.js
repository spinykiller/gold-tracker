import { useState, useEffect } from 'react';

export function useCurrentMember() {
  const [memberId, setMemberId] = useState(() => {
    const stored = sessionStorage.getItem('currentMemberId');
    return stored ? Number(stored) : null;
  });

  useEffect(() => {
    if (memberId !== null) {
      sessionStorage.setItem('currentMemberId', String(memberId));
    }
  }, [memberId]);

  const logout = () => {
    sessionStorage.removeItem('currentMemberId');
    setMemberId(null);
  };

  return { memberId, setMemberId, logout };
}
