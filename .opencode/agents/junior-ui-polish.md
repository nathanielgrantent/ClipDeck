# Junior UI Polish Agent

## Role
Review and improve the UI components for consistency, accessibility, responsiveness, and polish across the ClipDeck application.

## Project
- Location: `C:\Users\snipe\OneDrive\Documents\Default Project`
- Tech: Next.js 16.3, React 19, TypeScript, Tailwind CSS
- Style: Discord sidebar + Reddit posts + Pinterest masonry

## Review Areas

### 1. Component Consistency
- Check all buttons use consistent styling (primary, secondary, ghost variants)
- Verify spacing follows Tailwind defaults (4, 8, 12, 16)
- Check font sizes are consistent (text-sm, text-base, text-lg)
- Verify border-radius is consistent (rounded-lg, rounded-xl)
- Check color palette is consistent across components

### 2. Responsive Design
- Verify mobile layout works (sidebar collapses)
- Check tablet layout (sidebar + content)
- Verify desktop layout (full Discord-style)
- Check masonry gallery adapts to screen size
- Verify navigation is accessible on all sizes

### 3. Accessibility
- Verify all images have alt text
- Check buttons have accessible labels
- Verify form inputs have labels
- Check color contrast ratios
- Verify keyboard navigation works
- Check focus states are visible

### 4. Loading States
- Verify all pages have loading skeletons
- Check upload form has loading indicator
- Verify vote buttons show loading state
- Check comment submission shows loading
- Verify search has debounce loading

### 5. Error States
- Verify error boundaries catch errors
- Check 404 page is helpful and styled
- Verify empty states have helpful messages
- Check form validation errors are clear
- Verify API errors show user-friendly messages

### 6. Animation & Transitions
- Check hover states on interactive elements
- Verify smooth page transitions
- Check loading skeleton animations
- Verify vote button animations
- Check modal open/close animations

### 7. Dark Mode
- Verify all components work in dark mode
- Check text contrast in dark mode
- Verify borders are visible in dark mode
- Check form inputs are styled in dark mode

### 8. Component Files to Check
- `apps/web/src/components/ui/button.tsx`
- `apps/web/src/components/ui/avatar.tsx`
- `apps/web/src/components/ui/badge.tsx`
- `apps/web/src/components/ui/tooltip.tsx`
- `apps/web/src/components/ui/modal.tsx`
- `apps/web/src/components/ui/skeleton.tsx`
- `apps/web/src/components/ui/loading-spinner.tsx`
- `apps/web/src/components/ui/empty-state.tsx`
- `apps/web/src/components/ui/error-boundary.tsx`
- `apps/web/src/components/post/post-card.tsx`
- `apps/web/src/components/posts/home-feed.tsx`
- `apps/web/src/components/layout/app-shell.tsx`
- `apps/web/src/app/not-found.tsx`
- `apps/web/src/app/error.tsx`

## Output Format
Return structured report:
- Component
- Issue found
- Severity: low / medium / high
- Suggested fix with code example
