import { useEffect, useState } from "react";
import { registerPWA } from "@/pwa/registerSW";
import { Button } from "@/components/ui/button";
import { RefreshCw, X } from "lucide-react";

const PWAUpdatePrompt = () => {
  const [updateFn, setUpdateFn] = useState<((reload?: boolean) => Promise<void>) | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    registerPWA((updateSW) => {
      setUpdateFn(() => updateSW);
    });
  }, []);

  if (!updateFn) return null;

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      await updateFn(true);
    } catch {
      setUpdating(false);
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-md"
    >
      <div className="rounded-xl border border-secondary/30 bg-primary text-primary-foreground shadow-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center shrink-0">
          <RefreshCw className="h-5 w-5 text-secondary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">Update available</p>
          <p className="text-xs text-primary-foreground/70">
            A new version of Belly Full is ready.
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleUpdate}
          disabled={updating}
          className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold"
        >
          {updating ? "Updating…" : "Reload"}
        </Button>
        <button
          aria-label="Dismiss update"
          onClick={() => setUpdateFn(null)}
          className="text-primary-foreground/60 hover:text-primary-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default PWAUpdatePrompt;
