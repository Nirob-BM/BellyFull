// Shared PWA install helpers.
// Caches the beforeinstallprompt event globally so it isn't lost when it
// fires before React mounts, and centralises standalone / environment checks.

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Listener = (e: BeforeInstallPromptEvent | null) => void;

let cachedEvent: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<Listener>();

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    cachedEvent = e as BeforeInstallPromptEvent;
    listeners.forEach((fn) => fn(cachedEvent));
  });
  window.addEventListener("appinstalled", () => {
    installed = true;
    cachedEvent = null;
    listeners.forEach((fn) => fn(null));
  });
}

export function getCachedInstallEvent(): BeforeInstallPromptEvent | null {
  return cachedEvent;
}

export function subscribeInstallEvent(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function markInstalled(): void {
  installed = true;
  cachedEvent = null;
  listeners.forEach((fn) => fn(null));
}

export function wasInstalled(): boolean {
  return installed;
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const mm = window.matchMedia;
    if (
      mm &&
      (mm("(display-mode: standalone)").matches ||
        mm("(display-mode: fullscreen)").matches ||
        mm("(display-mode: minimal-ui)").matches)
    ) {
      return true;
    }
  } catch {
    /* ignore */
  }
  // iOS Safari legacy flag
  return (window.navigator as unknown as { standalone?: boolean }).standalone === true;
}

export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  // iPadOS 13+ reports as Mac with touch
  return (
    navigator.platform === "MacIntel" &&
    typeof navigator.maxTouchPoints === "number" &&
    navigator.maxTouchPoints > 1
  );
}

// In-app browsers (Instagram, Facebook, TikTok, LinkedIn, Line, WeChat, etc.)
// cannot install PWAs and don't fire beforeinstallprompt, so we suppress UI.
export function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /(FBAN|FBAV|FB_IAB|Instagram|Line\/|MicroMessenger|TikTok|LinkedInApp|Snapchat|Twitter|Pinterest)/i.test(
    ua,
  );
}
