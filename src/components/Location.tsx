import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { MapPin, Clock, Phone, Mail } from "lucide-react";
import { useSiteSettings, useOpeningHours } from "@/hooks/useSiteSettings";

const Location = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { settings } = useSiteSettings();
  const { hours: openingHours, isLoading: hoursLoading } = useOpeningHours();

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
            Visit <span className="text-secondary">{settings.general.restaurantName}</span>
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
              src={settings.general.googleMapsUrl}
              width="100%"
              height="400"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`${settings.general.restaurantName} Location`}
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
                    {settings.general.address.split(",").map((line, i, arr) => (
                      <span key={i}>
                        {line.trim()}
                        {i < arr.length - 1 && <br />}
                      </span>
                    ))}
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
                    {hoursLoading ? (
                      <div className="text-muted-foreground">Loading hours...</div>
                    ) : openingHours.length > 0 ? (
                      openingHours.map((item) => (
                        <div key={item.day} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                          <span className="text-foreground font-medium">{item.day}</span>
                          <span className={item.isClosed ? "text-muted-foreground" : "text-secondary font-semibold"}>
                            {item.hours}
                          </span>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="flex justify-between items-center py-2 border-b border-border">
                          <span className="text-foreground font-medium">Saturday - Thursday</span>
                          <span className="text-secondary font-semibold">11:00 AM - 11:00 PM</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-foreground font-medium">Friday</span>
                          <span className="text-secondary font-semibold">3:00 PM - 11:00 PM</span>
                        </div>
                      </>
                    )}
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
                      href={`tel:+88${settings.general.phone.replace(/[^0-9]/g, '')}`}
                      className="flex items-center gap-2 text-muted-foreground hover:text-secondary transition-colors"
                    >
                      <Phone className="h-4 w-4" />
                      {settings.general.phone}
                    </a>
                    <a 
                      href={`mailto:${settings.general.email}`}
                      className="flex items-center gap-2 text-muted-foreground hover:text-secondary transition-colors"
                    >
                      <Mail className="h-4 w-4" />
                      {settings.general.email}
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
