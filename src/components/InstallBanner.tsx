import { useEffect, useState } from "react";
import { Download, X, Share, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "bf-install-dismissed-at";
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const SHOW_DELAY_MS = 6000;

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isAppleDevice = /iPad|iPhone|iPod/.test(ua);
  // iPadOS 13+ reports as Mac with touch
  const isIpadOs =
    navigator.platform === "MacIntel" &&
    typeof navigator.maxTouchPoints === "number" &&
    navigator.maxTouchPoints > 1;
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return (isAppleDevice || isIpadOs) && isSafari;
}

function recentlyDismissed(): boolean {
  try {
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
    if (recentlyDismissed()) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
      window.setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    };

    const onInstalled = () => {
      setVisible(false);
      setInstallEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    // iOS Safari has no beforeinstallprompt — show manual hint banner
    if (isIos()) {
      const t = window.setTimeout(() => {
        setIosHint(true);
        setVisible(true);
      }, SHOW_DELAY_MS);
      return () => {
        window.clearTimeout(t);
        window.removeEventListener("beforeinstallprompt", onBeforeInstall);
        window.removeEventListener("appinstalled", onInstalled);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
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
      await installEvent.userChoice;
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
