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
  return (
    <div className="min-h-screen">
      <Header />
      <main>
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
    </div>
  );
};

export default Index;