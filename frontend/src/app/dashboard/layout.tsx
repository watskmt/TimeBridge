'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.ts';
import { useProjectsStore } from '@/store/projects.ts';
import { useTimeEntriesStore } from '@/store/time-entries.ts';
import {
  BarChart3, 
  Clock, 
  Briefcase, 
  FileText, 
  LogOut, 
  Menu, 
  X,
  Home,
  Settings,
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { projects, fetchProjects } = useProjectsStore();
  const { entries, fetchTimeEntries } = useTimeEntriesStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);

  // Zustand persist のハイドレーション完了を待つ
  useEffect(() => {
    setHasHydrated(useAuthStore.persist.hasHydrated());
    const unsub = useAuthStore.persist.onFinishHydration(() => setHasHydrated(true));
    return unsub;
  }, []);

  // 認証チェック（ハイドレーション完了後のみ）
  useEffect(() => {
    if (hasHydrated && (!isAuthenticated || !user)) {
      router.push('/auth/login');
    }
  }, [hasHydrated, isAuthenticated, user, router]);

  // データ取得
  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
      fetchTimeEntries();
    }
  }, [isAuthenticated, fetchProjects, fetchTimeEntries]);

  // レスポンシブ対応
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      setIsSidebarOpen(window.innerWidth >= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = async () => {
    if (confirm('ログアウトしますか？')) {
      await logout();
      router.push('/');
    }
  };

  // 当月の稼働時間と売上を計算
  const now = new Date();
  const currentMonthEntries = entries.filter((e) => {
    const entryDate = new Date(e.date);
    return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
  });

  const totalHours = currentMonthEntries.reduce((sum, e) => sum + e.duration_minutes, 0) / 60;
  const totalEarnings = currentMonthEntries.reduce((sum, e) => {
    const project = projects.find((p) => p.id === e.project_id);
    return sum + (e.duration_minutes / 60) * (project?.hourly_rate || 0);
  }, 0);

  const activeProjects = projects.filter((p) => 
    ['planning', 'in_progress', 'inspection'].includes(p.status)
  ).length;

  if (!hasHydrated) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`
          fixed md:relative z-40 w-64 bg-gray-900 text-white transform transition-transform duration-200
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          flex flex-col
        `}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-2xl font-bold">TimeBridge</h1>
          <p className="text-xs text-gray-400 mt-1">{user.name}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          <NavLink 
            href="/dashboard" 
            icon={<Home className="w-5 h-5" />} 
            label="ダッシュボード"
          />
          <NavLink 
            href="/dashboard/time-tracking" 
            icon={<Clock className="w-5 h-5" />} 
            label="稼働時間"
          />
          <NavLink 
            href="/dashboard/projects" 
            icon={<Briefcase className="w-5 h-5" />} 
            label="プロジェクト"
          />
          <NavLink 
            href="/dashboard/invoices" 
            icon={<FileText className="w-5 h-5" />} 
            label="請求書"
          />
          <NavLink 
            href="/dashboard/analytics" 
            icon={<BarChart3 className="w-5 h-5" />} 
            label="分析"
          />
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-gray-800 space-y-2">
          <NavLink 
            href="/dashboard/settings" 
            icon={<Settings className="w-5 h-5" />} 
            label="設定"
          />
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-lg transition"
          >
            <LogOut className="w-5 h-5" />
            <span>ログアウト</span>
          </button>
          <p className="text-xs text-gray-500 text-center mt-2 select-none">
            © {new Date().getFullYear()} AM Tech (Wataru Sakamoto)
          </p>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isSidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white shadow">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              {isSidebarOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
            <h2 className="text-xl font-semibold text-gray-900">ダッシュボード</h2>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">ログイン中</p>
                <p className="font-medium text-gray-900">{user.name}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* KPI Cards */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">当月稼働時間</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {totalHours.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">時間</p>
                </div>
                <Clock className="w-12 h-12 text-blue-100" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">当月売上</p>
                  <p className="text-3xl font-bold text-gray-900">
                    ¥{totalEarnings.toLocaleString('ja-JP', {
                      maximumFractionDigits: 0,
                    })}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">見積</p>
                </div>
                <BarChart3 className="w-12 h-12 text-green-100" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">進行中プロジェクト</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {activeProjects}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">件</p>
                </div>
                <Briefcase className="w-12 h-12 text-purple-100" />
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div>{children}</div>
        </main>
      </div>
    </div>
  );
}

function NavLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-lg transition"
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
