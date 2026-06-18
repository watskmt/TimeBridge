import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { Providers } from './providers.tsx';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TimeBridge - Freelance Engineer Platform',
  description: '稼働時間記録、プロジェクト管理、請求書自動生成をワンプラットフォームで',
  keywords: ['freelance', 'time tracking', 'project management', 'invoicing'],
  authors: [{ name: 'TimeBridge Team' }],
  creator: 'TimeBridge',
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: 'https://timebridge.local',
    title: 'TimeBridge',
    description: 'フリーランスエンジニア向け統合管理プラットフォーム',
    siteName: 'TimeBridge',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={inter.className}>
        <div
          aria-label="DEMO版"
          className="fixed top-0 left-0 z-[9999] bg-red-600 px-2 py-1 text-xs font-bold text-white shadow-md pointer-events-none select-none"
        >
          DEMO版
        </div>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
