'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useInvoicesStore } from '@/store/invoices.ts';
import { useProjectsStore } from '@/store/projects.ts';
import { useAuthStore } from '@/store/auth.ts';
import { Button } from '@/components/ui/button.tsx';
import { Invoice, InvoiceStatus, Project } from '@/types';
import { ArrowLeft, Download, Send, CheckCircle, Trash2, Calendar } from 'lucide-react';

const statusLabels: Record<InvoiceStatus, string> = {
  draft: '下書き',
  sent: '送付済み',
  paid: '入金済み',
  overdue: '期限超過',
};

const statusColors: Record<InvoiceStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
};

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params?.id);

  const { fetchInvoice, sendInvoice, markPaid, deleteInvoice } = useInvoicesStore();
  const { projects, fetchProjects } = useProjectsStore();
  const { user } = useAuthStore();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchInvoice(id).then(setInvoice),
      fetchProjects(),
    ]).finally(() => setIsLoading(false));
  }, [id, fetchInvoice, fetchProjects]);

  const handleSend = async () => {
    if (!confirm('送付済みにしますか？')) return;
    setActionLoading(true);
    try {
      const updated = await sendInvoice(id);
      setInvoice(updated);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!confirm('入金済みにしますか？')) return;
    setActionLoading(true);
    try {
      const updated = await markPaid(id);
      setInvoice(updated);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('この請求書を削除しますか？')) return;
    setActionLoading(true);
    try {
      await deleteInvoice(id);
      router.push('/dashboard/invoices');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownload = () => {
    window.open(`/api/invoices/${id}/pdf`, '_blank');
  };

  if (isLoading) {
    return <div className="text-center py-16 text-gray-400">読み込み中...</div>;
  }

  if (!invoice) {
    return <div className="text-center py-16 text-gray-400">請求書が見つかりません</div>;
  }

  const invoiceProjects = invoice.project_ids
    .map((pid) => projects.find((p) => p.id === pid))
    .filter((p): p is Project => p !== undefined);

  return (
    <div className="max-w-3xl space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-mono">{invoice.invoice_number}</h1>
            <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColors[invoice.status]}`}>
              {statusLabels[invoice.status]}
            </span>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
            <Download className="w-4 h-4" />PDF
          </Button>
          {invoice.status === 'draft' && (
            <>
              <Button variant="outline" size="sm" onClick={handleSend} disabled={actionLoading} className="gap-2">
                <Send className="w-4 h-4" />送付済みにする
              </Button>
              <button onClick={handleDelete} disabled={actionLoading} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition">
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
          {(invoice.status === 'sent' || invoice.status === 'overdue') && (
            <Button size="sm" onClick={handleMarkPaid} disabled={actionLoading} className="gap-2 bg-green-600 hover:bg-green-700">
              <CheckCircle className="w-4 h-4" />入金済みにする
            </Button>
          )}
        </div>
      </div>

      {/* 請求書プレビュー */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* 請求書ヘッダー */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">TimeBridge</h2>
              <p className="text-blue-200 text-sm mt-1">請求書</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-lg font-bold">{invoice.invoice_number}</p>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* 宛先・発行元 */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">請求先</p>
              <p className="font-semibold text-gray-900">
                {invoiceProjects[0]
                  ? `${invoiceProjects[0].client_name} 御中`
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">請求元</p>
              <p className="font-semibold text-gray-900">{user?.name}</p>
              {user?.company_name && <p className="text-sm text-gray-500">{user.company_name}</p>}
              {user?.email && <p className="text-sm text-gray-500">{user.email}</p>}
            </div>
          </div>

          {/* 日付情報 */}
          <div className="flex gap-8 bg-gray-50 rounded-xl p-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">発行日</p>
              <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gray-400" />
                {new Date(invoice.issued_at).toLocaleDateString('ja-JP')}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">支払期限</p>
              <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gray-400" />
                {new Date(invoice.due_at).toLocaleDateString('ja-JP')}
              </p>
            </div>
            {invoice.paid_at && (
              <div>
                <p className="text-xs text-gray-400 mb-1">入金日</p>
                <p className="font-semibold text-green-700 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  {new Date(invoice.paid_at).toLocaleDateString('ja-JP')}
                </p>
              </div>
            )}
          </div>

          {/* 明細 */}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">請求明細</p>
            <table className="w-full">
              <thead>
                <tr className="bg-gray-900 text-white rounded-lg">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold rounded-l-lg">プロジェクト</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold">クライアント</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold rounded-r-lg">金額</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoiceProjects.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{p.client_name}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">—</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 合計 */}
          <div className="ml-auto w-64 space-y-2 border-t pt-4">
            <div className="flex justify-between text-sm text-gray-600">
              <span>小計</span>
              <span>¥{Number(invoice.subtotal).toLocaleString('ja-JP', { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>消費税（10%）</span>
              <span>¥{Number(invoice.tax).toLocaleString('ja-JP', { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-gray-900 border-t pt-2">
              <span>合計</span>
              <span className="text-blue-600 text-lg">¥{Number(invoice.total).toLocaleString('ja-JP', { maximumFractionDigits: 0 })}</span>
            </div>
          </div>

          {/* 備考 */}
          {invoice.notes && (
            <div className="border-l-4 border-blue-500 pl-4 py-1">
              <p className="text-xs text-gray-400 mb-1">備考</p>
              <p className="text-sm text-gray-700 whitespace-pre-line">{invoice.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
