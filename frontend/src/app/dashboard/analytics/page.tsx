'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/api/client.ts';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, Clock, DollarSign, Zap, Activity } from 'lucide-react';

// ===== 型定義 =====
interface MonthlySales { month: string; month_name: string; earnings: number; }
interface MonthlyHours { month: string; month_name: string; hours: number; }
interface ProjectShare { name: string; earnings: number; percentage: number; }
interface Summary {
  current_month_earnings: number;
  current_month_hours: number;
  last_month_earnings: number;
  last_month_hours: number;
  earnings_growth: number;
  work_rate: number;
}
interface ProjectEfficiency { name: string; efficiency: number; }

const PIE_COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

// ===== フォーマッター =====
function fmtYen(v: number) {
  return '¥' + Math.floor(v).toLocaleString('ja-JP');
}
function fmtHours(h: number) {
  return `${h.toFixed(1)}h`;
}
function fmtMonthName(m: string) {
  const d = new Date(m + '-01');
  return `${d.getMonth() + 1}月`;
}

// ===== カスタム Tooltip =====
function SalesTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      <p className="text-blue-600 font-bold">{fmtYen(payload[0].value)}</p>
    </div>
  );
}
function HoursTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      <p className="text-indigo-600 font-bold">{fmtHours(payload[0].value)}</p>
    </div>
  );
}
function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{d.name}</p>
      <p className="text-gray-900 font-bold">{fmtYen(d.earnings)}</p>
      <p className="text-gray-500">{d.percentage.toFixed(1)}%</p>
    </div>
  );
}

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [salesData, setSalesData] = useState<MonthlySales[]>([]);
  const [hoursData, setHoursData] = useState<MonthlyHours[]>([]);
  const [projectsData, setProjectsData] = useState<ProjectShare[]>([]);
  const [efficiency, setEfficiency] = useState<ProjectEfficiency[]>([]);
  const [avgHourlyRate, setAvgHourlyRate] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [sumRes, salesRes, hoursRes, projectsRes, kpiRes] = await Promise.all([
          apiClient.get<{ summary: Summary }>('/dashboard/summary'),
          apiClient.get<{ data: MonthlySales[] }>('/dashboard/chart-data/sales?months=6'),
          apiClient.get<{ data: MonthlyHours[] }>('/dashboard/chart-data/hours?months=6'),
          apiClient.get<{ data: ProjectShare[] }>('/dashboard/chart-data/projects'),
          apiClient.get<{ kpi: { average_hourly_rate: number; project_efficiency: ProjectEfficiency[] } }>('/dashboard/kpi'),
        ]);
        setSummary(sumRes.data.summary);
        setSalesData(salesRes.data.data.map(d => ({ ...d, month_name: fmtMonthName(d.month) })));
        setHoursData(hoursRes.data.data.map(d => ({ ...d, month_name: fmtMonthName(d.month) })));
        setProjectsData(projectsRes.data.data);
        setAvgHourlyRate(kpiRes.data.kpi.average_hourly_rate);
        setEfficiency(kpiRes.data.kpi.project_efficiency);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (isLoading) {
    return <div className="py-20 text-center text-gray-400">読み込み中...</div>;
  }

  const growthPositive = (summary?.earnings_growth ?? 0) >= 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">分析</h1>

      {/* KPI カード */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="当月売上"
          value={fmtYen(summary?.current_month_earnings ?? 0)}
          sub={`前月比 ${growthPositive ? '+' : ''}${(summary?.earnings_growth ?? 0).toFixed(1)}%`}
          subColor={growthPositive ? 'text-green-600' : 'text-red-500'}
          icon={<DollarSign className="w-6 h-6" />}
          iconBg="bg-blue-100 text-blue-600"
          trend={growthPositive ? 'up' : 'down'}
        />
        <KpiCard
          label="当月稼働時間"
          value={fmtHours(summary?.current_month_hours ?? 0)}
          sub="今月の総稼働"
          icon={<Clock className="w-6 h-6" />}
          iconBg="bg-indigo-100 text-indigo-600"
        />
        <KpiCard
          label="平均時給"
          value={fmtYen(avgHourlyRate)}
          sub="当月の実績単価"
          icon={<Zap className="w-6 h-6" />}
          iconBg="bg-amber-100 text-amber-600"
        />
        <KpiCard
          label="稼働率"
          value={`${(summary?.work_rate ?? 0).toFixed(1)}%`}
          sub="月176h基準"
          icon={<Activity className="w-6 h-6" />}
          iconBg="bg-green-100 text-green-600"
        />
      </div>

      {/* グラフ上段：売上推移 + 稼働時間推移 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 売上推移 */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="font-semibold text-gray-900 mb-4">売上推移（過去6ヶ月）</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={salesData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month_name" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `¥${(v / 10000).toFixed(0)}万`}
                width={56}
              />
              <Tooltip content={<SalesTooltip />} />
              <Line
                type="monotone"
                dataKey="earnings"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#3b82f6' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 稼働時間推移 */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="font-semibold text-gray-900 mb-4">稼働時間推移（過去6ヶ月）</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={hoursData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month_name" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `${v}h`}
                width={44}
              />
              <Tooltip content={<HoursTooltip />} />
              <Bar dataKey="hours" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* グラフ下段：プロジェクト比率 + 効率ランキング */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* プロジェクト別売上比率 */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="font-semibold text-gray-900 mb-4">プロジェクト別売上比率</h2>
          {projectsData.length === 0 ? (
            <p className="text-gray-400 text-sm py-16 text-center">データがありません</p>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={200}>
                <PieChart>
                  <Pie
                    data={projectsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="earnings"
                  >
                    {projectsData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {projectsData.map((p, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-xs text-gray-600 truncate flex-1">{p.name}</span>
                    <span className="text-xs font-semibold text-gray-900 shrink-0">{p.percentage.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 案件別効率ランキング */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="font-semibold text-gray-900 mb-1">案件別時給効率</h2>
          <p className="text-xs text-gray-400 mb-4">実稼働ベースの時給換算</p>
          {efficiency.length === 0 ? (
            <p className="text-gray-400 text-sm py-16 text-center">データがありません</p>
          ) : (
            <div className="space-y-3">
              {efficiency.map((item, i) => {
                const max = efficiency[0]?.efficiency || 1;
                const pct = (item.efficiency / max) * 100;
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700 truncate max-w-[60%]">{item.name}</span>
                      <span className="text-sm font-bold text-gray-900">
                        {fmtYen(item.efficiency)}/h
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: PIE_COLORS[i % PIE_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ===== KPI カードコンポーネント =====
function KpiCard({
  label, value, sub, subColor = 'text-gray-400', icon, iconBg, trend,
}: {
  label: string;
  value: string;
  sub?: string;
  subColor?: string;
  icon: React.ReactNode;
  iconBg: string;
  trend?: 'up' | 'down';
}) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-gray-500">{label}</p>
        <span className={`p-2 rounded-xl ${iconBg}`}>{icon}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && (
        <p className={`text-xs mt-1 flex items-center gap-1 ${subColor}`}>
          {trend === 'up' && <TrendingUp className="w-3 h-3" />}
          {trend === 'down' && <TrendingDown className="w-3 h-3" />}
          {sub}
        </p>
      )}
    </div>
  );
}
