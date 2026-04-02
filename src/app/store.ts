import { useState, useEffect, useCallback } from 'react';

interface User {
  id: number;
  email: string;
  fullName: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem('pspay_token');
    const u = localStorage.getItem('pspay_user');
    if (t && u) {
      setToken(t);
      setUser(JSON.parse(u));
    }
  }, []);

  const login = useCallback((t: string, u: User) => {
    localStorage.setItem('pspay_token', t);
    localStorage.setItem('pspay_user', JSON.stringify(u));
    setToken(t);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('pspay_token');
    localStorage.removeItem('pspay_user');
    setToken(null);
    setUser(null);
  }, []);

  return { user, token, login, logout, isAuth: !!token };
}
