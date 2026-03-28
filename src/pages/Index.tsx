import { lazy, Suspense } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";

// Lazy load below-fold sections
const About = lazy(() => import("@/components/About"));
const CategoryShowcase = lazy(() => import("@/components/CategoryShowcase"));
const PopularItems = lazy(() => import("@/components/PopularItems"));
const Menu = lazy(() => import("@/components/Menu"));
const Reservation = lazy(() => import("@/components/Reservation"));
const Testimonials = lazy(() => import("@/components/Testimonials"));
const Location = lazy(() => import("@/components/Location"));
const FAQ = lazy(() => import("@/components/FAQ"));
const Footer = lazy(() => import("@/components/Footer"));

const SectionFallback = () => (
  <div className="py-16 flex items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <Suspense fallback={<SectionFallback />}>
          <About />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <CategoryShowcase />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <PopularItems />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <Menu />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <Reservation />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <Testimonials />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <Location />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <FAQ />
        </Suspense>
      </main>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
};

export default Index;
