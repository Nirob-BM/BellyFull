import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import heroAvifPreload from "@/assets/cover-opt.jpg?w=480;800;1280;1920&format=avif&as=srcset";
import heroWebpPreload from "@/assets/cover-opt.jpg?w=480;800;1280;1920&format=webp&as=srcset";
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

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "Do you accept reservations?", acceptedAnswer: { "@type": "Answer", text: "Yes — book through our website, call 01863-339695, or visit. We confirm reservations within 2 hours." } },
    { "@type": "Question", name: "What dietary options do you offer?", acceptedAnswer: { "@type": "Answer", text: "We offer vegetarian and vegan-friendly options and can accommodate most allergies with advance notice." } },
    { "@type": "Question", name: "Is parking available?", acceptedAnswer: { "@type": "Answer", text: "Yes, parking is available near the restaurant and on Rothkhola Road." } },
    { "@type": "Question", name: "Do you offer takeaway and delivery?", acceptedAnswer: { "@type": "Answer", text: "Yes — takeaway and delivery within Kishoreganj city. Minimum order applies for delivery." } },
    { "@type": "Question", name: "Can you accommodate large groups or private events?", acceptedAnswer: { "@type": "Answer", text: "Yes, we host groups of up to 50 people. Contact us in advance for custom arrangements." } },
    { "@type": "Question", name: "What are your payment options?", acceptedAnswer: { "@type": "Answer", text: "We accept cash, bKash, Nagad, and major debit/credit cards." } },
  ],
};

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
      <Helmet>
        <title>Belly Full — Multicuisine Restaurant in Kishoreganj</title>
        <meta name="description" content="Belly Full is Kishoreganj's first authentic multicuisine restaurant & cafe — Bengali, Indian and international flavors. Book a table today." />
        <link rel="canonical" href="https://bellyfull.lovable.app/" />
        <meta property="og:title" content="Belly Full — Multicuisine Restaurant in Kishoreganj" />
        <meta property="og:description" content="Kishoreganj's first authentic multicuisine restaurant & cafe." />
        <meta property="og:url" content="https://bellyfull.lovable.app/" />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>
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