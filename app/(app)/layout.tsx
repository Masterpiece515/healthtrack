// Layout для защищённых страниц: сайдбар + контент
import { Sidebar } from '@/components/layout/Sidebar';
import { SyncOnLogin } from '@/components/layout/SyncOnLogin';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-screen">
      <SyncOnLogin />
      <Sidebar />
      {/* pt-14 — отступ под мобильную шапку; md:pt-0 убирает его на десктопе */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto pt-14 md:pt-0">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-12 py-6 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
