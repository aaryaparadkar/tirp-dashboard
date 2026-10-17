import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

/** A labelled group of examples within a showcase section. */
export function Specimen({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="text-muted-foreground text-xs font-medium">{label}</span>
      <div className={cn("flex flex-wrap items-center gap-3", className)}>
        {children}
      </div>
    </div>
  )
}

/** A colour tile that renders its own foreground for contrast checking. */
export function Swatch({
  name,
  className,
}: {
  name: string
  className: string
}) {
  return (
    <div
      className={cn(
        "flex h-16 flex-col justify-end rounded-lg border p-2",
        className,
      )}
    >
      <span className="text-[0.7rem] leading-tight font-medium">{name}</span>
    </div>
  )
}
