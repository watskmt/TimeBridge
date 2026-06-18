import axios, { AxiosInstance, AxiosError } from 'axios';

// 未設定なら同一オリジンの相対パス (`/api`) を使う。本番は nginx が /api/ を
// backend にプロキシし、dev は next.config.js の rewrite が localhost:8000 に流す。
// NEXT_PUBLIC_API_URL を絶対URLで設定した場合はそちらを優先。
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
const API_TIMEOUT = parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000');

/**
 * API クライアント
 */
class ApiClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: `${API_URL}/api`,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    // リクエストインターセプター
    this.instance.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // レスポンスインターセプター
    this.instance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const isAuthEndpoint = error.config?.url?.includes('/auth/login') ||
          error.config?.url?.includes('/auth/register');
        const isAlreadyOnLoginPage = typeof window !== 'undefined' &&
          window.location.pathname.startsWith('/auth/');
        if (error.response?.status === 401 && !isAuthEndpoint && !isAlreadyOnLoginPage) {
          this.clearToken();
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * トークンを取得
   */
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  }

  /**
   * トークンをクリア
   */
  public clearToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  /**
   * トークンを設定
   */
  public setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  /**
   * GET リクエスト
   */
  public get<T>(url: string, config = {}) {
    return this.instance.get<T>(url, config);
  }

  /**
   * POST リクエスト
   */
  public post<T>(url: string, data = {}, config = {}) {
    return this.instance.post<T>(url, data, config);
  }

  /**
   * PUT リクエスト
   */
  public put<T>(url: string, data = {}, config = {}) {
    return this.instance.put<T>(url, data, config);
  }

  /**
   * DELETE リクエスト
   */
  public delete<T>(url: string, config = {}) {
    return this.instance.delete<T>(url, config);
  }

  /**
   * PATCH リクエスト
   */
  public patch<T>(url: string, data = {}, config = {}) {
    return this.instance.patch<T>(url, data, config);
  }
}

export const apiClient = new ApiClient();
