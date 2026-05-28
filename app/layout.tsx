// Root layout — только HTML-обёртка без UI
// Каждая route group добавляет свой layout поверх
import type { Metadata } from 'next';
import { Karla } from 'next/font/google';
import { Providers } from '@/components/providers';
import { ToastProvider } from '@/lib/toast-context';
import './globals.css';

const karla = Karla({ subsets: ['latin'], variable: '--font-karla' });

export const metadata: Metadata = {
  title: 'HealthTrack — Мониторинг здоровья',
  description: 'Персональный дашборд для отслеживания показателей здоровья',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`h-full scroll-smooth ${karla.variable}`}>
      <body className="h-full bg-[#F5F6F3] antialiased" style={{ fontFamily: 'var(--font-karla), sans-serif' }}>
        <Providers>
          <ToastProvider>{children}</ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
