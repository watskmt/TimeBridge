'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button.tsx';
import { useAuthStore } from '@/store/auth.ts';
import { Mail, Lock, AlertCircle, Zap } from 'lucide-react';

const DEMO_EMAIL = 'demo@timebridge.app';
const DEMO_PASSWORD = 'demo1234';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((state) => state.login);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ email: '', password: '' });

  // ?demo=true でデモ情報を自動入力
  useEffect(() => {
    if (searchParams?.get('demo') === 'true') {
      setFormData({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await login(formData);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ログインに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    setError(null);
    setFormData({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
    try {
      await login({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
      router.push('/dashboard');
    } catch (_err) {
      setError('デモアカウントでのログインに失敗しました。管理者にお問い合わせください。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">TimeBridge</h1>
          <p className="text-gray-600">アカウントにログイン</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 space-y-5">

          {/* デモログインボタン */}
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 hover:border-blue-400 transition disabled:opacity-50"
          >
            <Zap className="w-4 h-4 fill-blue-500" />
            デモアカウントでログイン（登録不要）
          </button>

          <div className="flex items-center gap-3 text-xs text-gray-400">
            <div className="flex-1 h-px bg-gray-200" />
            <span>または</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="form-label">メールアドレス</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="email"
                name="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="form-input pl-10"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="password" className="form-label">パスワード</label>
              <Link href="/auth/forgot-password" className="text-xs text-blue-600 hover:text-blue-700">
                パスワードを忘れた？
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                className="form-input pl-10"
                disabled={isLoading}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'ログイン中...' : 'ログイン'}
          </Button>
        </form>

        <p className="text-center text-gray-600 mt-6 text-sm">
          アカウントをお持ちではありませんか？{' '}
          <Link href="/auth/register" className="text-blue-600 hover:text-blue-700 font-medium">
            登録する
          </Link>
        </p>
      </div>
    </div>
  );
}
