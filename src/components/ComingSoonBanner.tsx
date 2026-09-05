import { AnimatePresence, motion } from "framer-motion";
import { Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useOpeningStatus } from "@/hooks/useOpeningStatus";

/**
 * Shown whenever the kitchen is outside its serving window so customers
 * immediately know ordering is paused and when it resumes.
 */
const ComingSoonBanner = () => {
  const { isOpen, isLoading, nextOpeningLabel } = useOpeningStatus();

  const show = !isLoading && !isOpen;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35 }}
          role="status"
          className="bg-secondary/15 border-b border-secondary/40"
        >
          <div className="container py-2.5 sm:py-3 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3 text-center">
            <span className="inline-flex items-center gap-2 text-sm sm:text-base font-semibold text-foreground">
              <Clock className="h-4 w-4 text-secondary shrink-0" aria-hidden="true" />
              We're closed right now
            </span>
            <span className="text-xs sm:text-sm text-muted-foreground">
              {nextOpeningLabel
                ? `${nextOpeningLabel} — ordering opens then.`
                : "Ordering reopens with our next service."}{" "}
              <Link
                to="/menu"
                className="underline underline-offset-4 font-medium text-foreground hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded"
              >
                Browse the menu
              </Link>{" "}
              in the meantime.
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ComingSoonBanner;
