import { useState } from "react"
import { toast } from "sonner"
import { CircleAlertIcon, PlayIcon } from "lucide-react"

import { StatusBadge, type StatusTone } from "@/components/app"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DashboardApiError, runTrigger } from "@/lib/api/dashboard"
import {
  TRIGGER_AVAILABILITY_LABEL,
  type ConversationSummary,
  type TriggerDefinition,
  type TriggerExecution,
  type TriggerFieldKind,
} from "@/lib/api/types"
import { formatDateTime, looksLikeE164, maskPhone } from "@/lib/format"
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

/** Run flow: explain → collect → validate → confirm → honest result. */
export function TriggerRunDialog({
  trigger,
  openContacts,
  open,
  onOpenChange,
}: {
  trigger: TriggerDefinition | null
  /** Open/new conversations offered to `conversation`-targeted triggers. */
  openContacts: ConversationSummary[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [validation, setValidation] = useState<string | null>(null)
  const [error, setError] = useState<DashboardApiError | null>(null)
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<TriggerExecution | null>(null)

  if (!trigger || !open) return null

  async function confirmRun() {
    if (!trigger) return
    const problems: string[] = []
    for (const field of trigger.fields) {
      const value = (values[field.id] ?? "").trim()
      if (field.required && value === "") {
        problems.push(`${field.label} is required.`)
        continue
      }
      if (field.kind === "phone" && value !== "" && !looksLikeE164(value)) {
        problems.push(`${field.label} must look like +61412345620.`)
      }
    }
    if (problems.length > 0) {
      setValidation(problems.join(" "))
      return
    }
    setValidation(null)
    setPending(true)
    setError(null)
    try {
      const execution: TriggerExecution = await runTrigger(trigger.id, {
        phone: values.phone ?? "",
        message: values.message ?? "",
        conversationId: values.conversation ?? "",
      })
      setResult(execution)
      toast.success("Run recorded", {
        description: execution.result?.reference ?? "The trigger executed.",
      })
    } catch (thrown) {
      setError(
        thrown instanceof DashboardApiError
          ? thrown
          : new DashboardApiError({
              code: "unavailable",
              title: "The trigger could not run",
              message:
                thrown instanceof Error
                  ? thrown.message
                  : "Unknown backend response.",
            }),
      )
      toast.error("Trigger not executed", {
        description:
          thrown instanceof Error
            ? thrown.message
            : "The run was refused — nothing was sent.",
      })
    } finally {
      setPending(false)
    }
  }

  const formId = `trigger-run-${trigger.id}`
  const finished = error !== null || result !== null

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setValues({})
          setValidation(null)
          setError(null)
          setResult(null)
          onOpenChange(false)
        }
      }}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Run “{trigger.name}”</DialogTitle>
          <DialogDescription>
            This trigger messages a real WhatsApp contact. It explains exactly
            what it will do, collects its inputs first, and runs only after your
            confirmation.
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
          {trigger.fields.map((field) => (
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
          ))}

          {validation ? (
            <Alert variant="destructive">
              <CircleAlertIcon aria-hidden="true" />
              <AlertTitle>Check the inputs</AlertTitle>
              <AlertDescription>{validation}</AlertDescription>
            </Alert>
          ) : null}

          {error ? (
            <Alert variant="destructive">
              <AlertTitle>{error.title}</AlertTitle>
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          ) : null}

          {result ? (
            <Alert>
              <AlertTitle>Run recorded — nothing was sent</AlertTitle>
              <AlertDescription>
                {result.result?.detail ??
                  "The trigger completed only as a console record."}{" "}
                Reference:{" "}
                <span className="font-mono">
                  {result.result?.reference ?? result.id}
                </span>
              </AlertDescription>
            </Alert>
          ) : null}

          <p className="text-muted-foreground text-xs">
            Blocked run: the dashboard refuses to fake an external effect.
            {trigger.backendNote}
          </p>
        </form>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setValues({})
              setValidation(null)
              setError(null)
              setResult(null)
              onOpenChange(false)
            }}
          >
            {finished ? "Close" : "Cancel"}
          </Button>
          {!finished ? (
            <Button type="submit" form={formId} disabled={pending}>
              <PlayIcon aria-hidden="true" />
              {pending ? "Running…" : "Confirm and run"}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
                {contact.contact.displayName} ·{" "}
                {maskPhone(contact.contact.phone)}
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
          inputMode={field.kind === "phone" ? "tel" : "text"}
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
