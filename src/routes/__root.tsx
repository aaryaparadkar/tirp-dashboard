import type { ReactNode } from "react"
import {
  HeadContent,
  Link,
  Scripts,
  createRootRoute,
  type ErrorComponentProps,
} from "@tanstack/react-router"
import { CompassIcon } from "lucide-react"

import { AppShell, AuthGate, EmptyState, ErrorState } from "@/components/app"
import { Toaster } from "@/components/ui/sonner"
import { Button } from "@/components/ui/button"
import { TooltipProvider } from "@/components/ui/tooltip"
import { initialiseDashboardAdapter } from "@/lib/api/client"
import { APP_NAME, APP_TAGLINE } from "@/lib/navigation"
import { THEME_INIT_SCRIPT } from "@/lib/theme"

import appCss from "@/styles.css?url"

// Install the selected dashboard adapter (fixtures or tirp-server) before any
// route reads data. Idempotent, so it is safe under HMR and SSR.
initialiseDashboardAdapter()

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      { title: `${APP_NAME} · ${APP_TAGLINE}` },
      {
        name: "description",
        content: "Watch and review WhatsApp conversations in one place.",
      },
      { name: "color-scheme", content: "light dark" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
  errorComponent: RootError,
})

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body>
        <TooltipProvider delayDuration={200}>
          <AuthGate>
            <AppShell>{children}</AppShell>
          </AuthGate>
        </TooltipProvider>
        <Toaster position="top-center" closeButton />
        <Scripts />
      </body>
    </html>
  )
}

function NotFound() {
  return (
    <EmptyState
      icon={CompassIcon}
      title="Page not found"
      description="That page does not exist, or it moved. Use the navigation to find your way back."
      action={
        <Button asChild variant="outline" size="sm">
          <Link to="/">Back to overview</Link>
        </Button>
      }
    />
  )
}

function RootError({ error, reset }: ErrorComponentProps) {
  const message =
    error instanceof Error ? error.message : "An unexpected error occurred."

  return (
    <ErrorState
      title="This page could not load"
      description={message}
      onRetry={reset}
    />
  )
}
