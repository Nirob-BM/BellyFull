import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Utensils, Heart, Users, Award } from "lucide-react";
import coverImage from "@/assets/cover-opt.jpg";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const features = [
  {
    icon: Utensils,
    title: "Multicuisine Excellence",
    description: "From Bengali classics to international favorites, crafted with passion.",
  },
  {
    icon: Heart,
    title: "Made with Love",
    description: "Every dish is prepared with the finest ingredients and heartfelt care.",
  },
  {
    icon: Users,
    title: "Family Friendly",
    description: "A welcoming atmosphere perfect for families and celebrations.",
  },
  {
    icon: Award,
    title: "Quality First",
    description: "Committed to delivering exceptional taste and service every time.",
  },
];

const About = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { settings } = useSiteSettings();

  return (
    <section id="about" className="py-24 bg-gradient-warm" ref={ref}>
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Image Side */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-elegant-lg">
              <img
                src={coverImage}
                alt={settings.general.restaurantName}
                className="w-full aspect-[4/3] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent" />
            </div>
            {/* Floating Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="absolute -bottom-8 -right-8 bg-card rounded-xl p-6 shadow-elegant-lg border border-border max-w-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-gold flex items-center justify-center">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-display text-lg font-semibold text-foreground">
                    Est. {settings.about.establishedYear}
                  </div>
                  <div className="text-sm text-muted-foreground">Serving Kishoreganj</div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Content Side */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-secondary/20 text-secondary-foreground text-sm font-medium mb-4">
              Our Story
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
              {settings.about.title.includes("Kishoreganj") ? (
                <>
                  A Culinary Journey in the Heart of{" "}
                  <span className="text-secondary">Kishoreganj</span>
                </>
              ) : (
                settings.about.title
              )}
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              {settings.about.description}
            </p>
            <p className="text-muted-foreground leading-relaxed mb-10">
              {settings.about.secondaryDescription}
            </p>

            {/* Features Grid */}
            <div className="grid sm:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
                  className="flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default About;
