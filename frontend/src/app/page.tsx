import Link from 'next/link';
import { Button } from '@/components/ui/button.tsx';
import { ArrowRight, Clock, Briefcase, FileText, BarChart3 } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-blue-600">TimeBridge</div>
          <div className="space-x-4">
            <Link
              href="/auth/login"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              ログイン
            </Link>
            <Link href="/auth/register">
              <Button>登録</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          フリーランスエンジニア向け
          <br />
          統合管理プラットフォーム
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          稼働時間記録、プロジェクト管理、検収、請求書自動生成。
          すべてをワンプラットフォームで実現。
        </p>
        <div className="flex gap-4 justify-center mb-12">
          <Link href="/auth/register">
            <Button size="lg" className="gap-2">
              今すぐ始める
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="#features">
            <Button size="lg" variant="outline">
              機能を見る
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">主な機能</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Time Tracking */}
            <div className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition">
              <Clock className="w-10 h-10 text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">稼働時間記録</h3>
              <p className="text-gray-600">
                リアルタイムタイマーで正確な稼働時間を記録。
                手動入力にも対応。
              </p>
            </div>

            {/* Project Management */}
            <div className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition">
              <Briefcase className="w-10 h-10 text-green-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">プロジェクト管理</h3>
              <p className="text-gray-600">
                複数案件を同時管理。予算管理、進捗追跡も簡単。
              </p>
            </div>

            {/* Invoicing */}
            <div className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition">
              <FileText className="w-10 h-10 text-purple-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">請求書管理</h3>
              <p className="text-gray-600">
                テンプレートベースのPDF請求書を自動生成。
                複数案件の合算対応。
              </p>
            </div>

            {/* Analytics */}
            <div className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition">
              <BarChart3 className="w-10 h-10 text-orange-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">ダッシュボード</h3>
              <p className="text-gray-600">
                売上・稼働率・未払い額をリアルタイム可視化。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            業務効率化を始めませんか？
          </h2>
          <p className="text-lg mb-8 opacity-90">
            無料で始められます。クレジットカードは不要です。
          </p>
          <Link href="/auth/register">
            <Button size="lg" variant="secondary">
              無料で登録
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="font-semibold text-white mb-4">About</h4>
              <p className="text-sm">
                TimeBridge - フリーランスエンジニアの業務効率化ツール
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Links</h4>
              <ul className="text-sm space-y-2">
                <li><Link href="#" className="hover:text-white">利用規約</Link></li>
                <li><Link href="#" className="hover:text-white">プライバシー</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="text-sm space-y-2">
                <li><Link href="#" className="hover:text-white">お問い合わせ</Link></li>
                <li><Link href="#" className="hover:text-white">ドキュメント</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2026 TimeBridge. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
