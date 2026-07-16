import { useEffect, useState } from "react";
import { Download, X, Share, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BeforeInstallPromptEvent,
  getCachedInstallEvent,
  isInAppBrowser,
  isIosDevice,
  isStandalone,
  markInstalled,
  subscribeInstallEvent,
} from "@/pwa/installPrompt";

const DISMISS_KEY = "bf-install-dismissed-at";
const INSTALLED_KEY = "bf-install-completed";
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const SHOW_DELAY_MS = 6000;

function recentlyDismissed(): boolean {
  try {
    if (localStorage.getItem(INSTALLED_KEY) === "1") return true;
    const v = localStorage.getItem(DISMISS_KEY);
    if (!v) return false;
    const ts = Number(v);
    if (!Number.isFinite(ts)) return false;
    return Date.now() - ts < DISMISS_COOLDOWN_MS;
  } catch {
    return false;
  }
}

const InstallBanner = () => {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone()) return;
    if (isInAppBrowser()) return;
    if (recentlyDismissed()) return;

    let showTimer: number | undefined;
    let iosTimer: number | undefined;

    // Pick up an event that arrived before React mounted.
    const cached = getCachedInstallEvent();
    if (cached) {
      setInstallEvent(cached);
      showTimer = window.setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    }

    const unsub = subscribeInstallEvent((e) => {
      if (!e) {
        // appinstalled fired
        try {
          localStorage.setItem(INSTALLED_KEY, "1");
        } catch {
          /* ignore */
        }
        setInstallEvent(null);
        setVisible(false);
        return;
      }
      setInstallEvent(e);
      if (showTimer === undefined) {
        showTimer = window.setTimeout(() => setVisible(true), SHOW_DELAY_MS);
      }
    });

    // iOS (any browser — iOS 16.4+ supports A2HS from Chrome/Firefox too).
    // Show manual hint since beforeinstallprompt never fires on iOS.
    if (isIosDevice()) {
      iosTimer = window.setTimeout(() => {
        setIosHint(true);
        setVisible(true);
      }, SHOW_DELAY_MS);
    }

    return () => {
      unsub();
      if (showTimer !== undefined) window.clearTimeout(showTimer);
      if (iosTimer !== undefined) window.clearTimeout(iosTimer);
    };
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  const handleInstall = async () => {
    if (!installEvent) return;
    setInstalling(true);
    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      if (choice.outcome === "accepted") {
        try {
          localStorage.setItem(INSTALLED_KEY, "1");
        } catch {
          /* ignore */
        }
        markInstalled();
      }
    } catch {
      /* user gesture required or dismissed */
    } finally {
      setInstalling(false);
      setInstallEvent(null);
      setVisible(false);
    }
  };

  if (!visible) return null;
  if (!installEvent && !iosHint) return null;

  return (
    <div
      role="dialog"
      aria-label="Install Belly Full app"
      className="fixed inset-x-0 bottom-0 z-[90] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4 sm:pb-4 pointer-events-none animate-fade-up"
    >
      <div className="pointer-events-auto mx-auto max-w-xl rounded-2xl border border-secondary/30 bg-primary text-primary-foreground shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-3 p-3 sm:p-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-secondary/20 flex items-center justify-center shrink-0">
            <img
              src="/icon-192-maskable.png"
              alt=""
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg object-cover"
              loading="lazy"
            />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm sm:text-base leading-tight">
              Install Belly Full
            </p>
            {iosHint && !installEvent ? (
              <p className="text-xs sm:text-sm text-primary-foreground/70 leading-snug mt-0.5 flex items-center gap-1 flex-wrap">
                Tap
                <Share className="inline h-3.5 w-3.5 text-secondary" aria-label="Share" />
                then
                <span className="inline-flex items-center gap-0.5">
                  <Plus className="inline h-3.5 w-3.5 text-secondary" aria-hidden />
                  Add to Home Screen
                </span>
              </p>
            ) : (
              <p className="text-xs sm:text-sm text-primary-foreground/70 leading-snug mt-0.5">
                Faster ordering, one tap from your home screen.
              </p>
            )}
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {installEvent && (
              <Button
                size="sm"
                onClick={handleInstall}
                disabled={installing}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold h-9 px-3 sm:px-4"
              >
                <Download className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">
                  {installing ? "Installing…" : "Install"}
                </span>
              </Button>
            )}
            <button
              type="button"
              aria-label="Dismiss install banner"
              onClick={dismiss}
              className="w-9 h-9 rounded-md flex items-center justify-center text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallBanner;
