---
description: Styling and UI Component Guidelines
---

# Styling and UI Agent Skill

This project uses TailwindCSS alongside `class-variance-authority` (cva), `clsx`, and `tailwind-merge` to build robust components, mostly similar to Shadcn UI.

## Golden Rules
1. **Utility-First**: Use Tailwind classes for all styling. Do not write custom CSS unless absolutely necessary (e.g., specific animations not covered by Tailwind).
2. **Merging Classes**: Always use the `cn` utility function when composing components to allow overriding classes.
```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```
3. **Variants**: Use `cva` for components with distinct visual states (e.g., buttons, badges, alert boxes).
4. **Responsive UI**: The UI must be mobile-friendly and scale to desktop. Use standard Tailwind breakpoints (`sm:`, `md:`, `lg:`, `xl:`).
5. **Theme Colors**: Stick to CSS variables if the project sets them (e.g. `bg-background`, `text-foreground`, `bg-primary`, `text-primary-foreground`) instead of hardcoded tailwind colors (like `bg-blue-500`) when building core UI components, unless explicitly designing a specific colored widget (like the Heatmap, which requires explicit red/yellow/green scales).

## The Heatmap
For the schedule heatmap, you will dynamically assign background colors based on a coverage ratio.
- `< 80% coverage`: Red scale (`bg-red-500`)
- `80% - 95% coverage`: Yellow scale (`bg-yellow-500`)
- `>= 95% coverage`: Green scale (`bg-green-500`)
