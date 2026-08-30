// Guarded service worker registration wrapper.
// Only registers in production on the real published origin.
// Exposes an "onNeedRefresh" callback so the UI can prompt the user to update.

type UpdateHandler = (updateSW: (reload?: boolean) => Promise<void>) => void;

const SW_PATH = "/sw.js";

function isPreviewOrDevHost(): boolean {
  if (typeof window === "undefined") return true;
  const { hostname } = window.location;
  if (window.self !== window.top) return true;
  if (hostname.startsWith("id-preview--") || hostname.startsWith("preview--")) return true;
  if (hostname === "lovableproject.com" || hostname.endsWith(".lovableproject.com")) return true;
  if (hostname === "lovableproject-dev.com" || hostname.endsWith(".lovableproject-dev.com"))
    return true;
  if (hostname === "beta.lovable.dev" || hostname.endsWith(".beta.lovable.dev")) return true;
  return false;
}

async function unregisterMatching() {
  if (!("serviceWorker" in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      regs
        .filter((r) => {
          const url = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || "";
          return url.endsWith(SW_PATH);
        })
        .map((r) => r.unregister()),
    );
  } catch {
    /* ignore */
  }
}

export async function registerPWA(onNeedRefresh: UpdateHandler) {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  const killSwitch = params.get("sw") === "off";

  if (!import.meta.env.PROD || isPreviewOrDevHost() || killSwitch) {
    await unregisterMatching();
    return;
  }

  if (!("serviceWorker" in navigator)) return;

  try {
    const { Workbox } = await import("workbox-window");
    const wb = new Workbox(SW_PATH);

    let prompted = false;
    const showPrompt = () => {
      if (prompted) return;
      prompted = true;
      const updateSW = async (reload = true) => {
        const waiting = new Promise<void>((resolve) => {
          const onControlling = () => {
            wb.removeEventListener("controlling", onControlling);
            resolve();
          };
          wb.addEventListener("controlling", onControlling);
          // Safety net: never hang the button if `controlling` never fires.
          window.setTimeout(resolve, 3000);
        });
        wb.messageSkipWaiting();
        await waiting;
        if (reload) window.location.reload();
      };
      onNeedRefresh(updateSW);
    };

    // A new SW is installed and waiting (this tab), or another tab installed it.
    wb.addEventListener("waiting", showPrompt);
    wb.addEventListener("externalwaiting" as "waiting", showPrompt);

    const registration = await wb.register();

    // If a worker was already waiting before this page loaded, prompt now.
    if (registration?.waiting && navigator.serviceWorker.controller) {
      showPrompt();
    }

    // Check for updates when the tab regains focus and once an hour.
    const checkForUpdate = () => {
      registration?.update().catch(() => {
        /* offline or transient failure */
      });
    };
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") checkForUpdate();
    });
    window.addEventListener("online", checkForUpdate);
    window.setInterval(checkForUpdate, 60 * 60 * 1000);
  } catch (err) {
    console.warn("[pwa] registration failed", err);
  }
}

