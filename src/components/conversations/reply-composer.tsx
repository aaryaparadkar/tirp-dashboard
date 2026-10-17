import { useState } from "react"
import { CornerDownLeftIcon, SendHorizonalIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

const MAX_LENGTH = 4000

/**
 * Operator reply composer. Nothing is sent automatically: submit (button or
 * Ctrl/⌘+Enter) hands the draft to the adapter, which currently reports the
 * Phase 3 "unsupported" error — surfaced inline by the caller.
 */
export function ReplyComposer({
  onSend,
  disabled,
  className,
}: {
  onSend: (body: string) => Promise<void>
  disabled?: boolean
  className?: string
}) {
  const [draft, setDraft] = useState("")
  const trimmed = draft.trim()
  const overLimit = draft.length > MAX_LENGTH
  const canSend = trimmed.length > 0 && !overLimit && !disabled

  function submit() {
    if (!canSend) return
    void onSend(trimmed).then(() => {
      // Draft clears only after the adapter settled (success or structured
      // failure) so an error never loses the operator's text.
      setDraft("")
    })
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <form
      className={className}
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      <label htmlFor="reply-draft" className="sr-only">
        Reply to the contact as the OSHC support desk. Enter with Ctrl or Cmd to
        send.
      </label>
      <Textarea
        id="reply-draft"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Write a reply to send through WhatsApp…"
        aria-describedby="reply-draft-hint"
        aria-invalid={overLimit || undefined}
        className="min-h-24"
        maxLength={MAX_LENGTH}
        rows={4}
      />
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <p
          id="reply-draft-hint"
          className="text-muted-foreground text-xs"
          aria-live="polite"
        >
          <span
            className={overLimit ? "text-destructive font-medium" : undefined}
          >
            {draft.length}/{MAX_LENGTH}
          </span>
          {" · "}
          <kbd className="border-border rounded border p-0.5 font-mono text-[10px]">
            <CornerDownLeftIcon
              aria-hidden="true"
              className="mr-0.5 inline size-2.5"
            />
            Ctrl/⌘+Enter
          </kbd>{" "}
          to send
        </p>
        <Button type="submit" size="sm" disabled={!canSend}>
          <SendHorizonalIcon aria-hidden="true" />
          Send reply
        </Button>
      </div>
    </form>
  )
}
