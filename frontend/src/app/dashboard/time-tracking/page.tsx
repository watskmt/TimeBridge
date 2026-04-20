'use client';

import { useEffect, useState } from 'react';
import { useTimeEntriesStore } from '@/store/time-entries.ts';
import { useProjectsStore } from '@/store/projects.ts';
import { Timer } from '@/components/timer/index.tsx';
import { Clock, TrendingUp, Calendar, Trash2 } from 'lucide-react';
import { TimeEntry } from '@/types/index.ts';

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}時間${m}分` : `${m}分`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
}

export default function TimeTrackingPage() {
  const { entries, fetchTimeEntries, deleteTimeEntry } = useTimeEntriesStore();
  const { projects, fetchProjects } = useProjectsStore();

  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    setIsLoading(true);
    fetchTimeEntries({ start_date: filterDate, end_date: filterDate }).finally(() => setIsLoading(false));
  }, [filterDate, fetchTimeEntries]);

  const filteredEntries = entries
    .filter((e) => {
      const d = typeof e.date === 'string' ? e.date.slice(0, 10) : '';
      return d === filterDate;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const totalMinutes = filteredEntries.reduce((s, e) => s + e.duration_minutes, 0);
  const totalEarnings = filteredEntries.reduce((s, e) => {
    const p = projects.find((p) => p.id === e.project_id);
    return s + (e.duration_minutes / 60) * (p?.hourly_rate ?? 0);
  }, 0);

  const handleDelete = async (id: number) => {
    if (!confirm('この記録を削除しますか？')) return;
    await deleteTimeEntry(id);
    await fetchTimeEntries({ start_date: filterDate, end_date: filterDate });
  };

  const isToday = filterDate === new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">稼働時間管理</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* 左：タイマー */}
        <div className="lg:col-span-2">
          <Timer />
        </div>

        {/* 右：日付別履歴 */}
        <div className="lg:col-span-3 space-y-4">
          {/* 日付選択 + サマリー */}
          <div className="bg-white rounded-2xl shadow-lg p-5">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-medium">稼働時間</span>
                </div>
                <p className="text-2xl font-bold text-blue-700">{formatDuration(totalMinutes)}</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-green-600 mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs font-medium">売上（見積）</span>
                </div>
                <p className="text-2xl font-bold text-green-700">
                  ¥{totalEarnings.toLocaleString('ja-JP', { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>

          {/* 稼働履歴テーブル */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">
                {isToday ? '本日' : filterDate}の稼働記録
              </h2>
              <span className="text-sm text-gray-400">{filteredEntries.length}件</span>
            </div>

            {isLoading ? (
              <div className="py-12 text-center text-gray-400 text-sm">読み込み中...</div>
            ) : filteredEntries.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">記録がありません</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filteredEntries.map((entry) => (
                  <EntryRow
                    key={entry.id}
                    entry={entry}
                    projectName={projects.find((p) => p.id === entry.project_id)?.name ?? '不明'}
                    hourlyRate={projects.find((p) => p.id === entry.project_id)?.hourly_rate ?? 0}
                    onDelete={() => handleDelete(entry.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EntryRow({
  entry,
  projectName,
  hourlyRate,
  onDelete,
}: {
  entry: TimeEntry;
  projectName: string;
  hourlyRate: number;
  onDelete: () => void;
}) {
  const earnings = (entry.duration_minutes / 60) * hourlyRate;

  return (
    <div className="px-5 py-4 hover:bg-gray-50 transition-colors group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* プロジェクト名 + 時間バッジ */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-medium text-gray-900 text-sm">{projectName}</span>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              {formatDuration(entry.duration_minutes)}
            </span>
            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              ¥{earnings.toLocaleString('ja-JP', { maximumFractionDigits: 0 })}
            </span>
          </div>

          {/* 作業内容 */}
          {entry.description && (
            <p className="text-sm text-gray-600 mb-1">{entry.description}</p>
          )}

          {/* 開始〜終了時刻 */}
          <p className="text-xs text-gray-400">
            {entry.started_at && entry.ended_at
              ? `${formatTime(entry.started_at)} → ${formatTime(entry.ended_at)}`
              : `記録時刻: ${formatTime(entry.created_at)}`}
          </p>
        </div>

        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
