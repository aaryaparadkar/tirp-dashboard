import { useState } from "react"
import { toast } from "sonner"
import {
  CheckIcon,
  CircleAlertIcon,
  PlayIcon,
  SearchIcon,
  XIcon,
} from "lucide-react"

import { StatusBadge, type StatusTone } from "@/components/app"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DashboardApiError, runTrigger } from "@/lib/api/dashboard"
import { isMockAdapter } from "@/lib/api/client"
import {
  TRIGGER_AVAILABILITY_LABEL,
  type ConversationSummary,
  type TriggerDefinition,
  type TriggerExecution,
  type TriggerFieldKind,
} from "@/lib/api/types"
import { formatDateTime, looksLikeE164 } from "@/lib/format"
import { cn } from "@/lib/utils"

const AVAILABILITY_TONE: Record<TriggerDefinition["availability"], StatusTone> =
  {
    available: "success",
    coming_soon: "info",
    needs_config: "warning",
  }

const PLACEHOLDER: Record<TriggerFieldKind, string> = {
  phone: "+61412345620",
  text: "Plain text message…",
  conversation: "",
}

/**
 * One trigger offer. The Run button opens the run dialog; the availability
 * badge states exactly why a trigger cannot run yet.
 */
export function TriggerCard({
  trigger,
  lastExecution,
  onRun,
  className,
}: {
  trigger: TriggerDefinition
  /** Most recent execution for this trigger, if any. */
  lastExecution?: TriggerExecution
  onRun: () => void
  className?: string
}) {
  const runnable = trigger.availability === "available"

  return (
    <Card size="sm" className={cn("gap-3", className)}>
      <CardHeader>
        <CardTitle>{trigger.name}</CardTitle>
        <CardDescription>{trigger.description}</CardDescription>
      </CardHeader>
      <CardContent className="grid flex-1 gap-x-4 gap-y-2 text-xs sm:grid-cols-2">
        <Fact label="Intended use">{trigger.intendedUse}</Fact>
        <Fact label="Required inputs">
          {trigger.fields.length === 0
            ? "None"
            : trigger.fields.map((field) => field.label).join(", ")}
        </Fact>
        <Fact label="Last execution">
          {lastExecution
            ? `${formatDateTime(lastExecution.startedAt)} · ${lastExecution.status}`
            : "Never recorded"}
        </Fact>
        <Fact label="Backend dependency">{trigger.backendNote}</Fact>
        <div className="col-span-full flex flex-wrap items-center gap-2">
          <StatusBadge tone={AVAILABILITY_TONE[trigger.availability]}>
            {TRIGGER_AVAILABILITY_LABEL[trigger.availability]}
          </StatusBadge>
          {trigger.availabilityNote ? (
            <span className="text-muted-foreground text-xs">
              {trigger.availabilityNote}
            </span>
          ) : null}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          size="sm"
          disabled={!runnable}
          onClick={onRun}
          aria-describedby={`${trigger.id}-why`}
        >
          <PlayIcon aria-hidden="true" />
          {runnable ? "Run trigger…" : "Run blocked"}
        </Button>
        {!runnable ? (
          <span id={`${trigger.id}-why`} className="sr-only">
            This trigger cannot run yet:{" "}
            {trigger.availabilityNote ?? trigger.backendNote}
          </span>
        ) : null}
      </CardFooter>
    </Card>
  )
}

function Fact({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{children}</dd>
    </div>
  )
}

/** One recipient of a (possibly batched) run. */
type RunTarget =
  | { kind: "contact"; label: string; conversationId: string }
  | { kind: "number"; label: string; phone: string }

/** Outcome of the run for one recipient. */
type TargetOutcome = {
  label: string
  ok: boolean
  detail: string
}

