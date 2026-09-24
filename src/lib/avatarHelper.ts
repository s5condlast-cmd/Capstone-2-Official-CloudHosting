import { useState, useEffect } from 'react';

export const MALE_AVATAR_URL = '/images/avatars/undraw_indie-hacker-avatar_b3wy.svg';
export const FEMALE_AVATAR_URL = '/images/avatars/undraw_female-avatar_7t6k.svg';

export interface AvatarUserLike {
  gender?: string | null;
  avatarUrl?: string | null;
  avatar_url?: string | null;
  name?: string | null;
  role?: string | null;
}

export function getUserGender(user?: AvatarUserLike | null): 'male' | 'female' {
  if (user?.gender === 'female' || user?.gender === 'male') {
    return user.gender;
  }

  const name = (user?.name || '').toLowerCase();
  if (name) {
    const femaleNames = [
      'sarah', 'maria', 'jane', 'ana', 'mary', 'jessica', 'emily', 'grace', 'claire',
      'sophia', 'chloe', 'elizabeth', 'anna', 'patricia', 'jennifer', 'linda', 'barbara', 'susan', 'elena', 'rose'
    ];
    if (femaleNames.some(fn => name.split(/[\s,.-]+/).some(part => part === fn || part.startsWith(fn)))) {
      return 'female';
    }
    return 'male';
  }

  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('user_gender');
    if (stored === 'female' || stored === 'male') {
      return stored;
    }
  }

  return 'male';
}

export function setUserGender(gender: 'male' | 'female') {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user_gender', gender);
    window.dispatchEvent(new CustomEvent('user-gender-changed', { detail: { gender } }));
  }
}

export function getUserAvatar(user?: AvatarUserLike | null): string {
  if (user?.avatar_url) return user.avatar_url;
  if (user?.avatarUrl) return user.avatarUrl;

  const gender = getUserGender(user);
  return gender === 'female' ? FEMALE_AVATAR_URL : MALE_AVATAR_URL;
}

export function useUserAvatar(user?: AvatarUserLike | null): { avatarUrl: string; gender: 'male' | 'female'; setGender: (g: 'male' | 'female') => void } {
  const [avatarUrl, setAvatarUrl] = useState<string>(() => getUserAvatar(user));
  const [gender, setGenderState] = useState<'male' | 'female'>(() => getUserGender(user));

  useEffect(() => {
    const handleUpdate = () => {
      setAvatarUrl(getUserAvatar(user));
      setGenderState(getUserGender(user));
    };

    handleUpdate();
    window.addEventListener('user-gender-changed', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('user-gender-changed', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [user]);

  const setGender = (newGender: 'male' | 'female') => {
    setUserGender(newGender);
    setGenderState(newGender);
    setAvatarUrl(newGender === 'female' ? FEMALE_AVATAR_URL : MALE_AVATAR_URL);
  };

  return { avatarUrl, gender, setGender };
}

