import { Navbar }           from '@/components/landing/Navbar';
import { Hero }             from '@/components/landing/Hero';
import { Features }         from '@/components/landing/Features';
import { HowItWorks }       from '@/components/landing/HowItWorks';
import { DashboardPreview } from '@/components/landing/DashboardPreview';
import { CTA }              from '@/components/landing/CTA';
import { Footer }           from '@/components/landing/Footer';
import { ScrollSteps }      from '@/components/landing/ScrollSteps';

export default function LandingPage() {
  return (
    <>
      <ScrollSteps />
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
