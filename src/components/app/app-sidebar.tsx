import { useState } from "react"
import { Link, useRouterState } from "@tanstack/react-router"
import { LogOutIcon } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { isMockAdapter, logoutOperator } from "@/lib/api/client"
import { OPERATOR_ROLE_LABEL } from "@/lib/api/types"
import { APP_NAME, APP_TAGLINE, NAV_SECTIONS } from "@/lib/navigation"
import { useSession } from "@/hooks/use-session"

import { BrandMark } from "./brand-mark"

export function AppSidebar() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const { state } = useSidebar()
  const collapsed = state === "collapsed"
  const mock = isMockAdapter()
  const { session } = useSession()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    if (signingOut) return
    setSigningOut(true)
    try {
      await logoutOperator()
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <Sidebar collapsible="icon" aria-label="Primary">
      <SidebarHeader>
        <Link
          to="/"
          aria-label={`${APP_NAME} home`}
          className="focus-visible:ring-sidebar-ring flex items-center gap-2.5 rounded-md px-1 py-1.5 outline-none focus-visible:ring-2"
        >
          <BrandMark />
          <span className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm leading-tight font-semibold">
              {APP_NAME}
            </span>
            <span className="text-muted-foreground truncate text-xs">
              {APP_TAGLINE}
            </span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {NAV_SECTIONS.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={
                        item.to === "/"
                          ? pathname === "/"
                          : pathname.startsWith(item.to)
                      }
                      tooltip={collapsed ? item.title : undefined}
                    >
                      <Link to={item.to}>
                        <item.icon aria-hidden="true" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        {mock ? (
          <div className="text-muted-foreground flex items-center gap-2 rounded-md px-2 py-1.5 text-xs group-data-[collapsible=icon]:hidden">
            <span
              aria-hidden="true"
              className="bg-warning size-1.5 shrink-0 rounded-full"
            />
            <span>Development snapshot · fixture data</span>
          </div>
        ) : session ? (
          <div className="flex flex-col gap-1 group-data-[collapsible=icon]:hidden">
            <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs">
              <span
                aria-hidden="true"
                className="bg-success size-1.5 shrink-0 rounded-full"
              />
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-medium">
                  {session.operator.name}
                </span>
                <span className="text-muted-foreground truncate">
                  {OPERATOR_ROLE_LABEL[session.operator.role]} · signed in
                </span>
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="min-h-11 justify-start"
              onClick={handleSignOut}
              disabled={signingOut}
            >
              {signingOut ? <Spinner /> : <LogOutIcon aria-hidden="true" />}
              Sign out
            </Button>
          </div>
        ) : null}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
