import type { StatCardProps } from "@/shared/interfaces/ui/StatCardProps"

export const StatCard = ({ title, value }: StatCardProps) => {
  return (
    <div className="flex min-h-28 min-w-0 flex-col justify-between rounded-lg bg-senses-primary p-4 text-white shadow-sm">
      <div className="text-sm font-medium leading-snug">
        {title}
      </div>
      <div className="mt-3 text-3xl font-bold tabular-nums">
        {value}
      </div>
    </div>
  )
}
