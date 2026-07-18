import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Download,
  Smartphone,
  QrCode,
  Info,
  Share,
  Plus,
  MoreVertical,
  Check,
  Copy,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  BeforeInstallPromptEvent,
  detectPlatform,
  getCachedInstallEvent,
  isStandalone,
  markInstalled,
  Platform,
  subscribeInstallEvent,
  wasInstalled,
} from "@/pwa/installPrompt";

interface AppDownloadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AppDownloadModal = ({ open, onOpenChange }: AppDownloadModalProps) => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(
    () => getCachedInstallEvent(),
  );
  const [isInstalled, setIsInstalled] = useState<boolean>(
    () => isStandalone() || wasInstalled(),
  );
  const [platform, setPlatform] = useState<Platform>("unknown");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  const siteUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://bellyfull.lovable.app";

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    siteUrl,
  )}&bgcolor=ffffff&color=0d3b3a&margin=10`;

  useEffect(() => {
    return subscribeInstallEvent((e) => {
      if (!e) {
        setIsInstalled(true);
        setInstallPrompt(null);
      } else {
        setInstallPrompt(e);
      }
    });
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
        markInstalled();
        try {
          localStorage.setItem("bf-install-completed", "1");
        } catch {
          /* ignore */
        }
      }
    } catch {
      /* ignore */
    }
    setInstallPrompt(null);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(siteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Belly Full",
          text: "Order from Belly Full — Kishoreganj's multicuisine restaurant",
          url: siteUrl,
        });
      } catch {
        /* ignore */
      }
    } else {
      copyLink();
    }
  };

  const installAvailable = !!installPrompt && !isInstalled;
  const isMobilePlatform = platform === "ios" || platform === "android";

  // Per-platform manual instructions when the native prompt isn't available.
  const manualHint = useMemo(() => {
    switch (platform) {
      case "ios":
        return {
          title: "Install on iPhone / iPad",
          steps: [
            <>Tap the <Share className="inline h-4 w-4 mx-1 text-secondary" aria-label="Share" /> Share button in Safari</>,
            <>Scroll and tap <span className="font-semibold">"Add to Home Screen"</span> <Plus className="inline h-4 w-4 mx-1 text-secondary" aria-hidden /></>,
            <>Tap <span className="font-semibold">Add</span> in the top-right corner</>,
          ],
        };
      case "android":
        return {
          title: "Install on Android",
          steps: [
            <>Tap the <MoreVertical className="inline h-4 w-4 mx-1 text-secondary" aria-hidden /> menu in Chrome</>,
            <>Tap <span className="font-semibold">"Install app"</span> or <span className="font-semibold">"Add to Home screen"</span></>,
            <>Confirm to add Belly Full to your home screen</>,
          ],
        };
      case "desktop-safari":
        return {
          title: "Install on Mac (Safari)",
          steps: [
            <>Open the <span className="font-semibold">File</span> menu in Safari</>,
            <>Choose <span className="font-semibold">"Add to Dock…"</span></>,
            <>Click <span className="font-semibold">Add</span></>,
          ],
        };
      case "desktop-firefox":
        return {
          title: "Firefox doesn't support app install",
          steps: [
            <>Scan the QR code with your phone to install on mobile</>,
            <>Or open this site in <span className="font-semibold">Chrome</span> or <span className="font-semibold">Edge</span> to install on desktop</>,
          ],
        };
      case "desktop-chromium":
        return {
          title: "Install on Desktop",
          steps: [
            <>Look for the <Download className="inline h-4 w-4 mx-1 text-secondary" aria-hidden /> install icon in the address bar</>,
            <>Or open the browser menu and choose <span className="font-semibold">"Install Belly Full…"</span></>,
          ],
        };
      case "in-app":
        return {
          title: "Open in your browser",
          steps: [
            <>Tap the menu (⋯) and choose <span className="font-semibold">"Open in browser"</span></>,
            <>Then return here and tap Install</>,
          ],
        };
      default:
        return {
          title: "Add to your device",
          steps: [
            <>Open this site in Chrome, Edge, or Safari</>,
            <>Use the browser menu to add Belly Full to your device</>,
          ],
        };
    }
  }, [platform]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-primary text-primary-foreground border-secondary/30 p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="p-5 sm:p-8">
          <DialogHeader className="text-center space-y-2">
            <div className="mx-auto w-14 h-14 rounded-full bg-secondary/20 flex items-center justify-center mb-2">
              <Smartphone className="h-7 w-7 text-secondary" />
            </div>
            <DialogTitle className="font-display text-2xl sm:text-3xl text-primary-foreground">
              {isInstalled ? "You're All Set!" : "Get the Belly Full App"}
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/70 text-sm sm:text-base">
              {isInstalled
                ? "The Belly Full app is installed on your device. Enjoy ordering!"
                : "Faster ordering, one tap from your home screen."}
            </DialogDescription>
          </DialogHeader>

          {isInstalled ? (
            <div className="mt-6 rounded-xl bg-primary-foreground/5 border border-primary-foreground/10 p-6 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-secondary/20 flex items-center justify-center mb-3">
                <Check className="h-6 w-6 text-secondary" />
              </div>
              <p className="text-sm text-primary-foreground/80">
                Launch Belly Full anytime from your home screen or app drawer.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {/* Primary install action */}
              {installAvailable && (
                <div className="rounded-xl bg-secondary/10 border border-secondary/30 p-5">
                  <p className="text-xs uppercase tracking-wider text-secondary mb-2">
                    Ready to install
                  </p>
                  <p className="text-sm text-primary-foreground/80 mb-4">
                    Install Belly Full directly to this device with one tap.
                  </p>
                  <Button
                    onClick={handleInstall}
                    className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold h-11"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Install Now
                  </Button>
                </div>
              )}

              {/* Manual per-platform instructions */}
              {!installAvailable && (
                <div className="rounded-xl bg-primary-foreground/5 border border-primary-foreground/10 p-5">
                  <p className="text-xs uppercase tracking-wider text-primary-foreground/60 mb-1">
                    {isMobilePlatform ? "Mobile" : "Your device"}
                  </p>
                  <p className="font-semibold text-primary-foreground mb-3">
                    {manualHint.title}
                  </p>
                  <ol className="space-y-2 text-sm text-primary-foreground/80">
                    {manualHint.steps.map((step, i) => (
                      <li key={i} className="flex gap-3 items-start">
                        <span className="shrink-0 w-5 h-5 rounded-full bg-secondary/20 text-secondary text-xs font-semibold flex items-center justify-center mt-0.5">
                          {i + 1}
                        </span>
                        <span className="leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Cross-device: QR + share/copy so any device can hand off */}
              <div className="rounded-xl bg-primary-foreground/5 border border-primary-foreground/10 p-5">
                <div className="flex items-start gap-4">
                  <div className="bg-white rounded-lg p-2 shrink-0">
                    <img
                      src={qrSrc}
                      alt="QR code to open Belly Full on another device"
                      className="w-24 h-24 sm:w-28 sm:h-28"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <QrCode className="h-4 w-4 text-secondary" />
                      <p className="text-xs uppercase tracking-wider text-primary-foreground/60">
                        Install on another device
                      </p>
                    </div>
                    <p className="text-sm text-primary-foreground/80 mb-3">
                      Scan with your phone camera, or send yourself the link.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={shareLink}
                        className="bg-transparent border-secondary/40 text-primary-foreground hover:bg-secondary/10 hover:text-primary-foreground"
                      >
                        <Share className="h-3.5 w-3.5 mr-1.5" />
                        Share
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={copyLink}
                        className="bg-transparent border-secondary/40 text-primary-foreground hover:bg-secondary/10 hover:text-primary-foreground"
                      >
                        {copied ? (
                          <>
                            <Check className="h-3.5 w-3.5 mr-1.5" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5 mr-1.5" />
                            Copy link
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {platform === "desktop-firefox" && (
                <div className="flex items-start gap-2 text-xs text-primary-foreground/60">
                  <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>
                    Firefox on desktop doesn't support installing web apps. Use Chrome,
                    Edge, or Safari, or install on your phone via QR.
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => onOpenChange(false)}
              className="text-sm text-primary-foreground/60 hover:text-secondary transition-colors underline-offset-4 hover:underline"
            >
              {isInstalled ? "Close" : "Maybe Later"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AppDownloadModal;
