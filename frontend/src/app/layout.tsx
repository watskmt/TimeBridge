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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
