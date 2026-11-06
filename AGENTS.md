# AGENTS.md

## Rules

- Install `src/lib/domGuard.ts` before React mounts (`src/main.tsx`): third-party or in-page DOM edits can detach a node React still owns, and React's cleanup then throws `NotFoundError: removeChild`, blanking the page.
- Keep `src/components/ErrorBoundary.tsx` above `<App />` so an unexpected render failure shows the recovery card instead of an empty screen; it auto-reloads once per session for detached-node errors only, so a genuine failure can never loop.
- Verify homepage changes with Playwright at 390/768/1024/1280 and read `/tmp/observability/build-errors.log` before reporting work complete.
- The product popup renders through the shared `src/components/OrderDialog.tsx` (used by `src/components/Menu.tsx` and `src/pages/MenuPage.tsx`); keep it mobile-first — capped height, independently scrolling body, pinned action row — and change it there instead of duplicating markup per page.
- Admin deletes and other destructive actions use the shared `src/components/admin/ConfirmDialog.tsx` (never `window.confirm`), and admin colours come from the semantic `success/warning/info/chart-*` tokens so status colours stay consistent across pages.
- Order steps live in `orders.order_status` (database check constraint + `src/pages/admin/Orders.tsx` workflow); change both together. The Customers admin page derives customers from orders (grouped by phone) instead of a separate table, so there is no second copy to keep in sync.
