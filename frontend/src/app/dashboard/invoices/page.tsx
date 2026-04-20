'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useInvoicesStore } from '@/store/invoices.ts';
import { useProjectsStore } from '@/store/projects.ts';
import { Invoice, InvoiceStatus } from '@/types';
import { Button } from '@/components/ui/button.tsx';
import { Plus, FileText, Send, CheckCircle, Trash2, Download, Calendar, AlertCircle } from 'lucide-react';

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

export default function InvoicesPage() {
  const { invoices, fetchInvoices, deleteInvoice, sendInvoice, markPaid } = useInvoicesStore();
  const { projects, fetchProjects } = useProjectsStore();
  const [filterStatus, setFilterStatus] = useState<InvoiceStatus | 'all'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchInvoices(), fetchProjects()]).finally(() => setIsLoading(false));
  }, [fetchInvoices, fetchProjects]);

  const filtered = filterStatus === 'all'
    ? invoices
    : invoices.filter((inv) => inv.status === filterStatus);

  const handleDelete = async (id: number) => {
    if (!confirm('この請求書を削除しますか？')) return;
    setActionLoading(id);
    try {
      await deleteInvoice(id);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSend = async (id: number) => {
    if (!confirm('この請求書を送付済みにしますか？')) return;
    setActionLoading(id);
    try {
      await sendInvoice(id);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkPaid = async (id: number) => {
    if (!confirm('入金済みにしますか？')) return;
    setActionLoading(id);
    try {
      await markPaid(id);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadPdf = (id: number) => {
    const url = `/api/invoices/${id}/pdf`;
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getProjectNames = (projectIds: number[]) =>
    projectIds
      .map((id) => projects.find((p) => p.id === id)?.name ?? `#${id}`)
      .join('、');

  const totalUnpaid = invoices
    .filter((inv) => inv.status === 'sent' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + Number(inv.total), 0);

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">請求書</h1>
        <Link href="/dashboard/invoices/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            新規請求書
          </Button>
        </Link>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(['all', 'draft', 'sent', 'paid'] as const).map((s) => {
          const count = s === 'all' ? invoices.length : invoices.filter((i) => i.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`bg-white rounded-xl shadow p-4 text-left transition hover:shadow-md ${filterStatus === s ? 'ring-2 ring-blue-500' : ''}`}
            >
              <p className="text-xs text-gray-500 mb-1">
                {s === 'all' ? 'すべて' : statusLabels[s]}
              </p>
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className="text-xs text-gray-400">件</p>
            </button>
          );
        })}
      </div>

      {/* 未入金合計 */}
      {totalUnpaid > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">未入金合計</p>
            <p className="text-lg font-bold text-amber-900">¥{totalUnpaid.toLocaleString('ja-JP', { maximumFractionDigits: 0 })}</p>
          </div>
        </div>
      )}

      {/* 一覧 */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-gray-400">読み込み中...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>請求書がありません</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">請求書番号</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">プロジェクト</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">発行日</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">支払期限</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500">合計金額</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500">ステータス</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((invoice) => (
                <InvoiceRow
                  key={invoice.id}
                  invoice={invoice}
                  projectNames={getProjectNames(invoice.project_ids)}
                  isActing={actionLoading === invoice.id}
                  onSend={() => handleSend(invoice.id)}
                  onMarkPaid={() => handleMarkPaid(invoice.id)}
                  onDelete={() => handleDelete(invoice.id)}
                  onDownload={() => handleDownloadPdf(invoice.id)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function InvoiceRow({
  invoice,
  projectNames,
  isActing,
  onSend,
  onMarkPaid,
  onDelete,
  onDownload,
}: {
  invoice: Invoice;
  projectNames: string;
  isActing: boolean;
  onSend: () => void;
  onMarkPaid: () => void;
  onDelete: () => void;
  onDownload: () => void;
}) {
  const isOverdue = invoice.status !== 'paid' && new Date(invoice.due_at) < new Date();

  return (
    <tr className={`hover:bg-gray-50 transition-colors ${isActing ? 'opacity-50' : ''}`}>
      <td className="px-5 py-4">
        <Link href={`/dashboard/invoices/${invoice.id}`} className="font-mono text-sm font-semibold text-blue-600 hover:underline">
          {invoice.invoice_number}
        </Link>
      </td>
      <td className="px-5 py-4 text-sm text-gray-700 max-w-[200px] truncate">{projectNames}</td>
      <td className="px-5 py-4 text-sm text-gray-600">
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          {new Date(invoice.issued_at).toLocaleDateString('ja-JP')}
        </span>
      </td>
      <td className="px-5 py-4 text-sm">
        <span className={isOverdue && invoice.status !== 'paid' ? 'text-red-600 font-semibold' : 'text-gray-600'}>
          {new Date(invoice.due_at).toLocaleDateString('ja-JP')}
        </span>
      </td>
      <td className="px-5 py-4 text-right font-semibold text-gray-900">
        ¥{Number(invoice.total).toLocaleString('ja-JP', { maximumFractionDigits: 0 })}
      </td>
      <td className="px-5 py-4 text-center">
        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[invoice.status]}`}>
          {statusLabels[invoice.status]}
        </span>
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center justify-end gap-1">
          <button onClick={onDownload} title="PDF ダウンロード" className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
            <Download className="w-4 h-4" />
          </button>
          {invoice.status === 'draft' && (
            <button onClick={onSend} title="送付済みにする" className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
              <Send className="w-4 h-4" />
            </button>
          )}
          {(invoice.status === 'sent' || invoice.status === 'overdue') && (
            <button onClick={onMarkPaid} title="入金済みにする" className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all">
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          {invoice.status === 'draft' && (
            <button onClick={onDelete} title="削除" className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
