

## Plan: Fix Popular Dishes Carousel Arrow Buttons

### Problem
The continuous `requestAnimationFrame` auto-scroll (0.5px/frame) overrides manual `scrollBy` from the arrow buttons. When a user clicks an arrow, the auto-scroll immediately overwrites the scroll position, making arrows appear broken.

### Solution
Add a "paused" state that temporarily stops auto-scroll when arrow buttons are clicked (or when the user hovers over the carousel), then resumes after a short delay.

### Changes — `src/components/PopularItems.tsx`

1. **Add a `paused` ref** (`useRef<boolean>(false)`) to control auto-scroll
2. **Modify the auto-scroll `step` function** to skip scrolling when `paused.current` is true
3. **Update `scroll()` function** to set `paused.current = true` before scrolling, then use `setTimeout` (~2 seconds) to resume
4. **Add hover pause** — attach `onMouseEnter` / `onMouseLeave` handlers on the carousel container to pause/resume auto-scroll when hovering

### Technical Details

- Use a ref (not state) for `paused` to avoid re-renders and keep the animation frame loop stable
- Clear any existing resume timeout when a new pause event occurs (debounce)
- The timeout ref ensures cleanup on unmount

