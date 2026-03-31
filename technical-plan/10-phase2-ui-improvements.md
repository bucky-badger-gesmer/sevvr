# 10 — Phase 2 UI Improvements Plan

## Frontend Audit Summary

After reviewing every screen and component in Sevvr, the botanical-tech foundation (Phase 1) is in place but the screens themselves still carry significant design debt. This plan covers the remaining gaps.

---

## Critical Issues

### 1. Auth Screens are indistinguishable from each other
Login, signup, and forgot-password are copy-pasted layouts with identical styling. They should each have a distinct visual identity.

### 2. Hardcoded colors everywhere
`#333`, `#e53e3e`, `#e94560`, `#fff` are scattered throughout components. These should use the theme palette.

### 3. No paper texture or grain
The plan specified a paper-like feel with subtle textures, but every surface is flat solid color.

### 4. Tab bar is stock navigation
The bottom tab bar uses default icons and no botanical theme.

### 5. Social screen is a monolith (441 lines)
Inline components, duplicate tab logic, and generic styling make this screen feel disconnected.

---

## Planned Improvements

### A. Auth Screen Redesign

**Login screen** — first impression, should feel like entering a refined gallery.
- Add a botanical line illustration at the top (small, delicate, not decorative overload)
- Use `ThemedText type="display"` for "sevvr" instead of `title`
- Add subtle paper texture background
- Use the new theme input styling (borderColor: theme.border, borderRadius: borderRadius.lg)
- Button: use theme.tint with white text, borderRadius: borderRadius.lg
- Error: use theme.error instead of #e53e3e

**Signup screen** — same gallery feel but with additional visual weight.
- Same botanical accent
- Distinguish with "Create Account" in display font
- Progress dots or step indicator could add intentionality (future)

**Forgot-password screen** — comforting, not alarming.
- Use warmer tones
- Add a small botanical icon (leaf or seed)
- Softer button styling

### B. Home Screen (index.tsx)

**Current**: Centered layout, dismiss banner uses hardcoded rgba(229, 62, 62, 0.15)

**Improvements**:
- Offset the Sever button to be slightly above center (asymmetric)
- Use `ThemedText type="caption"` for the daily stat with monospace font
- Dismiss banner: use theme.error background, not hardcoded
- Add subtle paper grain overlay using a View with `opacity: 0.02` and a very small repeating gradient
- "Session Active" state: use the botanical leaf icon instead of generic text
- Streak container: add subtle separator with botanical motif

### C. Stats Screen

**Current**: Clean but visually flat.

**Improvements**:
- Calendar heatmap already updated (Phase 1)
- Section headers: use `ThemedText type="heading"` with a subtle botanical underline
- Session list items: add a small botanical icon on each row (seed for short, leaf for medium, flower for long)
- Empty state: botanical illustration (seed waiting to grow)
- Stats header: add a small vine-like line decoration

### D. Social Screen (major refactor)

**Current**: 441 lines, inline components, generic styling.

**Improvements**:
- Extract `TabButton` into its own component (or use the shared pattern)
- Tab bar: use botanical-inspired active state (terracotta background with slight shadow, not flat)
- Friends avatar: use theme-aware colors instead of `#333`
- Leaderboard: medal emojis → botanical motifs (first = bloom, second = full leaf, third = sprout)
- Search input: add a search icon prefix, use theme border
- Challenge buttons: use theme.tint for primary, theme.border for outline
- Empty states: botanical illustrations for each tab
- Add subtle divider lines between sections with botanical flourish at center

### E. Profile Screen

**Current**: Minimal, centered, generic.

**Improvements**:
- Add a large botanical avatar placeholder (initials on a leaf-colored circle)
- Username: use `ThemedText type="heading"` with monospace handle
- Stat grid: add subtle elevation with shadows, use the new theme shadows
- "Log Out" button: use theme.border styling
- "Delete Account": use theme.error for both border and text (already correct concept, just use theme tokens)
- Add subtle botanical divider between profile header and stats

### F. Modals

**Life Unlocked modal** — the celebration moment. Currently unknown but should be a botanical burst.
- Large animated bloom
- Session duration in monospace display font
- Confetti replacement: delicate botanical petals or leaves drifting down

**Challenge Result modal** — already somewhat themed but could use:
- Win/lose botanical icon (bloom for win, wilted leaf for lose)
- Theme-consistent colors

**Challenge Invite modal** — simple, but needs:
- Botanical accent
- Theme-consistent button styling

### G. Tab Bar Redesign

**Current**: Default icons (bolt, chart, people, person)

**Improvements**:
- Replace Material icons with botanical-inspired custom icons or SF Symbols
- Sever tab: small leaf/seed icon
- Stats tab: growth line icon
- Social tab: branch icon
- Profile tab: seed pod icon
- Tab bar background: use theme.surface instead of theme.background for subtle differentiation
- Active tab: add a small dot or underline in theme.tint
- Add a thin border-top on tab bar using theme.border

### H. Paper Texture & Grain Overlay

Add a global grain overlay:
- Create a `PaperTexture` component that applies a very subtle noise pattern
- Use it in root layout and modal layouts
- Opacity: 0.02-0.03 (imperceptible but adds warmth)
- Web: CSS noise texture
- Native: pre-generated tiny noise image or gradient mesh

### I. Countdown Overlay

**Current**: Hardcoded `#e94560` color

**Improvements**:
- Use theme.tint for the countdown number
- Add botanical border around the countdown
- Background: use theme.surface with slight blur
- Cancel button: use theme.muted color
- Lock icon or botanical icon instead of just numbers

### J. Loading & Empty States

**All screens**: Generic or missing empty states.

**Improvements**:
- Create reusable `BotanicalEmptyState` component
- Props: icon, title, subtitle
- Different botanical icons for each context:
  - No sessions: seed (waiting to grow)
  - No friends: branch (waiting to connect)
  - No challenges: leaf (ready to compete)
- Use `ThemedText type="heading"` for title, `body` for subtitle
- Center-aligned with generous vertical spacing

---

## Implementation Order

### Round 1: Foundations
1. Add PaperTexture component to root and modal layouts
2. Update Tab bar with botanical icons and styling
3. Fix all hardcoded colors to use theme tokens

### Round 2: Auth Screens
1. Redesign login screen with botanical illustration
2. Update signup screen styling
3. Update forgot-password screen styling

### Round 3: Core Screens
1. Refactor home screen with asymmetric layout and theme tokens
2. Redesign profile screen with botanical avatar and refined typography
3. Create BotanicalEmptyState component and add to all screens

### Round 4: Social Screen
1. Extract TabButton component
2. Refactor social screen with theme-consistent styling
3. Add botanical leader/motif replacements

### Round 5: Modals
1. Redesign countdown overlay
2. Enhance life-unlocked modal
3. Polish challenge modals

### Round 6: Polish
1. Add subtle animations to auth screens
2. Add entrance animations to modals
3. Add botanical dividers and decorative elements
4. Run accessibility audit
