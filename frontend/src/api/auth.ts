import { apiClient } from './client.ts';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '@/types';

export const authApi = {
  /**
   * ログイン
   */
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return data;
  },

  /**
   * ユーザー登録
   */
  register: async (request: RegisterRequest): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/register', request);
    return data;
  },

  /**
   * ログアウト
   */
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
    apiClient.clearToken();
  },

  /**
   * 現在のユーザー情報を取得
   */
  getCurrentUser: async (): Promise<User> => {
    const { data } = await apiClient.get<User>('/user');
    return data;
  },

  /**
   * プロフィール更新
   */
  updateProfile: async (updates: Partial<User>): Promise<{ message: string; user: User }> => {
    const { data } = await apiClient.put<{ message: string; user: User }>('/user', updates);
    return data;
  },
};
