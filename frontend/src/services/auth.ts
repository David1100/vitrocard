import { api, setAccessToken } from './api';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AdminUser;
}

export async function adminLogin(email: string, password: string): Promise<LoginResponse> {
  const res = await api<LoginResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  setAccessToken(res.accessToken);
  return res;
}

export async function adminLogout(): Promise<void> {
  await api<void>('/auth/logout', { method: 'POST' });
  setAccessToken(null);
}

export async function adminMe(): Promise<AdminUser> {
  return api<AdminUser>('/auth/me');
}
