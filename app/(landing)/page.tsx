import { Navbar }           from '@/components/landing/Navbar';
import { Hero }             from '@/components/landing/Hero';
import { Features }         from '@/components/landing/Features';
import { HowItWorks }       from '@/components/landing/HowItWorks';
import { DashboardPreview } from '@/components/landing/DashboardPreview';
import { CTA }              from '@/components/landing/CTA';
import { Footer }           from '@/components/landing/Footer';

// Статически рендерим лендинг — он не зависит от данных пользователя
export const dynamic = 'force-static';

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <DashboardPreview />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
