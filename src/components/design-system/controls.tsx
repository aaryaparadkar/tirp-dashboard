import {
  BellIcon,
  ChevronDownIcon,
  MailIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react"

import { PageSection, StatusBadge, type StatusTone } from "@/components/app"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Toggle } from "@/components/ui/toggle"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import { Specimen } from "./specimen"

const BUTTON_VARIANTS = [
  "default",
  "secondary",
  "outline",
  "ghost",
  "destructive",
  "link",
] as const

const STATUS_TONES: { tone: StatusTone; label: string }[] = [
  { tone: "neutral", label: "Idle" },
  { tone: "primary", label: "Active" },
  { tone: "success", label: "Resolved" },
  { tone: "info", label: "In progress" },
  { tone: "warning", label: "Needs review" },
  { tone: "danger", label: "Failed" },
]

export function ControlsSection() {
  return (
    <>
      <PageSection
        id="buttons"
        title="Buttons"
        description="One primary action per view. Variants carry intent; sizes carry
          density. Icons sit beside labels and never replace them without an
          accessible name."
      >
        <div className="flex flex-col gap-6">
          <Specimen label="Variants">
            {BUTTON_VARIANTS.map((variant) => (
              <Button key={variant} variant={variant}>
                {variant === "default" ? "Send reply" : variant}
              </Button>
            ))}
          </Specimen>

          <Specimen label="Sizes">
            <Button size="xs">Extra small</Button>
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon" aria-label="Add conversation">
              <PlusIcon />
            </Button>
          </Specimen>

          <Specimen label="With icons and state">
            <Button>
              <PlusIcon data-icon="inline-start" />
              New
            </Button>
            <Button variant="outline">
              <MailIcon data-icon="inline-start" />
              Message
            </Button>
            <Button variant="outline">
              <BellIcon data-icon="inline-end" />
              Notify
            </Button>
            <Button disabled>
              <Spinner />
              Sending
            </Button>
            <Button variant="destructive">
              <Trash2Icon data-icon="inline-start" />
              Delete
            </Button>
          </Specimen>

          <Specimen label="Loading and pending">
            <Button disabled>
              <Spinner data-icon="inline-start" />
              Saving
            </Button>
            <Button variant="secondary" disabled>
              <Spinner data-icon="inline-start" />
              Loading conversations
            </Button>
          </Specimen>
        </div>
      </PageSection>

      <PageSection
        id="badges"
        title="Badges and status"
        description="Status is always paired with a text label, so it never depends on
          colour alone."
      >
        <div className="flex flex-col gap-6">
          <Specimen label="Badge variants">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="ghost">Ghost</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </Specimen>

          <Specimen label="Conversation status">
            {STATUS_TONES.map((item) => (
              <StatusBadge key={item.tone} tone={item.tone}>
                {item.label}
              </StatusBadge>
            ))}
          </Specimen>
        </div>
      </PageSection>

      <PageSection
        id="forms"
        title="Forms"
        description="Heads-up labels, helper text, and inline errors. Validation is
          announced to assistive tech via aria-invalid and FieldError."
      >
        <div className="grid gap-8 lg:grid-cols-2">
          <FieldSet>
            <FieldLegend>Contact</FieldLegend>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="ds-name">Name</FieldLabel>
                <Input id="ds-name" placeholder="Aisha Khan" />
              </Field>
              <Field>
                <FieldLabel htmlFor="ds-email">Email</FieldLabel>
                <Input
                  id="ds-email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
                <FieldDescription>
                  Used only to send review summaries.
                </FieldDescription>
              </Field>
              <Field data-invalid>
                <FieldLabel htmlFor="ds-phone">WhatsApp number</FieldLabel>
                <Input
                  id="ds-phone"
                  aria-invalid
                  defaultValue="0400 000"
                  placeholder="+61400000000"
                />
                <FieldError>
                  Enter the number in E.164 format, like +61400000000.
                </FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="ds-note">Internal note</FieldLabel>
                <Textarea
                  id="ds-note"
                  placeholder="Add context for the team…"
                  rows={3}
                />
              </Field>
            </FieldGroup>
          </FieldSet>

          <div className="flex flex-col gap-8">
            <Specimen label="Search input group" className="block w-full">
              <InputGroup className="max-w-sm">
                <InputGroupAddon>
                  <SearchIcon />
                </InputGroupAddon>
                <InputGroupInput placeholder="Search conversations" />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Submit search"
                  >
                    <SearchIcon />
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </Specimen>

            <Specimen label="Select" className="block w-full">
              <Select defaultValue="all">
                <SelectTrigger className="w-56" aria-label="Filter by intent">
                  <SelectValue placeholder="Filter by intent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Intent</SelectLabel>
                    <SelectItem value="all">All intents</SelectItem>
                    <SelectItem value="oshc">OSHC cover</SelectItem>
                    <SelectItem value="claims">Claims</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Specimen>

            <Specimen label="Toggle group" className="block w-full">
              <ToggleGroup
                type="single"
                defaultValue="all"
                aria-label="Time range"
              >
                <ToggleGroupItem value="today">Today</ToggleGroupItem>
                <ToggleGroupItem value="week">7 days</ToggleGroupItem>
                <ToggleGroupItem value="all">All</ToggleGroupItem>
              </ToggleGroup>
            </Specimen>

            <div className="flex flex-col gap-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <Label htmlFor="ds-alerts">Live updates</Label>
                  <p className="text-muted-foreground text-xs">
                    Refresh the list as new messages arrive.
                  </p>
                </div>
                <Switch id="ds-alerts" defaultChecked />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox id="ds-mask" defaultChecked />
                <Label htmlFor="ds-mask" className="font-normal">
                  Mask phone numbers in the list
                </Label>
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-muted-foreground text-xs font-medium">
                  Default detail view
                </span>
                <RadioGroup defaultValue="timeline" className="gap-3">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="timeline" id="ds-timeline" />
                    <Label htmlFor="ds-timeline" className="font-normal">
                      Timeline
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="json" id="ds-json" />
                    <Label htmlFor="ds-json" className="font-normal">
                      Raw payload
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex items-center gap-2">
                <Toggle aria-label="Toggle bold">
                  <ChevronDownIcon />
                </Toggle>
                <Separator orientation="vertical" className="h-6" />
                <span className="text-muted-foreground text-xs">
                  Standalone toggle
                </span>
              </div>
            </div>
          </div>
        </div>
      </PageSection>
    </>
  )
}
