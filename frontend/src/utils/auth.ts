export interface User {
  id: number;
  email: string;
  nome: string;
  role: 'admin' | 'funcionario';
}

export const getStoredUser = (): User | null => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

export const getStoredToken = (): string | null => {
  return localStorage.getItem('token');
};

export const setAuthData = (user: User, token: string): void => {
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('token', token);
};

export const clearAuthData = (): void => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
};

export const isAuthenticated = (): boolean => {
  return !!getStoredToken();
};

export const isAdmin = (user?: User | null): boolean => {
  const currentUser = user || getStoredUser();
  return currentUser?.role === 'admin';
};

export const isEmployee = (user?: User | null): boolean => {
  const currentUser = user || getStoredUser();
  return currentUser?.role === 'funcionario' || isAdmin(currentUser);
};