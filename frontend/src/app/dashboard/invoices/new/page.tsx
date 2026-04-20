'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useProjectsStore } from '@/store/projects.ts';
import { useInvoicesStore } from '@/store/invoices.ts';
import { Button } from '@/components/ui/button.tsx';
import { ArrowLeft, CheckCircle, AlertCircle, Briefcase } from 'lucide-react';
import { ProjectSummary } from '@/types';

const TAX_RATE = 0.1;

export default function NewInvoicePage() {
  const router = useRouter();
  const { projects, fetchProjects, getProjectSummary } = useProjectsStore();
  const { createInvoice } = useInvoicesStore();

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [summaries, setSummaries] = useState<Record<number, ProjectSummary>>({});
  const [issuedAt, setIssuedAt] = useState(new Date().toISOString().split('T')[0]);
  const [dueAt, setDueAt] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const toggleProject = useCallback(async (id: number) => {
    setSelectedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id];
      return next;
    });

    if (!summaries[id]) {
      try {
        const summary = await getProjectSummary(id);
        setSummaries((prev) => ({ ...prev, [id]: summary }));
      } catch {
        // サマリー取得失敗時は無視
      }
    }
  }, [summaries, getProjectSummary]);

  const subtotal = selectedIds.reduce((sum, id) => {
    return sum + (summaries[id]?.total_earnings ?? 0);
  }, 0);
  const tax = Math.floor(subtotal * TAX_RATE);
  const total = subtotal + tax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedIds.length === 0) {
      setError('プロジェクトを1件以上選択してください');
      return;
    }
    if (new Date(dueAt) <= new Date(issuedAt)) {
      setError('支払期限は発行日より後の日付にしてください');
      return;
    }

    setIsLoading(true);
    try {
      await createInvoice({
        project_ids: selectedIds,
        issued_at: issuedAt,
        due_at: dueAt,
        notes: notes || undefined,
      });
      setSuccess(true);
      setTimeout(() => router.push('/dashboard/invoices'), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : '作成に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">新規請求書</h1>
      </div>

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-sm text-green-800">請求書を作成しました。一覧へ移動します...</p>
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* プロジェクト選択 */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="font-semibold text-gray-900 mb-1">対象プロジェクト</h2>
          <p className="text-xs text-gray-500 mb-4">請求書に含めるプロジェクトを選択してください（実稼働時間ベースで金額を算出します）</p>

          {projects.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">プロジェクトがありません</p>
          ) : (
            <div className="space-y-2">
              {projects.map((p) => {
                const selected = selectedIds.includes(p.id);
                const summary = summaries[p.id];
                const earnings = summary?.total_earnings ?? null;
                const hours = summary?.total_hours ?? null;

                return (
                  <label
                    key={p.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleProject(p.id)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <Briefcase className={`w-5 h-5 shrink-0 ${selected ? 'text-blue-500' : 'text-gray-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.client_name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {earnings !== null ? (
                        <>
                          <p className="text-sm font-semibold text-gray-900">
                            ¥{Math.floor(earnings).toLocaleString('ja-JP')}
                          </p>
                          <p className="text-xs text-gray-400">{hours?.toFixed(1)}h 稼働</p>
                        </>
                      ) : (
                        <p className="text-xs text-gray-400">
                          ¥{Number(p.hourly_rate).toLocaleString('ja-JP', { maximumFractionDigits: 0 })}/h
                        </p>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* 金額プレビュー */}
        {selectedIds.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="font-semibold text-gray-900 mb-4">請求金額</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-gray-600">
                <span>小計（実稼働額）</span>
                <span className="font-medium">¥{Math.floor(subtotal).toLocaleString('ja-JP')}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>消費税（10%）</span>
                <span className="font-medium">¥{tax.toLocaleString('ja-JP')}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-gray-900 border-t pt-3">
                <span>合計請求金額</span>
                <span className="text-blue-600 text-lg">¥{total.toLocaleString('ja-JP')}</span>
              </div>
            </div>
          </div>
        )}

        {/* 発行情報 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">発行情報</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">発行日 <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={issuedAt}
                onChange={(e) => setIssuedAt(e.target.value)}
                className="form-input"
                required
              />
            </div>
            <div>
              <label className="form-label">支払期限 <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                className="form-input"
                required
              />
            </div>
          </div>

          <div>
            <label className="form-label">備考</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="振込先情報、支払条件など..."
              className="form-input resize-none"
              rows={3}
            />
          </div>
        </div>

        {/* アクション */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading || selectedIds.length === 0} className="flex-1">
            {isLoading ? '作成中...' : '請求書を作成（下書き）'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
            キャンセル
          </Button>
        </div>
      </form>
    </div>
  );
}
