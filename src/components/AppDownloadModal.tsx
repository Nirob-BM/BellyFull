import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Smartphone, QrCode } from "lucide-react";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface AppDownloadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AppDownloadModal = ({ open, onOpenChange }: AppDownloadModalProps) => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "https://bellyfull.lovable.app";
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(siteUrl)}&bgcolor=ffffff&color=0d3b3a&margin=10`;

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
      onOpenChange(false);
    } else {
      // Fallback: instructions
      alert("To install: open your browser menu and tap 'Add to Home Screen'.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-primary text-primary-foreground border-secondary/30 p-0 overflow-hidden">
        <div className="p-6 sm:p-8">
          <DialogHeader className="text-center space-y-2">
            <div className="mx-auto w-14 h-14 rounded-full bg-secondary/20 flex items-center justify-center mb-2">
              <Smartphone className="h-7 w-7 text-secondary" />
            </div>
            <DialogTitle className="font-display text-2xl sm:text-3xl text-primary-foreground">
              Get the Belly Full App
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/70 text-sm sm:text-base">
              Enjoy a faster, seamless ordering experience right from your phone.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 grid sm:grid-cols-2 gap-4">
            {/* Mobile */}
            <div className="rounded-xl bg-primary-foreground/5 border border-primary-foreground/10 p-5 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center mb-3">
                <Download className="h-5 w-5 text-secondary" />
              </div>
              <p className="text-xs uppercase tracking-wider text-primary-foreground/60 mb-1">Mobile</p>
              <p className="text-sm text-primary-foreground/80 mb-4">Install directly to your home screen</p>
              <Button
                onClick={handleInstall}
                className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold"
              >
                Install Now
              </Button>
            </div>

            {/* Desktop */}
            <div className="rounded-xl bg-primary-foreground/5 border border-primary-foreground/10 p-5 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center mb-3">
                <QrCode className="h-5 w-5 text-secondary" />
              </div>
              <p className="text-xs uppercase tracking-wider text-primary-foreground/60 mb-1">Desktop</p>
              <div className="bg-white rounded-lg p-2 my-2">
                <img src={qrSrc} alt="QR code to install Belly Full" className="w-28 h-28" loading="lazy" />
              </div>
              <p className="text-sm text-primary-foreground/80">Scan to install on your device</p>
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
