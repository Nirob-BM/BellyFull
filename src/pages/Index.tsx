import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import About from "@/components/About";
import CategoryShowcase from "@/components/CategoryShowcase";
import PopularItems from "@/components/PopularItems";
import Menu from "@/components/Menu";
import Reservation from "@/components/Reservation";
import Testimonials from "@/components/Testimonials";
import Location from "@/components/Location";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

const Index = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.slice(1);
      // Wait for sections to mount
      requestAnimationFrame(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [location.hash]);

  return (
    <div className="min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-secondary"
      >
        Skip to main content
      </a>
      <Header />
      <main id="main-content">
        <Hero />
        <About />
        <CategoryShowcase />
        <PopularItems />
        <Menu />
        <Reservation />
        <Testimonials />
        <Location />
        <FAQ />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Index;