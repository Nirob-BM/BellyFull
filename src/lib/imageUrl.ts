/**
 * Sanitizes an image URL stored in the database.
 * Some legacy entries use Vite source paths (e.g. "/src/assets/foo.jpg")
 * which don't resolve at runtime. Treat those as missing so callers
 * can fall back to a bundled asset.
 */
export function sanitizeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/src/")) return null;
  return trimmed;
}

/** Resolve to a usable src, preferring the DB url, otherwise the fallback. */
export function resolveImageUrl(
  url: string | null | undefined,
  fallback: string
): string {
  return sanitizeImageUrl(url) ?? fallback;
}
