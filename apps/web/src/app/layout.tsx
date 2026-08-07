import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SessionProvider } from '@/components/auth/session-provider';

export const metadata: Metadata = {
  title: {
    default: 'ClipDeck',
    template: '%s · ClipDeck',
  },
  description:
    'Open-source gaming clip platform. Share clips and screenshots, tag them by game and platform, and browse communities.',
  applicationName: 'ClipDeck',
};

export const viewport: Viewport = {
  themeColor: '#1E1F22',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="h-screen w-screen overflow-hidden">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
