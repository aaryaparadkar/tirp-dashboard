import {
  MessagesSquareIcon,
  LayoutDashboard,
  Palette,
  type LucideIcon,
  ZapIcon,
} from "lucide-react"

/**
 * Application navigation. Routes are added here as pages ship so the sidebar
 * never links to a page that does not exist yet.
 */
export type AppPath = "/" | "/conversations" | "/triggers" | "/design-system"

export interface NavItem {
  title: string
  to: AppPath
  icon: LucideIcon
  /** Short description used by search and tooltips. */
  description?: string
}

export interface NavSection {
  label: string
  items: NavItem[]
}

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Monitor",
    items: [
      {
        title: "Overview",
        to: "/",
        icon: LayoutDashboard,
        description:
          "Enquiry volume, intent mix, and activity while it happens.",
      },
      {
        title: "Conversations",
        to: "/conversations",
        icon: MessagesSquareIcon,
        description: "Follow live chats, read the thread, and draft replies.",
      },
      {
        title: "Triggers",
        to: "/triggers",
        icon: ZapIcon,
        description: "Launch catalogue, quiz, and escalation flows.",
      },
    ],
  },
  {
    label: "Foundations",
    items: [
      {
        title: "Design system",
        to: "/design-system",
        icon: Palette,
        description: "Tokens, components, and patterns.",
      },
    ],
  },
]

export const APP_NAME = "TIRP"
export const APP_TAGLINE = "Conversations console"
