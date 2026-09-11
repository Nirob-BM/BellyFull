## Plan: Optimize the Navigation Bar

### Goal
Make the selected header easier to scan and use across desktop, tablet, and mobile without changing Belly Full’s established visual identity.

### Changes
- Refine header height, spacing, and logo sizing for a cleaner layout at every breakpoint.
- Add a clear active state for the current page or homepage section.
- Improve keyboard focus visibility and navigation semantics.
- Replace the mobile menu control with the existing design-system button and make the opened menu feel more deliberate.
- Keep the phone and reservation actions prominent without crowding smaller desktop widths.
- Respect reduced-motion preferences and preserve smooth homepage section navigation.

### Verification
- Check the header at mobile, tablet, and desktop widths.
- Verify menu opening, closing, route navigation, section scrolling, focus states, and active indicators.
- Confirm the site still builds without errors.

### Technical Details
- Limit implementation to `src/components/Header.tsx` unless verification exposes a directly related styling issue.
- Derive active navigation state from the current route, URL hash, and visible homepage section.
- Reuse existing semantic color tokens and the shared Button component.
