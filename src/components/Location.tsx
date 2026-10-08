import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { MapPin, Clock, Phone, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useOpeningStatus, formatRange } from "@/hooks/useOpeningStatus";

const Location = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { settings } = useSiteSettings();
  const {
    hours,
    isLoading: hoursLoading,
    isOpen,
    todayIndex,
    nextOpeningLabel,
    closingLabel,
  } = useOpeningStatus();

  const statusText = hoursLoading ? "Checking…" : isOpen ? "Open now" : "Closed now";
  const statusNote = hoursLoading
    ? "Loading today's hours…"
    : isOpen
      ? closingLabel || "Ordering is open."
      : nextOpeningLabel || "Check back for our next service.";

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

        {/* Top row: Map + Opening Hours side by side on desktop, stacked on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-4 md:mb-6 items-stretch">
          {/* Map */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="rounded-2xl overflow-hidden shadow-elegant-lg border border-border min-h-[300px] lg:min-h-[380px]"
          >
            <iframe
              src={settings.general.googleMapsUrl}
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: 300 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`${settings.general.restaurantName} Location`}
              className="w-full h-full min-h-[300px] lg:min-h-[380px]"
            />
          </motion.div>

          {/* Opening Hours Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-card rounded-2xl p-4 md:p-6 shadow-elegant border border-border flex flex-col"
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-2">
              <div className="flex items-center gap-2.5 md:gap-3 mr-auto min-w-0">
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-secondary/20 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-4 w-4 md:h-5 md:w-5 text-secondary" />
                </div>
                <h3 className="font-display text-base sm:text-lg lg:text-xl font-semibold text-foreground whitespace-nowrap">
                  Opening Hours
                </h3>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 md:gap-2 px-2.5 py-1 md:px-3 rounded-full text-xs lg:text-sm font-semibold whitespace-nowrap ${
                  isOpen ? "bg-primary/15 text-primary" : "bg-destructive/10 text-destructive"
                }`}
              >
                <span
                  className={`h-2 w-2 lg:h-2.5 lg:w-2.5 rounded-full ${
                    isOpen ? "bg-primary animate-pulse" : "bg-destructive"
                  }`}
                  aria-hidden="true"
                />
                {statusText}
              </span>
            </div>

            <p className="text-xs lg:text-sm text-muted-foreground mb-3">{statusNote}</p>


            <ul className="flex-1">
              {hoursLoading ? (
                <li className="py-3 text-sm text-muted-foreground">Loading hours…</li>
              ) : hours.length === 0 ? (
                <>
                  <li className="flex items-center justify-between gap-3 py-2">
                    <span className="text-sm md:text-base text-foreground font-medium">
                      Saturday – Thursday
                    </span>
                    <span className="text-sm md:text-base text-secondary font-semibold tabular-nums">
                      11:00 AM – 11:00 PM
                    </span>
                  </li>
                  <li className="flex items-center justify-between gap-3 py-2">
                    <span className="text-sm md:text-base text-foreground font-medium">Friday</span>
                    <span className="text-sm md:text-base text-secondary font-semibold tabular-nums">
                      3:00 PM – 11:00 PM
                    </span>
                  </li>
                </>
              ) : (
                hours.map((h) => {
                  const isToday = h.day_of_week === todayIndex;
                  return (
                    <li
                      key={h.day_of_week}
                      className={`flex items-center justify-between gap-3 py-2 md:py-2.5 -mx-2 px-2 rounded-lg ${
                        isToday ? "bg-secondary/10" : ""
                      }`}
                    >
                      <span
                        className={`flex items-center gap-2 text-sm md:text-base ${
                          isToday ? "font-semibold text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {h.day_name}
                        {isToday && (
                          <span className="text-xs font-medium text-secondary">Today</span>
                        )}
                      </span>
                      <span
                        className={`text-sm md:text-base tabular-nums ${
                          h.is_closed
                            ? "text-destructive"
                            : isToday
                              ? "font-semibold text-foreground"
                              : "text-foreground"
                        }`}
                      >
                        {h.is_closed ? "Closed" : formatRange(h.open_time, h.close_time)}
                      </span>
                    </li>
                  );
                })
              )}
            </ul>

            <div className="flex gap-2 mt-4">
              <Button
                asChild
                size="sm"
                variant={isOpen ? "default" : "outline"}
                className="flex-1"
              >
                <Link to="/menu">{isOpen ? "Order now" : "View menu"}</Link>
              </Button>
              <Button asChild size="sm" variant="outline" aria-label="Call the restaurant">
                <a href={`tel:+88${settings.general.phone.replace(/[^0-9]/g, "")}`}>
                  <Phone className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Bottom row: Contact + Address side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 text-left">
          {/* Address Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-card rounded-2xl p-4 md:p-6 shadow-elegant border border-border"
          >
            <div className="flex items-start gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-lg md:text-xl font-semibold text-foreground mb-2">Our Address</h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  {settings.general.address.split(",").map((line, i, arr) => (
                    <span key={i}>
                      {line.trim()}
                      {i < arr.length - 1 && <br />}
                    </span>
                  ))}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Contact Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-card rounded-2xl p-4 md:p-6 shadow-elegant border border-border"
          >
            <div className="flex items-start gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Phone className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-lg md:text-xl font-semibold text-foreground mb-2">Contact Us</h3>
                <div className="space-y-2">
                  <a 
                    href={`tel:+88${settings.general.phone.replace(/[^0-9]/g, '')}`}
                    className="flex items-center gap-2 text-sm md:text-base text-muted-foreground hover:text-secondary transition-colors"
                  >
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    {settings.general.phone}
                  </a>
                  <a 
                    href={`mailto:${settings.general.email}`}
                    className="flex items-center gap-2 text-sm md:text-base text-muted-foreground hover:text-secondary transition-colors break-all"
                  >
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    {settings.general.email}
                  </a>
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
