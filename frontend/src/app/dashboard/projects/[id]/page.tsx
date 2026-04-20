'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useProjectsStore } from '@/store/projects.ts';
import { Button } from '@/components/ui/button.tsx';
import { ProjectStatus, CreateProjectRequest } from '@/types';
import { ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';

const statusOptions: { value: ProjectStatus; label: string }[] = [
  { value: 'planning', label: '計画中' },
  { value: 'in_progress', label: '進行中' },
  { value: 'inspection', label: '検収中' },
  { value: 'completed', label: '完了' },
];

export default function ProjectFormPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id ? Number(params.id) : null;

  const { fetchProject, createProject, updateProject } = useProjectsStore();
  const [isLoading, setIsLoading] = useState(!!projectId);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<CreateProjectRequest>({
    name: '',
    client_name: '',
    description: '',
    status: 'planning',
    start_date: new Date().toISOString().split('T')[0] ?? '',
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] ?? '',
    budget_amount: 0,
    hourly_rate: 0,
  });

  // Load existing project
  useEffect(() => {
    if (projectId) {
      fetchProject(projectId)
        .then((project) => {
          setFormData({
            name: project.name,
            client_name: project.client_name,
            description: project.description || '',
            status: project.status,
            start_date: project.start_date,
            end_date: project.end_date,
            budget_amount: Number(project.budget_amount),
            hourly_rate: Number(project.hourly_rate),
          });
        })
        .catch(() => setError('プロジェクトの読み込みに失敗しました'))
        .finally(() => setIsLoading(false));
    }
  }, [projectId, fetchProject]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ['budget_amount', 'hourly_rate'].includes(name) ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    if (!formData.name) {
      setError('プロジェクト名は必須です');
      return;
    }
    if (!formData.client_name) {
      setError('クライアント名は必須です');
      return;
    }
    if (new Date(formData.start_date) >= new Date(formData.end_date)) {
      setError('終了日は開始日より後である必要があります');
      return;
    }
    if (formData.budget_amount <= 0) {
      setError('予算額は0より大きい値を入力してください');
      return;
    }
    if (formData.hourly_rate <= 0) {
      setError('時給は0より大きい値を入力してください');
      return;
    }

    setIsLoading(true);

    try {
      if (projectId) {
        await updateProject(projectId, formData);
      } else {
        await createProject(formData);
      }
      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard/projects');
      }, 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : '保存に失敗しました';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && projectId) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <p className="text-gray-600">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          {projectId ? 'プロジェクト編集' : '新規プロジェクト'}
        </h1>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl">
        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-green-800">
              {projectId ? 'プロジェクトを更新しました' : 'プロジェクトを作成しました'}
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Name */}
          <div>
            <label htmlFor="name" className="form-label">
              プロジェクト名 <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="例: Webサイト リニューアル"
              value={formData.name}
              onChange={handleChange}
              className="form-input"
              disabled={isLoading}
            />
          </div>

          {/* Client Name */}
          <div>
            <label htmlFor="client_name" className="form-label">
              クライアント名 <span className="text-red-500">*</span>
            </label>
            <input
              id="client_name"
              name="client_name"
              type="text"
              placeholder="例: 株式会社 XX"
              value={formData.client_name}
              onChange={handleChange}
              className="form-input"
              disabled={isLoading}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="form-label">
              説明
            </label>
            <textarea
              id="description"
              name="description"
              placeholder="プロジェクトの詳細を入力..."
              value={formData.description}
              onChange={handleChange}
              className="form-input resize-none"
              rows={4}
              disabled={isLoading}
            />
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="form-label">
              ステータス <span className="text-red-500">*</span>
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="form-input"
              disabled={isLoading}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="start_date" className="form-label">
                開始日 <span className="text-red-500">*</span>
              </label>
              <input
                id="start_date"
                name="start_date"
                type="date"
                value={formData.start_date}
                onChange={handleChange}
                className="form-input"
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="end_date" className="form-label">
                終了日 <span className="text-red-500">*</span>
              </label>
              <input
                id="end_date"
                name="end_date"
                type="date"
                value={formData.end_date}
                onChange={handleChange}
                className="form-input"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Budget & Hourly Rate */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="budget_amount" className="form-label">
                予算額（¥） <span className="text-red-500">*</span>
              </label>
              <input
                id="budget_amount"
                name="budget_amount"
                type="number"
                placeholder="1000000"
                value={formData.budget_amount || ''}
                onChange={handleChange}
                className="form-input"
                disabled={isLoading}
                min="0"
                step="1000"
              />
            </div>
            <div>
              <label htmlFor="hourly_rate" className="form-label">
                時給（¥/h） <span className="text-red-500">*</span>
              </label>
              <input
                id="hourly_rate"
                name="hourly_rate"
                type="number"
                placeholder="5000"
                value={formData.hourly_rate || ''}
                onChange={handleChange}
                className="form-input"
                disabled={isLoading}
                min="0"
                step="100"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? '保存中...' : '保存'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/projects')}
              disabled={isLoading}
              className="flex-1"
            >
              キャンセル
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
