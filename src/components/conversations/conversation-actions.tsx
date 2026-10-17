import { useState } from "react"
import { toast } from "sonner"
import { MoreHorizontalIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  DashboardApiError,
  requestCategoryChange,
  requestEscalation,
  requestStatusChange,
} from "@/lib/api/dashboard"
import { isMockAdapter } from "@/lib/api/client"
import {
  CONVERSATION_STATUSES,
  INTENTS,
  INTENT_LABEL,
  STATUS_LABEL,
  type ConversationStatus,
  type ConversationSummary,
  type Intent,
} from "@/lib/api/types"

/**
 * Header actions for the selected conversation. Read-only bookkeeping (the
 * unread badge) applies locally and says so; anything that must reach
 * tirp-server opens a confirmation dialog and writes through the active
 * adapter. On fixtures the request rejects with the structured
 * "unsupported" error — it never pretends the change happened.
 */
export function ConversationActions({
  conversation,
  onToggleUnread,
  onUpdated,
}: {
  conversation: ConversationSummary
  onToggleUnread: (unread: boolean) => void
  /** Called with the refreshed summary after a successful mutation. */
  onUpdated: (summary: ConversationSummary) => void
}) {
  const [dialog, setDialog] = useState<
    null | "status" | "escalate" | "category"
  >(null)

  function toggleUnread() {
    const unread = conversation.unreadCount === 0
    onToggleUnread(unread)
    toast.info(
      unread
        ? "Marked as unread on this console"
        : "Marked as read on this console",
      {
        description:
          "The unread badge is dashboard bookkeeping only — the contact's WhatsApp state is untouched.",
      },
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            aria-label={`Actions for the conversation with ${conversation.contact.displayName}`}
          >
            <MoreHorizontalIcon aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Conversation actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={toggleUnread}>
            {conversation.unreadCount > 0 ? "Mark as read" : "Mark as unread"}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setDialog("status")}>
            Change status…
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setDialog("category")}>
            Change enquiry category…
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setDialog("escalate")}
          >
            Escalate to human…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open) setDialog(null)
        }}
      >
        {dialog === "status" ? (
          <StatusDialog
            conversation={conversation}
            onClose={() => setDialog(null)}
            onUpdated={onUpdated}
          />
        ) : null}
        {dialog === "escalate" ? (
          <EscalateDialog
            conversation={conversation}
            onClose={() => setDialog(null)}
            onUpdated={onUpdated}
          />
        ) : null}
        {dialog === "category" ? (
          <CategoryDialog
            conversation={conversation}
            onClose={() => setDialog(null)}
            onUpdated={onUpdated}
          />
        ) : null}
      </Dialog>
    </>
  )
}

