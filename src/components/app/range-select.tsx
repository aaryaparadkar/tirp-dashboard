import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RANGES, type RangeId } from "@/lib/api/types"
import { cn } from "@/lib/utils"

/** Shared date-range picker used on Overview and in the Conversations filters. */
export function RangeSelect({
  value,
  onValueChange,
  disabled,
  className,
  label = "Date range",
}: {
  value: RangeId
  onValueChange: (value: RangeId) => void
  disabled?: boolean
  className?: string
  label?: string
}) {
  return (
    <Select
      value={value}
      onValueChange={(next) => onValueChange(next as RangeId)}
      disabled={disabled}
    >
      <SelectTrigger
        size="sm"
        aria-label={label}
        className={cn("min-w-40", className)}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {RANGES.map((range) => (
          <SelectItem key={range.id} value={range.id}>
            {range.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
