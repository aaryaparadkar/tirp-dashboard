import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { NAV_SECTIONS } from "@/lib/navigation"
import { useRouterState } from "@tanstack/react-router"

import { AppSidebar } from "./app-sidebar"
import { ThemeToggle } from "./theme-toggle"

function useCurrentSectionTitle(): string {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (item.to === "/" ? pathname === "/" : pathname.startsWith(item.to)) {
        return item.title
      }
    }
  }
  return "Not found"
}

/**
 * The application chrome: a collapsible sidebar on desktop, a sheet on mobile,
 * and a sticky top bar carrying the current location and global actions.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const sectionTitle = useCurrentSectionTitle()

  return (
    <SidebarProvider>
      <a
        href="#main-content"
        className="sr-only-focusable bg-primary text-primary-foreground fixed top-3 left-4 z-50 rounded-md px-3 py-1.5 text-sm font-medium"
      >
        Skip to main content
      </a>

      <AppSidebar />

      <SidebarInset id="main">
        <header className="bg-background/85 sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b px-3 backdrop-blur-md sm:px-4">
          <SidebarTrigger aria-label="Toggle navigation" />
          <Separator orientation="vertical" className="mr-1 h-5" />
          <span className="truncate text-sm font-medium" aria-current="page">
            {sectionTitle}
          </span>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
          </div>
        </header>

        <div
          id="main-content"
          tabIndex={-1}
          className="flex-1 px-4 py-6 outline-none sm:px-6 lg:px-8"
        >
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
