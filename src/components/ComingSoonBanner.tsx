import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Clock } from "lucide-react";
import { useOpeningStatus } from "@/hooks/useOpeningStatus";

/**
 * Shown whenever the kitchen is outside its serving window so customers
 * immediately know ordering is paused and when it resumes.
 */
const ComingSoonBanner = () => {
  const { isOpen, isLoading } = useOpeningStatus();
  const reduceMotion = useReducedMotion();

  const show = !isLoading && !isOpen;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reduceMotion ? 0 : -8 }}
          transition={{ duration: reduceMotion ? 0 : 0.25 }}
          role="status"
          className="bg-card pt-14 sm:pt-[60px]"
        >
          <div className="border-b border-secondary/30 bg-secondary/15">
            <div className="container flex flex-col items-center justify-center gap-1.5 py-3 text-center sm:flex-row sm:flex-wrap sm:gap-x-4 sm:gap-y-1.5 sm:py-3.5 lg:flex-nowrap">
              <span className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold leading-5 text-foreground">
                <Clock className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                We're closed right now
              </span>
              <span className="text-sm font-medium leading-5 text-foreground">
                <span className="hidden sm:inline">— </span>Order Next Day at 10:00 A.M.
              </span>
              <span className="text-xs leading-5 text-muted-foreground sm:text-sm">
                Browse the menu in the meantime.
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ComingSoonBanner;
