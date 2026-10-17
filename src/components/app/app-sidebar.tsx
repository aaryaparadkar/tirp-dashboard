import { Link, useRouterState } from "@tanstack/react-router"

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
import { APP_NAME, APP_TAGLINE, NAV_SECTIONS } from "@/lib/navigation"

import { BrandMark } from "./brand-mark"

export function AppSidebar() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const { state } = useSidebar()
  const collapsed = state === "collapsed"

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
        <div className="text-muted-foreground flex items-center gap-2 rounded-md px-2 py-1.5 text-xs group-data-[collapsible=icon]:hidden">
          <span
            aria-hidden="true"
            className="bg-warning size-1.5 shrink-0 rounded-full"
          />
          <span>Development snapshot · fixture data</span>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