/** Split "+61…, +61… +61…" into distinct trimmed numbers. */
function parseNumbers(raw: string): string[] {
  return [
    ...new Set(
      raw
        .split(/[\s,;]+/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ]
}

function describeError(thrown: unknown): string {
  if (thrown instanceof DashboardApiError) return thrown.message
  if (thrown instanceof Error) return thrown.message
  return "Unknown backend response."
}

/**
 * Run flow: explain → collect → validate → confirm → honest result.
 * Phone-targeted triggers accept many recipients; the run goes to each one
 * in turn (sequentially, so server rate limits apply per message) and the
 * dialog reports every recipient's outcome.
 */
export function TriggerRunDialog({
  trigger,
  openContacts,
  contacts,
  open,
  onOpenChange,
}: {
  trigger: TriggerDefinition | null
  /** Open/new conversations offered to `conversation`-targeted triggers. */
  openContacts: ConversationSummary[]
  /** Every known contact (one row per contact) offered to phone triggers. */
  contacts: ConversationSummary[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [selected, setSelected] = useState<string[]>([])
  const [manualNumbers, setManualNumbers] = useState("")
  const [validation, setValidation] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number }>({
    done: 0,
    total: 0,
  })
  const [outcomes, setOutcomes] = useState<TargetOutcome[] | null>(null)

  if (!trigger || !open) return null

  const mock = isMockAdapter()
  const phoneField = trigger.fields.find((field) => field.kind === "phone")

  function reset() {
    setValues({})
    setSelected([])
    setManualNumbers("")
    setValidation(null)
    setPending(false)
    setProgress({ done: 0, total: 0 })
    setOutcomes(null)
  }

  function collectTargets(problems: string[]): RunTarget[] {
    if (!phoneField) {
      return [
        {
          kind: "contact",
          label:
            openContacts.find((c) => c.id === values.conversation)?.contact
              .displayName ?? "Conversation",
          conversationId: values.conversation ?? "",
        },
      ]
    }
    const byId = new Map(contacts.map((c) => [c.id, c]))
    const targets: RunTarget[] = selected.map((id) => {
      const contact = byId.get(id)
      return {
        kind: "contact",
        label: contact
          ? `${contact.contact.displayName} · ${contact.contact.maskedPhone}`
          : id,
        conversationId: id,
      }
    })
    const numbers = parseNumbers(manualNumbers)
    const bad = numbers.filter((number) => !looksLikeE164(number))
    if (bad.length > 0) {
      problems.push(
        `${bad.join(", ")} ${bad.length === 1 ? "doesn't" : "don't"} look like +61412345620.`,
      )
    }
    for (const number of numbers) {
      if (!bad.includes(number)) {
        targets.push({ kind: "number", label: number, phone: number })
      }
    }
    if (phoneField.required && targets.length === 0 && bad.length === 0) {
      problems.push("Pick at least one contact or enter a number.")
    }
    return targets
  }

  async function confirmRun() {
    if (!trigger) return
    const problems: string[] = []
    for (const field of trigger.fields) {
      if (field.kind === "phone") continue
      if (field.required && (values[field.id] ?? "").trim() === "") {
        problems.push(`${field.label} is required.`)
      }
    }
    const targets = collectTargets(problems)
    if (problems.length > 0) {
      setValidation(problems.join(" "))
      return
    }
    setValidation(null)
    setPending(true)
    setProgress({ done: 0, total: targets.length })
    const results: TargetOutcome[] = []
    for (const target of targets) {
      try {
        const execution: TriggerExecution = await runTrigger(trigger.id, {
          phone: target.kind === "number" ? target.phone : "",
          message: values.message ?? "",
          // A picked contact is sent as its conversation; the server resolves
          // the real number (the console only ever sees masked phones).
          conversationId:
            target.kind === "contact" ? target.conversationId : "",
        })
        results.push({
          label: target.label,
          ok: true,
          detail:
            execution.result?.reference ??
            execution.result?.detail ??
            execution.id,
        })
      } catch (thrown) {
        results.push({
          label: target.label,
          ok: false,
          detail: describeError(thrown),
        })
      }
      setProgress({ done: results.length, total: targets.length })
      setOutcomes([...results])
    }
    setPending(false)
    const okCount = results.filter((r) => r.ok).length
    const failed = results.length - okCount
    if (failed === 0) {
      toast.success(
        results.length === 1
          ? "Trigger completed"
          : `Sent to all ${results.length} contacts`,
        { description: results.length === 1 ? results[0]?.detail : undefined },
      )
    } else if (okCount === 0) {
      toast.error("Trigger not executed", {
        description:
          results.length === 1
            ? results[0]?.detail
            : `All ${results.length} runs failed — nothing was sent.`,
      })
    } else {
      toast.warning(`${okCount} of ${results.length} sent`, {
        description: `${failed} failed — see the results in the dialog.`,
      })
    }
  }

  const formId = `trigger-run-${trigger.id}`
  const finished = outcomes !== null && !pending
  const recipientCount = selected.length + parseNumbers(manualNumbers).length

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !pending) {
          reset()
          onOpenChange(false)
        }
      }}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Run “{trigger.name}”</DialogTitle>
          <DialogDescription>
            {mock
              ? "The console is running on fixtures, so this run is refused before it can message anyone. Its inputs and validation are still exercised end to end."
              : "This trigger messages real WhatsApp contacts. Pick one or many; it runs for each, only after your confirmation."}
          </DialogDescription>
        </DialogHeader>

        <form
          id={formId}
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            void confirmRun()
          }}
        >
          {trigger.fields.map((field) =>
            field.kind === "phone" ? (
              <ContactMultiPicker
                key={field.id}
                id={`trigger-field-${field.id}`}
                field={field}
                contacts={contacts}
                selected={selected}
                onSelectedChange={setSelected}
                manualNumbers={manualNumbers}
                onManualNumbersChange={setManualNumbers}
                disabled={pending || finished}
              />
            ) : (
              <RunField
                key={field.id}
                id={`trigger-field-${field.id}`}
                field={field}
                openContacts={openContacts}
                value={values[field.id] ?? ""}
                onValueChange={(next) =>
                  setValues((previous) => ({ ...previous, [field.id]: next }))
                }
                disabled={pending || finished}
              />
            ),
          )}

          {validation ? (
            <Alert variant="destructive">
              <CircleAlertIcon aria-hidden="true" />
              <AlertTitle>Check the inputs</AlertTitle>
              <AlertDescription>{validation}</AlertDescription>
            </Alert>
          ) : null}

          {pending || outcomes ? (
            <RunResults
              outcomes={outcomes ?? []}
              done={progress.done}
              total={progress.total}
              pending={pending}
              mock={mock}
            />
          ) : null}

          <p className="text-muted-foreground text-xs">
            {mock
              ? "Blocked run: the dashboard refuses to fake an external effect. "
              : ""}
            {trigger.backendNote}
          </p>
        </form>

        <DialogFooter>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => {
              reset()
              onOpenChange(false)
            }}
          >
            {finished ? "Close" : "Cancel"}
          </Button>
          {!finished ? (
            <Button type="submit" form={formId} disabled={pending}>
              <PlayIcon aria-hidden="true" />
              {pending
                ? `Running ${progress.done}/${progress.total}…`
                : phoneField && recipientCount > 1
                  ? `Confirm and run for ${recipientCount}`
                  : "Confirm and run"}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Progress while running, then one ✓/✗ line per recipient. */
function RunResults({
  outcomes,
  done,
  total,
  pending,
  mock,
}: {
  outcomes: TargetOutcome[]
  done: number
  total: number
  pending: boolean
  mock: boolean
}) {
  const okCount = outcomes.filter((o) => o.ok).length
  const failed = outcomes.length - okCount
  const title = pending
    ? `Running… ${done} of ${total}`
    : failed === 0
      ? mock
        ? "Run recorded — nothing was sent"
        : total === 1
          ? "Run completed"
          : `Completed for all ${total}`
      : okCount === 0
        ? "Nothing was sent"
        : `${okCount} of ${total} completed, ${failed} failed`
  return (
    <Alert variant={!pending && okCount === 0 ? "destructive" : "default"}>
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex flex-col gap-2">
        {total > 1 ? (
          <Progress
            value={total === 0 ? 0 : (done / total) * 100}
            aria-label={`${done} of ${total} processed`}
          />
        ) : null}
        <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto">
          {outcomes.map((outcome, index) => (
            <li
              key={`${outcome.label}-${index}`}
              className="flex items-start gap-2 text-xs"
            >
              {outcome.ok ? (
                <CheckIcon
                  className="text-success mt-0.5 size-3.5 shrink-0"
                  aria-hidden="true"
                />
              ) : (
                <XIcon
                  className="text-destructive mt-0.5 size-3.5 shrink-0"
                  aria-hidden="true"
                />
              )}
              <span className="sr-only">
                {outcome.ok ? "Sent:" : "Failed:"}
              </span>
              <span className="min-w-0">
                <span className="text-foreground font-medium">
                  {outcome.label}
                </span>{" "}
                — <span className="break-words">{outcome.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  )
}

function RunField({
  id,
  field,
  openContacts,
  value,
  onValueChange,
  disabled,
}: {
  id: string
  field: TriggerDefinition["fields"][number]
  openContacts: ConversationSummary[]
  value: string
  onValueChange: (next: string) => void
  disabled?: boolean
}) {
  const describedBy = `${id}-hint`

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>
        {field.label}
        {field.required ? <span className="text-destructive"> *</span> : null}
      </Label>
      {field.kind === "conversation" ? (
        <Select
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          required={field.required}
        >
          <SelectTrigger
            id={id}
            className="w-full"
            aria-describedby={describedBy}
          >
            <SelectValue placeholder="Choose a conversation" />
          </SelectTrigger>
          <SelectContent>
            {openContacts.map((contact) => (
              <SelectItem key={contact.id} value={contact.id}>
                {contact.contact.displayName} · {contact.contact.maskedPhone}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={id}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          maxLength={field.maxLength}
          inputMode="text"
          aria-describedby={describedBy}
          disabled={disabled}
          placeholder={PLACEHOLDER[field.kind as TriggerFieldKind]}
        />
      )}
      {field.description ? (
        <p id={describedBy} className="text-muted-foreground text-xs">
          {field.description}
        </p>
      ) : null}
    </div>
  )
}

/**
 * Multi-select contact list for phone-targeted triggers: search, tick any
 * number of contacts (or all), and optionally add numbers that have not
 * messaged yet.
 */
function ContactMultiPicker({
  id,
  field,
  contacts,
  selected,
  onSelectedChange,
  manualNumbers,
  onManualNumbersChange,
  disabled,
}: {
  id: string
  field: TriggerDefinition["fields"][number]
  contacts: ConversationSummary[]
  selected: string[]
  onSelectedChange: (next: string[]) => void
  manualNumbers: string
  onManualNumbersChange: (next: string) => void
  disabled?: boolean
}) {
  const [query, setQuery] = useState("")
  const describedBy = `${id}-hint`
  const needle = query.trim().toLowerCase()
  const visible = needle
    ? contacts.filter((c) =>
        `${c.contact.displayName} ${c.contact.maskedPhone}`
          .toLowerCase()
          .includes(needle),
      )
    : contacts
  const selectedSet = new Set(selected)
  const allVisibleSelected =
    visible.length > 0 && visible.every((c) => selectedSet.has(c.id))

  function toggle(contactId: string, checked: boolean) {
    onSelectedChange(
      checked
        ? [...selected, contactId]
        : selected.filter((item) => item !== contactId),
    )
  }

  function toggleVisible() {
    if (allVisibleSelected) {
      const hide = new Set(visible.map((c) => c.id))
      onSelectedChange(selected.filter((item) => !hide.has(item)))
    } else {
      onSelectedChange([...new Set([...selected, ...visible.map((c) => c.id)])])
    }
  }

  return (
    <fieldset className="flex flex-col gap-2" disabled={disabled}>
      <div className="flex items-center justify-between gap-2">
        <legend className="text-sm font-medium">
          {field.label === "Contact" ? "Contacts" : field.label}
          {field.required ? <span className="text-destructive"> *</span> : null}
        </legend>
        <span className="text-muted-foreground text-xs" aria-live="polite">
          {selected.length} selected
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <SearchIcon
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            id={`${id}-search`}
            aria-label="Search contacts"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name or number"
            className="pl-8"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={toggleVisible}
          disabled={disabled || visible.length === 0}
        >
          {allVisibleSelected
            ? "Clear"
            : needle
              ? "Select shown"
              : "Select all"}
        </Button>
      </div>
      <ul
        id={id}
        aria-describedby={describedBy}
        className="border-border flex max-h-56 flex-col overflow-y-auto border"
      >
        {visible.length === 0 ? (
          <li className="text-muted-foreground px-3 py-2 text-xs">
            {contacts.length === 0
              ? "No contacts yet — enter numbers below."
              : "No contacts match."}
          </li>
        ) : (
          visible.map((contact) => {
            const checkboxId = `${id}-c-${contact.id}`
            return (
              <li
                key={contact.id}
                className="hover:bg-muted/60 border-border flex items-center gap-2.5 border-b px-3 py-2 last:border-b-0"
              >
                <Checkbox
                  id={checkboxId}
                  checked={selectedSet.has(contact.id)}
                  onCheckedChange={(checked) =>
                    toggle(contact.id, checked === true)
                  }
                  disabled={disabled}
                />
                <Label
                  htmlFor={checkboxId}
                  className="flex min-w-0 flex-1 cursor-pointer justify-between gap-2 font-normal"
                >
                  <span className="truncate">
                    {contact.contact.displayName}
                  </span>
                  <span className="text-muted-foreground font-mono text-xs">
                    {contact.contact.maskedPhone}
                  </span>
                </Label>
              </li>
            )
          })
        )}
      </ul>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-manual`} className="text-xs font-normal">
          Other numbers (comma-separated)
        </Label>
        <Input
          id={`${id}-manual`}
          value={manualNumbers}
          onChange={(event) => onManualNumbersChange(event.target.value)}
          inputMode="tel"
          disabled={disabled}
          placeholder={`${PLACEHOLDER.phone}, +61412345621`}
        />
      </div>
      <p id={describedBy} className="text-muted-foreground text-xs">
        {field.description ? `${field.description} ` : ""}
        Runs once per recipient, one after another.
      </p>
    </fieldset>
  )
}
