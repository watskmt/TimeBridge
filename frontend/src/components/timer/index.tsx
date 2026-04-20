'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useTimeEntriesStore } from '@/store/time-entries.ts';
import { useProjectsStore } from '@/store/projects.ts';
import { Play, Square, Clock, Briefcase, FileText, Trash2 } from 'lucide-react';
import { TimeEntry } from '@/types/index.ts';

function formatSeconds(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}時間${m}分` : `${m}分`;
}

export function Timer() {
  const { currentTimer, startTimer, stopTimer, resetTimer, updateTimerSeconds, createTimeEntry, entries, fetchTimeEntries, deleteTimeEntry } = useTimeEntriesStore();
  const { projects, fetchProjects } = useProjectsStore();

  const [selectedProjectId, setSelectedProjectId] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [displayTime, setDisplayTime] = useState('00:00:00');
  const [isSaving, setIsSaving] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchProjects();
    fetchTimeEntries({ start_date: new Date().toISOString().split('T')[0] ?? '', end_date: new Date().toISOString().split('T')[0] ?? '' });
  }, [fetchProjects, fetchTimeEntries]);

  // タイマー更新
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (currentTimer.startTime) {
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - currentTimer.startTime!) / 1000) + currentTimer.elapsedSeconds;
        updateTimerSeconds(elapsed);
        setDisplayTime(formatSeconds(elapsed));
      }, 1000);
    } else {
      setDisplayTime(formatSeconds(currentTimer.elapsedSeconds));
    }

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [currentTimer.startTime, currentTimer.elapsedSeconds, updateTimerSeconds]);

  const handleStart = useCallback(() => {
    if (!selectedProjectId) return;
    startTimer(Number(selectedProjectId));
  }, [selectedProjectId, startTimer]);

  const handleStop = useCallback(async () => {
    if (!currentTimer.startTime && currentTimer.elapsedSeconds === 0) return;
    setIsSaving(true);
    try {
      const endTime = new Date();
      const startedAtISO = currentTimer.startTime ? new Date(currentTimer.startTime).toISOString() : undefined;
      const totalSeconds = currentTimer.elapsedSeconds +
        (currentTimer.startTime ? Math.floor((Date.now() - currentTimer.startTime) / 1000) : 0);
      const durationMinutes = Math.max(1, Math.ceil(totalSeconds / 60));
      const projectId = Number(currentTimer.projectId ?? selectedProjectId);

      stopTimer();
      resetTimer();

      await createTimeEntry({
        project_id: projectId,
        duration_minutes: durationMinutes,
        date: new Date().toISOString().split('T')[0] ?? '',
        description: description || undefined,
        started_at: startedAtISO,
        ended_at: endTime.toISOString(),
      });

      setDescription('');
      setSelectedProjectId('');

      await fetchTimeEntries({
        start_date: new Date().toISOString().split('T')[0] ?? '',
        end_date: new Date().toISOString().split('T')[0] ?? '',
      });
    } finally {
      setIsSaving(false);
    }
  }, [currentTimer, selectedProjectId, description, stopTimer, resetTimer, createTimeEntry, fetchTimeEntries]);

  const isRunning = !!currentTimer.startTime;
  const activeProject = projects.find((p) => p.id === (currentTimer.projectId ?? Number(selectedProjectId)));

  const todayStr = new Date().toISOString().split('T')[0] ?? '';
  const todayEntries = entries
    .filter((e) => e.date === todayStr || e.date?.startsWith(todayStr))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const totalTodayMinutes = todayEntries.reduce((sum, e) => sum + e.duration_minutes, 0);

  return (
    <div className="space-y-6">
      {/* タイマーカード */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Clock className="w-5 h-5" />
              <span className="font-semibold">タイマー</span>
            </div>
            {isRunning && (
              <span className="flex items-center gap-1.5 text-xs text-blue-100">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                計測中
              </span>
            )}
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* プロジェクト選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <Briefcase className="inline w-4 h-4 mr-1 text-gray-400" />
              稼働案件
            </label>
            <select
              value={isRunning ? (currentTimer.projectId ?? '') : selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value === '' ? '' : Number(e.target.value))}
              disabled={isRunning}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            >
              <option value="">-- プロジェクトを選択 --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}（{p.client_name}）
                </option>
              ))}
            </select>
          </div>

          {/* 作業内容 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <FileText className="inline w-4 h-4 mr-1 text-gray-400" />
              作業内容
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="例：API実装、デザインレビュー..."
              disabled={isRunning}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          {/* タイマー表示 */}
          <div className={`rounded-xl p-6 text-center transition-colors ${isRunning ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
            <div className={`text-5xl font-mono font-bold tracking-wider ${isRunning ? 'text-green-600' : 'text-gray-700'}`}>
              {displayTime}
            </div>
            {activeProject && (
              <p className="mt-2 text-sm text-gray-500 truncate">{activeProject.name}</p>
            )}
          </div>

          {/* 開始/終了ボタン */}
          {!isRunning ? (
            <button
              onClick={handleStart}
              disabled={!selectedProjectId}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Play className="w-5 h-5 fill-white" />
              開始
            </button>
          ) : (
            <button
              onClick={handleStop}
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold bg-red-500 hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              <Square className="w-5 h-5 fill-white" />
              {isSaving ? '保存中...' : '終了・保存'}
            </button>
          )}
        </div>
      </div>

      {/* 本日の履歴 */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">本日の稼働履歴</h3>
          <span className="text-sm text-gray-500">
            合計 <span className="font-semibold text-blue-600">{formatDuration(totalTodayMinutes)}</span>
          </span>
        </div>

        {todayEntries.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-400 text-sm">
            まだ記録がありません
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {todayEntries.map((entry) => (
              <HistoryItem
                key={entry.id}
                entry={entry}
                projectName={projects.find((p) => p.id === entry.project_id)?.name ?? '不明'}
                onDelete={async () => {
                  await deleteTimeEntry(entry.id);
                  await fetchTimeEntries({
                    start_date: new Date().toISOString().split('T')[0] ?? '',
                    end_date: new Date().toISOString().split('T')[0] ?? '',
                  });
                }}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function HistoryItem({
  entry,
  projectName,
  onDelete,
}: {
  entry: TimeEntry;
  projectName: string;
  onDelete: () => void;
}) {
  return (
    <li className="px-6 py-4 hover:bg-gray-50 transition-colors group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-medium text-gray-900 truncate">{projectName}</span>
            <span className="shrink-0 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              {formatDuration(entry.duration_minutes)}
            </span>
          </div>
          {entry.description && (
            <p className="text-xs text-gray-500 truncate">{entry.description}</p>
          )}
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
            {entry.started_at && entry.ended_at ? (
              <span>{formatTime(entry.started_at)} → {formatTime(entry.ended_at)}</span>
            ) : (
              <span>{new Date(entry.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })} 記録</span>
            )}
          </div>
        </div>
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </li>
  );
}
