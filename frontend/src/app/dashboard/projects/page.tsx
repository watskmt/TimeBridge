'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useProjectsStore } from '@/store/projects.ts';
import { Button } from '@/components/ui/button.tsx';
import { Project, ProjectStatus } from '@/types';
import { Plus, Search, Filter, Calendar, DollarSign, TrendingUp, Trash2, Edit2 } from 'lucide-react';

const statusLabels: Record<ProjectStatus, string> = {
  planning: '計画中',
  in_progress: '進行中',
  inspection: '検収中',
  completed: '完了',
};

const statusColors: Record<ProjectStatus, string> = {
  planning: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  inspection: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
};

export default function ProjectsPage() {
  const { projects, fetchProjects, deleteProject } = useProjectsStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | 'all'>('all');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetchProjects().finally(() => setIsLoading(false));
  }, [fetchProjects]);

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.client_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (id: number) => {
    if (confirm('このプロジェクトを削除しますか？')) {
      try {
        await deleteProject(id);
        alert('削除しました');
      } catch (error) {
        alert('削除に失敗しました');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">プロジェクト管理</h1>
        <Link href="/dashboard/projects/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            新規プロジェクト
          </Button>
        </Link>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="プロジェクト名またはクライアント名で検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input pl-10 w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ProjectStatus | 'all')}
            className="form-input"
          >
            <option value="all">すべてのステータス</option>
            <option value="planning">計画中</option>
            <option value="in_progress">進行中</option>
            <option value="inspection">検収中</option>
            <option value="completed">完了</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">読み込み中...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600 mb-4">プロジェクトがありません</p>
          <Link href="/dashboard/projects/new">
            <Button>最初のプロジェクトを作成</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div key={project.id} className="bg-white rounded-lg shadow-lg hover:shadow-xl transition overflow-hidden">
              {/* Card Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold">{project.name}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[project.status]}`}>
                    {statusLabels[project.status]}
                  </span>
                </div>
                <p className="text-blue-100 text-sm">{project.client_name}</p>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3">
                {/* Dates */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(project.start_date).toLocaleDateString('ja-JP')} ～{' '}
                    {new Date(project.end_date).toLocaleDateString('ja-JP')}
                  </span>
                </div>

                {/* Budget Info */}
                <div className="bg-gray-50 rounded p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-700">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-sm">予算</span>
                    </div>
                    <span className="font-semibold">¥{project.budget_amount.toLocaleString('ja-JP', { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-700">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm">時給</span>
                    </div>
                    <span className="font-semibold">¥{project.hourly_rate.toLocaleString('ja-JP', { maximumFractionDigits: 0 })}/h</span>
                  </div>
                </div>

                {/* Description */}
                {project.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
                )}
              </div>

              {/* Card Footer */}
              <div className="bg-gray-50 p-4 flex items-center justify-between border-t">
                <Link href={`/dashboard/projects/${project.id}`}>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Edit2 className="w-4 h-4" />
                    詳細
                  </Button>
                </Link>
                <button
                  onClick={() => handleDelete(project.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="削除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
