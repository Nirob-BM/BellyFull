import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Smartphone, QrCode, Info } from "lucide-react";
import { useEffect, useState } from "react";
import {
  BeforeInstallPromptEvent,
  getCachedInstallEvent,
  isStandalone,
  markInstalled,
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

  const siteUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://bellyfull.lovable.app";

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    siteUrl
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
    onOpenChange(false);
  };

  const installAvailable = !!installPrompt && !isInstalled;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-primary text-primary-foreground border-secondary/30 p-0 overflow-hidden">
        <div className="p-6 sm:p-8">
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
                : "Enjoy a faster, seamless ordering experience right from your phone."}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 grid sm:grid-cols-2 gap-4">
            {/* Mobile */}
            <div className="rounded-xl bg-primary-foreground/5 border border-primary-foreground/10 p-5 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center mb-3">
                <Download className="h-5 w-5 text-secondary" />
              </div>
              <p className="text-xs uppercase tracking-wider text-primary-foreground/60 mb-1">
                Mobile
              </p>

              {isInstalled ? (
                <>
                  <p className="text-sm text-primary-foreground/80 mb-4">
                    App is already installed
                  </p>
                  <div className="w-full py-2 rounded-md bg-secondary/20 text-secondary font-semibold text-sm">
                    Installed
                  </div>
                </>
              ) : installAvailable ? (
                <>
                  <p className="text-sm text-primary-foreground/80 mb-4">
                    Install directly to your home screen
                  </p>
                  <Button
                    onClick={handleInstall}
                    className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold"
                  >
                    Install Now
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-primary-foreground/80 mb-4">
                    Open your browser menu and tap "Add to Home Screen"
                  </p>
                  <div className="flex items-center gap-2 text-xs text-primary-foreground/50">
                    <Info className="h-3.5 w-3.5" />
                    <span>Not available on this browser</span>
                  </div>
                </>
              )}
            </div>

            {/* Desktop */}
            <div className="rounded-xl bg-primary-foreground/5 border border-primary-foreground/10 p-5 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center mb-3">
                <QrCode className="h-5 w-5 text-secondary" />
              </div>
              <p className="text-xs uppercase tracking-wider text-primary-foreground/60 mb-1">
                Desktop
              </p>
              <div className="bg-white rounded-lg p-2 my-2">
                <img
                  src={qrSrc}
                  alt="QR code to install Belly Full"
                  className="w-28 h-28"
                  loading="lazy"
                />
              </div>
              <p className="text-sm text-primary-foreground/80">
                Scan to install on your device
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => onOpenChange(false)}
              className="text-sm text-primary-foreground/60 hover:text-secondary transition-colors underline-offset-4 hover:underline"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AppDownloadModal;
