import type { StatCardProps } from "@/shared/interfaces/ui/StatCardProps"

export const StatCard = ({ title, value }: StatCardProps) => {
  return (
    <div className="bg-senses-primary text-white py-2 px-4 rounded-lg shadow-xl text-md w-[calc(50%-4px)] flex flex-col items-center lg:w-[calc(20%-4px)] justify-center">
      <div className="text-center font-semibold mb-2">
        {title}
      </div>
      <div className="text-3xl font-bold">
        {value}
      </div>
    </div>
  )
}
