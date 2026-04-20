'use client';

import { useEffect, useState } from 'react';
import { useProjectsStore } from '@/store/projects.ts';
import { useTimeEntriesStore } from '@/store/time-entries.ts';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const { projects } = useProjectsStore();
  const { entries } = useTimeEntriesStore();
  const [chartData, setChartData] = useState<any[]>([]);
  const [projectChartData, setProjectChartData] = useState<any[]>([]);

  // グラフデータの準備
  useEffect(() => {
    // 過去6ヶ月のデータを生成
    const data = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEntries = entries.filter((e) => {
        const entryDate = new Date(e.date);
        return (
          entryDate.getMonth() === date.getMonth() &&
          entryDate.getFullYear() === date.getFullYear()
        );
      });

      const hours = monthEntries.reduce((sum, e) => sum + e.duration_minutes, 0) / 60;
      const earnings = monthEntries.reduce((sum, e) => {
        const project = projects.find((p) => p.id === e.project_id);
        return sum + (e.duration_minutes / 60) * (project?.hourly_rate || 0);
      }, 0);

      data.push({
        month: date.toLocaleDateString('ja-JP', { month: 'short' }),
        hours: Number(hours.toFixed(1)),
        earnings: Number(earnings.toFixed(0)),
      });
    }

    setChartData(data);
  }, [entries, projects]);

  // プロジェクト別売上
  useEffect(() => {
    const projectData = projects
      .filter((p) => ['in_progress', 'inspection'].includes(p.status))
      .map((project) => {
        const projectEntries = entries.filter((e) => e.project_id === project.id);
        const hours = projectEntries.reduce((sum, e) => sum + e.duration_minutes, 0) / 60;
        const earnings = hours * project.hourly_rate;
        return {
          name: project.name,
          value: Number(earnings.toFixed(0)),
          hours: Number(hours.toFixed(1)),
        };
      })
      .sort((a, b) => b.value - a.value);

    setProjectChartData(projectData);
  }, [projects, entries]);

  // 予算超過プロジェクト
  const overBudgetProjects = projects.filter((p) => {
    const projectEntries = entries.filter((e) => e.project_id === p.id);
    const earnings = projectEntries.reduce((sum, e) => {
      return sum + (e.duration_minutes / 60) * p.hourly_rate;
    }, 0);
    return earnings > p.budget_amount;
  });

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {overBudgetProjects.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-yellow-900">予算超過プロジェクト</p>
            <p className="text-sm text-yellow-800 mt-1">
              {overBudgetProjects.map((p) => p.name).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6">
        {/* Earnings Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            売上推移（6ヶ月）
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value) => {
                  if (typeof value === 'number') {
                    return value > 100 ? `¥${value.toLocaleString('ja-JP')}` : `${value}h`;
                  }
                  return value;
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="earnings"
                stroke="#3b82f6"
                name="売上（¥）"
                dot={{ r: 4 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="hours"
                stroke="#10b981"
                name="稼働時間（時）"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Project Distribution */}
        {projectChartData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                プロジェクト別売上
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={projectChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ¥${value.toLocaleString('ja-JP')}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {projectChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `¥${(value as number).toLocaleString('ja-JP')}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                プロジェクト詳細
              </h3>
              <div className="space-y-3">
                {projectChartData.map((project, index) => (
                  <div key={project.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <div>
                        <p className="font-medium text-gray-900">{project.name}</p>
                        <p className="text-xs text-gray-600">{project.hours}時間</p>
                      </div>
                    </div>
                    <p className="font-semibold text-gray-900">
                      ¥{project.value.toLocaleString('ja-JP')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Hourly Rate Ranking */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            案件別効率ランキング
          </h3>
          <div className="space-y-3">
            {projects
              .map((project) => {
                const projectEntries = entries.filter((e) => e.project_id === project.id);
                const hours = projectEntries.reduce((sum, e) => sum + e.duration_minutes, 0) / 60;
                const efficiency = hours > 0 ? project.hourly_rate : 0;
                return { ...project, efficiency };
              })
              .sort((a, b) => b.efficiency - a.efficiency)
              .filter((p) => p.efficiency > 0)
              .slice(0, 5)
              .map((project, index) => (
                <div key={project.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-600 w-6 text-center">#{index + 1}</span>
                    <div>
                      <p className="font-medium text-gray-900">{project.name}</p>
                      <p className="text-xs text-gray-600">{project.client_name}</p>
                    </div>
                  </div>
                  <p className="font-semibold text-gray-900">
                    ¥{project.efficiency.toLocaleString('ja-JP', {
                      maximumFractionDigits: 0,
                    })}/時
                  </p>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