/** Shared shell: honest inline error when a confirmable mutation rejects. */
function ActionDialogShell({
  title,
  description,
  confirmLabel,
  onConfirm,
  children,
  onClose,
  destructiveConfirm = false,
}: {
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => Promise<unknown>
  children: React.ReactNode
  onClose: () => void
  destructiveConfirm?: boolean
}) {
  const [error, setError] = useState<DashboardApiError | null>(null)
  const [pending, setPending] = useState(false)

  async function confirm() {
    setPending(true)
    setError(null)
    try {
      await onConfirm()
      onClose()
    } catch (thrown) {
      setError(
        thrown instanceof DashboardApiError
          ? thrown
          : new DashboardApiError({
              code: "unavailable",
              title: "Could not complete the action",
              message:
                thrown instanceof Error
                  ? thrown.message
                  : "The backend did not accept this request.",
            }),
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-4">{children}</div>
      <p role="status" aria-live="polite" className="sr-only">
        {error
          ? `Action not completed: ${error.title}`
          : pending
            ? "Contacting tirp-server…"
            : ""}
      </p>
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>{error.title}</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          {"Close"}
        </Button>
        {error ? null : (
          <Button
            variant={destructiveConfirm ? "destructive" : "default"}
            onClick={() => void confirm()}
            disabled={pending}
          >
            {pending ? "Contacting backend…" : confirmLabel}
          </Button>
        )}
      </DialogFooter>
    </DialogContent>
  )
}

function StatusDialog({
  conversation,
  onClose,
  onUpdated,
}: {
  conversation: ConversationSummary
  onClose: () => void
  onUpdated: (summary: ConversationSummary) => void
}) {
  const [status, setStatus] = useState<ConversationStatus>(conversation.status)
  const mock = isMockAdapter()
  return (
    <ActionDialogShell
      title="Change conversation status"
      description={
        mock
          ? `Applies to the chat with ${conversation.contact.displayName}. The console is running on fixtures, so this is refused until it is connected to tirp-server.`
          : `Applies to the chat with ${conversation.contact.displayName}. The change is written through to tirp-server.`
      }
      confirmLabel="Apply status"
      onClose={onClose}
      onConfirm={async () => {
        const updated = await requestStatusChange(conversation.id, status)
        onUpdated(updated)
        toast.success("Status updated", {
          description: `Now ${STATUS_LABEL[updated.status]}.`,
        })
      }}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="status-pick">New status</Label>
        <Select
          value={status}
          onValueChange={(next) => setStatus(next as ConversationStatus)}
        >
          <SelectTrigger id="status-pick" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CONVERSATION_STATUSES.map((option) => (
              <SelectItem key={option} value={option}>
                {STATUS_LABEL[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </ActionDialogShell>
  )
}

function EscalateDialog({
  conversation,
  onClose,
  onUpdated,
}: {
  conversation: ConversationSummary
  onClose: () => void
  onUpdated: (summary: ConversationSummary) => void
}) {
  const [note, setNote] = useState("")
  const mock = isMockAdapter()
  return (
    <ActionDialogShell
      title="Escalate to human"
      description={
        mock
          ? `Hands the chat with ${conversation.contact.displayName} to the support desk and pauses assistant replies. The console is running on fixtures, so nobody is notified.`
          : `Hands the chat with ${conversation.contact.displayName} to the support desk and pauses assistant replies. The desk is notified through tirp-server.`
      }
      confirmLabel="Escalate"
      destructiveConfirm
      onClose={onClose}
      onConfirm={async () => {
        const result = await requestEscalation(conversation.id, note)
        onUpdated(result.summary)
        if (result.partialError) {
          toast.warning("Escalated with a caveat", {
            description: result.partialError,
          })
        } else if (result.notified) {
          toast.success("Escalated to the support desk", {
            description:
              "Assistant replies are paused until the desk resolves the chat.",
          })
        }
      }}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="escalate-note">Note for the desk (optional)</Label>
        <Textarea
          id="escalate-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Context that saves the agent a re-read…"
          className="min-h-20"
        />
      </div>
    </ActionDialogShell>
  )
}

function CategoryDialog({
  conversation,
  onClose,
  onUpdated,
}: {
  conversation: ConversationSummary
  onClose: () => void
  onUpdated: (summary: ConversationSummary) => void
}) {
  const [intent, setIntent] = useState<Intent>(conversation.intent)
  const mock = isMockAdapter()
  return (
    <ActionDialogShell
      title="Change enquiry category"
      description={
        mock
          ? `Reclassifies the chat with ${conversation.contact.displayName} so metrics follow the new group. The console is running on fixtures, so the value is unchanged.`
          : `Reclassifies the chat with ${conversation.contact.displayName} so metrics follow the new group. The change is written through to tirp-server.`
      }
      confirmLabel="Apply category"
      onClose={onClose}
      onConfirm={async () => {
        const updated = await requestCategoryChange(conversation.id, intent)
        onUpdated(updated)
        toast.success("Category updated", {
          description: `Now ${INTENT_LABEL[updated.intent]}.`,
        })
      }}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="category-pick">New enquiry type</Label>
        <Select
          value={intent}
          onValueChange={(next) => setIntent(next as Intent)}
        >
          <SelectTrigger id="category-pick" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {INTENTS.map((option) => (
              <SelectItem key={option} value={option}>
                {INTENT_LABEL[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </ActionDialogShell>
  )
}
