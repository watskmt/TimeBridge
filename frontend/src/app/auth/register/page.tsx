'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button.tsx';
import { useAuthStore } from '@/store/auth.ts';
import { Mail, Lock, User, Building2, Phone, AlertCircle, CheckCircle } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const register = useAuthStore((state) => state.register);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    company_name: '',
    phone: '',
  });

  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);

  const checkPasswordStrength = (password: string) => {
    if (password.length < 8) {
      setPasswordStrength('weak');
    } else if (password.length < 12 || !/[A-Z]/.test(password)) {
      setPasswordStrength('medium');
    } else {
      setPasswordStrength('strong');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === 'password') {
      checkPasswordStrength(value);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.name) {
      setError('氏名は必須です');
      return false;
    }
    if (!formData.email) {
      setError('メールアドレスは必須です');
      return false;
    }
    if (formData.password.length < 8) {
      setError('パスワードは8文字以上である必要があります');
      return false;
    }
    if (formData.password !== formData.password_confirmation) {
      setError('パスワードが一致しません');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await register(formData);
      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : '登録に失敗しました';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">TimeBridge</h1>
          <p className="text-gray-600">新規アカウントを作成</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-green-800">登録が完了しました。ダッシュボードへ移動します...</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
          {/* Name Field */}
          <div className="mb-4">
            <label htmlFor="name" className="form-label">
              氏名 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="name"
                name="name"
                type="text"
                placeholder="山田太郎"
                value={formData.name}
                onChange={handleChange}
                required
                className="form-input pl-10"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Email Field */}
          <div className="mb-4">
            <label htmlFor="email" className="form-label">
              メールアドレス <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
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

          {/* Company Name Field */}
          <div className="mb-4">
            <label htmlFor="company_name" className="form-label">
              会社名/屋号
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="company_name"
                name="company_name"
                type="text"
                placeholder="YourCompany Inc."
                value={formData.company_name}
                onChange={handleChange}
                className="form-input pl-10"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Phone Field */}
          <div className="mb-4">
            <label htmlFor="phone" className="form-label">
              電話番号
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="090-1234-5678"
                value={formData.phone}
                onChange={handleChange}
                className="form-input pl-10"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="mb-4">
            <label htmlFor="password" className="form-label">
              パスワード <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
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
            {formData.password && (
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-xs font-medium text-gray-600">
                    パスワード強度:
                  </div>
                  <div className={`text-xs font-semibold ${
                    passwordStrength === 'weak' ? 'text-red-600' :
                    passwordStrength === 'medium' ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {passwordStrength === 'weak' ? '弱' :
                     passwordStrength === 'medium' ? '中' :
                     '強'}
                  </div>
                </div>
                <div className="flex gap-1 h-1 bg-gray-200 rounded">
                  <div className={`flex-1 rounded ${
                    passwordStrength ? 'bg-red-500' : ''
                  }`} />
                  <div className={`flex-1 rounded ${
                    passwordStrength === 'medium' || passwordStrength === 'strong' ? 'bg-yellow-500' : ''
                  }`} />
                  <div className={`flex-1 rounded ${
                    passwordStrength === 'strong' ? 'bg-green-500' : ''
                  }`} />
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="mb-6">
            <label htmlFor="password_confirmation" className="form-label">
              パスワード確認 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="password_confirmation"
                name="password_confirmation"
                type="password"
                placeholder="••••••••"
                value={formData.password_confirmation}
                onChange={handleChange}
                required
                className="form-input pl-10"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full mb-4"
            disabled={isLoading}
          >
            {isLoading ? '登録中...' : '登録する'}
          </Button>
        </form>

        {/* Login Link */}
        <p className="text-center text-gray-600 mt-6">
          すでにアカウントをお持ちですか？{' '}
          <Link
            href="/auth/login"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ログイン
          </Link>
        </p>

        {/* Terms */}
        <p className="text-center text-xs text-gray-500 mt-6">
          登録することで、利用規約とプライバシーポリシーに同意します。
        </p>
      </div>
    </div>
  );
}
