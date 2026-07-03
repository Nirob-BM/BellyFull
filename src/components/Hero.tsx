import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronDown, Star } from "lucide-react";
import coverImage from "@/assets/cover-opt.jpg";

const Hero = () => {
  return (
    <section id="home" className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img
          src={coverImage}
          alt="Belly Full Restaurant Interior"
          width={1920}
          height={1080}
          className="w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/70 to-primary/90" />
      </div>

      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-16 left-4 sm:top-20 sm:left-10 w-20 h-20 sm:w-32 sm:h-32 bg-secondary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-32 right-6 sm:bottom-40 sm:right-20 w-28 h-28 sm:w-48 sm:h-48 bg-secondary/15 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative container z-10 text-center px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-24 sm:pb-20">

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto flex flex-col items-center gap-y-5 sm:gap-y-6"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-secondary/20 backdrop-blur-sm border border-secondary/30 max-w-[92vw]"
          >
            <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-secondary fill-secondary shrink-0" />
            <span className="text-[11px] sm:text-sm font-medium text-primary-foreground leading-tight text-center">
              First Authentic Multicuisine Experience in Kishoreganj
            </span>
          </motion.div>

          {/* Main Heading */}
          <h1
            className="font-display font-bold text-primary-foreground leading-tight px-2"
            style={{ fontSize: "clamp(1.75rem, 6vw + 0.5rem, 4.5rem)" }}
          >
            Belly Full — Multicuisine Restaurant in{" "}
            <span className="text-secondary">Kishoreganj</span>
          </h1>


          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-sm sm:text-lg md:text-xl text-primary-foreground/90 max-w-md md:max-w-2xl mx-auto px-2"

          >
            Experience the finest multicuisine dining in the heart of Kishoreganj.
            From traditional Bengali delights to international flavors, every dish tells a story.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="w-full flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-2"
          >
            <Button
              size="lg"
              className="bg-gradient-gold hover:opacity-90 text-primary font-semibold text-base sm:text-lg w-full max-w-sm sm:w-auto min-h-[48px] px-8 sm:py-6 shadow-elegant-lg"
              asChild
            >
              <a href="#reservation">Book Your Table</a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-secondary/50 text-secondary hover:bg-secondary/10 text-base sm:text-lg w-full max-w-sm sm:w-auto min-h-[48px] px-8 sm:py-6"
              asChild
            >
              <a href="#menu">Explore Our Menu</a>
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="mt-8 sm:mt-12 w-full flex flex-wrap justify-around items-center gap-y-4 max-w-lg mx-auto"
          >
            {[
              { value: "50+", label: "Dishes" },
              { value: "2K+", label: "Happy Guests" },
              { value: "5★", label: "Rating" },
            ].map((stat) => (
              <div key={stat.label} className="text-center min-w-[80px]">
                <div className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-secondary">{stat.value}</div>
                <div className="text-xs sm:text-sm text-primary-foreground/70">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.a
        href="#about"
        aria-label="Scroll to About section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-primary-foreground/80 hover:text-primary-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded-full"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <ChevronDown className="h-8 w-8" aria-hidden="true" />
        </motion.div>
      </motion.a>
    </section>
  );
};

export default Hero;
