import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Clock, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useOpeningStatus, formatRange } from "@/hooks/useOpeningStatus";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const Hours = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { settings } = useSiteSettings();
  const { hours, isLoading, isOpen, todayIndex, nextOpeningLabel, closingLabel } =
    useOpeningStatus();

  return (
    <section id="hours" className="py-16 md:py-24 bg-muted/40" ref={ref}>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-10 md:mb-14"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-secondary/20 text-secondary-foreground text-sm font-medium mb-4">
            Opening Hours
          </span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            When We're <span className="text-secondary">Serving</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg">
            Online orders are accepted only while the kitchen is open, so everything reaches
            you fresh.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="max-w-3xl mx-auto bg-card border border-border rounded-2xl shadow-elegant overflow-hidden"
        >
          {/* Live status */}
          <div className="p-5 sm:p-6 border-b border-border flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <span
              className={`inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full text-sm font-semibold ${
                isOpen
                  ? "bg-primary/15 text-primary"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isOpen ? "bg-primary animate-pulse" : "bg-destructive"
                }`}
                aria-hidden="true"
              />
              {isLoading ? "Checking…" : isOpen ? "Open now" : "Closed now"}
            </span>
            <p className="text-sm sm:text-base text-muted-foreground">
              {isLoading
                ? "Loading today's hours…"
                : isOpen
                  ? closingLabel || "Ordering is open."
                  : nextOpeningLabel || "Check back for our next service."}
            </p>
            <div className="sm:ml-auto flex gap-2">
              <Button asChild size="sm" variant={isOpen ? "default" : "outline"}>
                <Link to="/menu">{isOpen ? "Order now" : "View menu"}</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <a href={`tel:${settings.general.phone}`} aria-label="Call the restaurant">
                  <Phone className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          {/* Weekly table */}
          <ul className="divide-y divide-border">
            {isLoading && (
              <li className="p-5 text-muted-foreground text-sm">Loading hours…</li>
            )}
            {!isLoading && hours.length === 0 && (
              <li className="p-5 text-muted-foreground text-sm">
                Hours will be published shortly — call {settings.general.phone} to check.
              </li>
            )}
            {hours.map((h) => {
              const isToday = h.day_of_week === todayIndex;
              return (
                <li
                  key={h.day_of_week}
                  className={`flex items-center justify-between gap-4 px-5 sm:px-6 py-3 sm:py-3.5 ${
                    isToday ? "bg-secondary/10" : ""
                  }`}
                >
                  <span
                    className={`flex items-center gap-2 text-sm sm:text-base ${
                      isToday ? "font-semibold text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {isToday && (
                      <Clock className="h-4 w-4 text-secondary shrink-0" aria-hidden="true" />
                    )}
                    {h.day_name}
                    {isToday && (
                      <span className="text-xs font-medium text-secondary">Today</span>
                    )}
                  </span>
                  <span
                    className={`text-sm sm:text-base tabular-nums ${
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
            })}
          </ul>
        </motion.div>
      </div>
    </section>
  );
};

export default Hours;
