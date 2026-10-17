import { createFileRoute } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { ZapIcon } from "lucide-react"

import {
  DemoDataNote,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  PageSection,
} from "@/components/app"
import {
  TriggerCard,
  TriggerRunDialog,
} from "@/components/triggers/trigger-card"
import { TriggerExecutionHistory } from "@/components/triggers/execution-history"
import { useDashboardQuery } from "@/hooks/use-dashboard-query"
import { getDashboardAdapter } from "@/lib/api/dashboard"
import { MOCK_NOW } from "@/lib/api/mock-data"
import {
  type ConversationSummary,
  type Page,
  type TriggerDefinition,
  type TriggerExecution,
  type TriggerAvailability,
} from "@/lib/api/types"

export const Route = createFileRoute("/triggers")({ component: TriggersPage })

const AVAILABILITY_ORDER: TriggerAvailability[] = [
  "available",
  "needs_config",
  "coming_soon",
]

const AVAILABILITY_GROUP_TITLE: Record<TriggerAvailability, string> = {
  available: "Ready to run",
  needs_config: "Needs configuration",
  coming_soon: "On the roadmap",
}

const AVAILABILITY_GROUP_NOTE: Record<TriggerAvailability, string> = {
  available:
    "Every input is in place. Runs still pass through confirmation, and the console reports the backend response verbatim.",
  needs_config:
    "The backend dependency is not wired yet. Running is blocked until configuration lands.",
  coming_soon:
    "Defined for design review only; the backend side does not exist yet.",
}

function TriggersPage() {
  const triggers = useDashboardQuery<TriggerDefinition[]>(
    () => getDashboardAdapter().listTriggerDefinitions(),
    [],
  )
  const executions = useDashboardQuery<TriggerExecution[]>(
    () => getDashboardAdapter().listTriggerExecutions(),
    [],
  )
  const conversations = useDashboardQuery<Page<ConversationSummary>>(
    () =>
      getDashboardAdapter().listConversations(
        {
          search: "",
          status: "all",
          intent: "all",
          language: "all",
          handling: "all",
          direction: "all",
          hasError: "all",
          range: "30d",
          sort: "recent",
        },
        { page: 1, pageSize: 12 },
      ),
    [],
  )
  const [runTarget, setRunTarget] = useState<TriggerDefinition | null>(null)

  const lastExecutionByTrigger = useMemo(() => {
    const byId = new Map<string, TriggerExecution>()
    for (const execution of executions.data ?? []) {
      if (!byId.has(execution.triggerId))
        byId.set(execution.triggerId, execution)
    }
    return byId
  }, [executions.data])

  const openContacts = useMemo(
    () =>
      (conversations.data?.data ?? []).filter(
        (item) => item.status !== "resolved",
      ),
    [conversations.data],
  )

  const grouped = useMemo(() => {
    const groups = new Map<TriggerAvailability, TriggerDefinition[]>()
    for (const availability of AVAILABILITY_ORDER) groups.set(availability, [])
    for (const trigger of triggers.data ?? []) {
      groups.get(trigger.availability)?.push(trigger)
    }
    return groups
  }, [triggers.data])

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        title="Triggers"
        description="Triggers start WhatsApp workflows that reach real users: a quiz session, a catalogue flow, a renewed enrolment nudge. Availability states say exactly what is wired today."
      />

      <DemoDataNote generatedAt={MOCK_NOW} />

      {triggers.error ? (
        <ErrorState
          title="Triggers could not be loaded"
          description={triggers.error}
          onRetry={triggers.refetch}
        />
      ) : triggers.loading ? (
        <LoadingState variant="cards" rows={4} />
      ) : (triggers.data ?? []).length === 0 ? (
        <EmptyState
          icon={ZapIcon}
          title="No triggers defined"
          description="When tirp-server registers trigger definitions, they appear here grouped by readiness."
        />
      ) : (
        <div className="flex flex-col gap-8">
          {AVAILABILITY_ORDER.map((availability) => {
            const items = grouped.get(availability) ?? []
            if (items.length === 0) return null
            return (
              <PageSection
                key={availability}
                id={`triggers-${availability}`}
                title={AVAILABILITY_GROUP_TITLE[availability]}
                description={AVAILABILITY_GROUP_NOTE[availability]}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  {items.map((trigger) => (
                    <TriggerCard
                      key={trigger.id}
                      trigger={trigger}
                      lastExecution={lastExecutionByTrigger.get(trigger.id)}
                      onRun={() => setRunTarget(trigger)}
                    />
                  ))}
                </div>
              </PageSection>
            )
          })}

          <PageSection
            id="trigger-history"
            title="Runs and refusals"
            description="What the backend actually executed, and what it refused before anything reached a contact."
          >
            {executions.error ? (
              <ErrorState
                title="Execution history could not be loaded"
                description={executions.error}
                onRetry={executions.refetch}
              />
            ) : executions.loading ? (
              <LoadingState rows={3} />
            ) : (
              <TriggerExecutionHistory executions={executions.data ?? []} />
            )}
          </PageSection>
        </div>
      )}

      <TriggerRunDialog
        trigger={runTarget}
        openContacts={openContacts}
        open={runTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRunTarget(null)
        }}
      />
    </div>
  )
}
