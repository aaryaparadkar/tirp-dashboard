import { XIcon } from "lucide-react"

import { RangeSelect } from "@/components/app"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CONVERSATION_STATUSES,
  DEFAULT_FILTERS,
  HANDLING_LABEL,
  HANDLING_MODES,
  INTENTS,
  INTENT_LABEL,
  LANGUAGES,
  LANGUAGE_LABEL,
  SORT_OPTIONS,
  STATUS_LABEL,
  type ConversationFilters,
  type HandlingMode,
  type Intent,
  type MessageDirection,
  type SortId,
} from "@/lib/api/types"

/**
 * Filter toolbar for the conversation list. Debouncing happens in the route
 * (the search value is local state), this component is presentational.
 */
export function ConversationFilters({
  filters,
  onChange,
  resultCount,
  totalCount,
}: {
  filters: ConversationFilters
  onChange: (next: ConversationFilters) => void
  resultCount: number
  totalCount: number
}) {
  const dirty =
    filters.search !== DEFAULT_FILTERS.search ||
    filters.status !== DEFAULT_FILTERS.status ||
    filters.intent !== DEFAULT_FILTERS.intent ||
    filters.language !== DEFAULT_FILTERS.language ||
    filters.handling !== DEFAULT_FILTERS.handling ||
    filters.direction !== DEFAULT_FILTERS.direction ||
    filters.hasError !== DEFAULT_FILTERS.hasError ||
    filters.range !== DEFAULT_FILTERS.range ||
    filters.sort !== DEFAULT_FILTERS.sort

  return (
    <div
      role="search"
      aria-label="Filter conversations"
      className="flex flex-col gap-3"
    >
      <div className="flex items-center gap-2">
        <Input
          type="search"
          value={filters.search}
          onChange={(event) =>
            onChange({ ...filters, search: event.target.value })
          }
          placeholder="Search name, phone, or message text"
          aria-label="Search conversations"
          className="h-9 flex-1"
        />
        {dirty ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange({ ...DEFAULT_FILTERS })}
          >
            <XIcon aria-hidden="true" />
            Clear
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect
          ariaLabel="Filter by status"
          value={filters.status}
          allLabel="Any status"
          options={CONVERSATION_STATUSES.map((status) => ({
            value: status,
            label: STATUS_LABEL[status],
          }))}
          onChange={(next) =>
            onChange({ ...filters, status: next as typeof filters.status })
          }
        />
        <FilterSelect
          ariaLabel="Filter by enquiry type"
          value={filters.intent}
          allLabel="Any intent"
          options={INTENTS.map((intent) => ({
            value: intent,
            label: INTENT_LABEL[intent],
          }))}
          onChange={(next) => onChange({ ...filters, intent: next as Intent })}
        />
        <FilterSelect
          ariaLabel="Filter by language"
          value={filters.language}
          allLabel="Any language"
          options={LANGUAGES.map((language) => ({
            value: language,
            label: LANGUAGE_LABEL[language],
          }))}
          onChange={(next) =>
            onChange({ ...filters, language: next as typeof filters.language })
          }
        />
        <FilterSelect
          ariaLabel="Filter by handling mode"
          value={filters.handling}
          allLabel="Any handling"
          options={HANDLING_MODES.map((mode) => ({
            value: mode,
            label: HANDLING_LABEL[mode as HandlingMode],
          }))}
          onChange={(next) =>
            onChange({ ...filters, handling: next as HandlingMode })
          }
        />
        <FilterSelect
          ariaLabel="Filter by last message direction"
          value={filters.direction}
          allLabel="Any direction"
          options={[
            { value: "inbound", label: "Inbound last" },
            { value: "outbound", label: "Outbound last" },
          ]}
          onChange={(next) =>
            onChange({ ...filters, direction: next as MessageDirection })
          }
        />
        <FilterSelect
          ariaLabel="Filter by error state"
          value={filters.hasError}
          allLabel="All conversations"
          options={[{ value: "with-error", label: "With errors" }]}
          onChange={(next) =>
            onChange({ ...filters, hasError: next as typeof filters.hasError })
          }
        />
        <RangeSelect
          value={filters.range}
          onValueChange={(range) => onChange({ ...filters, range })}
          label="Filter by activity window"
        />
        <FilterSelect
          ariaLabel="Sort conversations"
          value={filters.sort}
          allLabel={undefined}
          hideAll
          options={SORT_OPTIONS.map((option) => ({
            value: option.id,
            label: option.label,
          }))}
          onChange={(next) => onChange({ ...filters, sort: next as SortId })}
        />
      </div>

      <p aria-live="polite" className="text-muted-foreground text-xs">
        Showing {resultCount} of {totalCount} conversation
        {totalCount === 1 ? "" : "s"} in the selected window.
      </p>
    </div>
  )
}

type Selectable = string

function FilterSelect({
  ariaLabel,
  value,
  options,
  onChange,
  allLabel,
  hideAll = false,
}: {
  ariaLabel: string
  value: Selectable
  options: { value: Selectable; label: string }[]
  onChange: (value: string) => void
  allLabel?: string
  hideAll?: boolean
}) {
  const showAll = !hideAll && allLabel !== undefined
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        size="sm"
        aria-label={ariaLabel}
        className="min-w-36 flex-none"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {showAll ? <SelectItem value="all">{allLabel}</SelectItem> : null}
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
