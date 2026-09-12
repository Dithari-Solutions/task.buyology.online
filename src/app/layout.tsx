import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

// Manrope is one of the two Buyology brand typefaces. Biennale, the other one,
// is a licensed face and is not distributable with the app, so Manrope carries
// the whole interface - the guidelines approve it for exactly this use.
const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: {
    default: 'Buyology Kanban',
    template: '%s · Buyology Kanban',
  },
  description: 'Task management for Buyology — platforms, boards and kanban workflows.',
};

export const viewport: Viewport = {
  themeColor: '#402f75',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={manrope.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
