---
name: mobile-responsive-design
description: Professional mobile-first UI design system, touch ergonomics, spacing standards, and responsive layout guidelines for modern web applications. Prevents button overlapping, text clipping, and crowded interfaces on mobile devices.
---

# Mobile-First Responsive Design System

A rigorous design skill for crafting modern, elegant, and touch-optimized interfaces on mobile viewports (< 640px) while scaling cleanly to tablets and desktops.

## Core Design Principles

### 1. Touch Targets & Ergonomic Spacing
- **Minimum Tap Target:** Interactive elements (buttons, inputs, icons) must have a minimum touch target of `44x44px` or `48x48px` on mobile.
- **Inter-Button Gap:** Never place clickable buttons flush against each other. Maintain at least `8px` (`gap-2`) or `12px` (`gap-3`) of breathing room to eliminate mis-taps.
- **Hit Area Cushioning:** Use `p-2` or `p-2.5` padding around small icons (e.g. Volume, Mic, Close, Bookmark) so they remain easily clickable with thumbs.

### 2. Elimination of Horizontal Button Collisions
- **No Rigid Single-Row Flex Containers:** Avoid `flex items-center` with multiple text-heavy buttons on mobile without `flex-wrap`.
- **Responsive Stacking Pattern:** Always use `flex flex-col sm:flex-row` or `flex flex-wrap items-center gap-2` for action toolbars.
- **Button Groups on Mobile:** Split action buttons into full-width grid layouts on small screens: `grid grid-cols-1 xs:grid-cols-2 sm:flex sm:items-center gap-2`.

### 3. Input Fields with Action Buttons
- **Right Padding Compensation:** If placing buttons inside an input (e.g. Search/Voice/Submit), the input must have sufficient padding (`pr-36` or `pr-40`) to prevent typed text from sliding beneath the buttons.
- **Mobile Split Layout:** On extra small screens (< 400px), place secondary controls (e.g. Language switch, AI engine badges) on their own line above the input, keeping the input clean and uncluttered.

### 4. Typography & Word Wrapping
- **Word Wrap & Breakage:** Use `break-words` and `hyphens-auto` for long foreign vocabulary or Uzbek definitions to prevent them from pushing adjacent badges out of the viewport.
- **Responsive Font Scale:**
  - Page Titles: `text-2xl sm:text-3xl lg:text-4xl`
  - Word Card Titles: `text-xl sm:text-2xl`
  - Body Text: `text-sm sm:text-base`
  - Metadata / Pills: `text-[11px] sm:text-xs`

### 5. Mobile Bottom Navigation
- On screens `< 640px`, horizontal headers with more than 3 text links become squashed and illegible.
- Modern mobile web apps use a **Mobile Bottom Navigation Bar** (`fixed bottom-0 left-0 right-0 z-40 bg-paper/95 backdrop-blur-md border-t border-border`) with 4-5 icon + label items, providing thumb-friendly navigation like native iOS/Android apps.
- The top header remains clean, showing only the Brand, Theme Toggle, and primary action.

### 6. Card & Dialog Padding
- Mobile padding should be compact but breathable: `p-4 sm:p-6`.
- Dialogs must use `max-h-[90vh] overflow-y-auto` and `w-[94vw] sm:max-w-lg` to prevent modal content from clipping off the top or bottom of mobile viewports.
