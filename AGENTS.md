# AGENTS.md

## Rules

- Install `src/lib/domGuard.ts` before React mounts (`src/main.tsx`): third-party or in-page DOM edits can detach a node React still owns, and React's cleanup then throws `NotFoundError: removeChild`, blanking the page.
- Keep `src/components/ErrorBoundary.tsx` above `<App />` so an unexpected render failure shows the recovery card instead of an empty screen; it auto-reloads once per session for detached-node errors only, so a genuine failure can never loop.
- Verify homepage changes with Playwright at 390/768/1024/1280 and read `/tmp/observability/build-errors.log` before reporting work complete.
