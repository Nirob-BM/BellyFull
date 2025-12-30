import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { MapPin, Clock, Phone, Mail } from "lucide-react";

const openingHours = [
  { day: "Saturday - Thursday", hours: "11:00 AM - 11:00 PM" },
  { day: "Friday", hours: "3:00 PM - 11:00 PM" },
];

const Location = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="location" className="py-24 bg-background" ref={ref}>
      <div className="container">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-secondary/20 text-secondary-foreground text-sm font-medium mb-4">
            Find Us
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Visit <span className="text-secondary">Belly Full</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Located in the heart of Kishoreganj, we're easy to find and ready to welcome you
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Map */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="rounded-2xl overflow-hidden shadow-elegant-lg border border-border"
          >
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3631.7!2d90.785!3d24.43!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjTCsDI1JzQ4LjAiTiA5MMKwNDcnMDYuMCJF!5e0!3m2!1sen!2sbd!4v1640000000000!5m2!1sen!2sbd"
              width="100%"
              height="400"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Belly Full Location"
              className="w-full"
            />
          </motion.div>

          {/* Info Cards */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            {/* Address Card */}
            <div className="bg-card rounded-2xl p-6 shadow-elegant border border-border">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-semibold text-foreground mb-2">Our Address</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    53, Opposite of Tomaltola Primary School,<br />
                    Rothkhola, Kishoreganj 2300,<br />
                    Dhaka Division, Bangladesh
                  </p>
                </div>
              </div>
            </div>

            {/* Opening Hours Card */}
            <div className="bg-card rounded-2xl p-6 shadow-elegant border border-border">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-6 w-6 text-secondary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-xl font-semibold text-foreground mb-4">Opening Hours</h3>
                  <div className="space-y-3">
                    {openingHours.map((item) => (
                      <div key={item.day} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                        <span className="text-foreground font-medium">{item.day}</span>
                        <span className="text-secondary font-semibold">{item.hours}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Card */}
            <div className="bg-card rounded-2xl p-6 shadow-elegant border border-border">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-semibold text-foreground mb-2">Contact Us</h3>
                  <div className="space-y-2">
                    <a 
                      href="tel:+8801863339695" 
                      className="flex items-center gap-2 text-muted-foreground hover:text-secondary transition-colors"
                    >
                      <Phone className="h-4 w-4" />
                      01863-339695
                    </a>
                    <a 
                      href="mailto:bellyfull2022@gmail.com" 
                      className="flex items-center gap-2 text-muted-foreground hover:text-secondary transition-colors"
                    >
                      <Mail className="h-4 w-4" />
                      bellyfull2022@gmail.com
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Location;
