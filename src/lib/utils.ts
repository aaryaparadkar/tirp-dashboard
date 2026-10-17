/**
 * Single class-merging entry point for application code.
 *
 * The `cn` package is the design system's class engine (clsx + tailwind-merge
 * in one, and what the shadcn registry components import). Re-exporting it here
 * means app code has one obvious import path and one implementation.
 */
export { cn } from "cn"
