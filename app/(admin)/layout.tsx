import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;

  if (!session || role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="flex h-full min-h-screen bg-[#0F0F1A]">
      <AdminSidebar />
      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        {/* pt-14 на мобиле — под фиксированную шапку; pb-20 — над нижним баром */}
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-20 pb-24 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
