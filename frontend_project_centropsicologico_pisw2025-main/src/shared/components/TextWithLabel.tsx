import type { TextWithLabelProps } from "../interfaces/ui/TextWithLabelProps"

export const TextWithLabel = ({ label, text }: TextWithLabelProps) => {
  return (
    <div className="flex flex-row gap-1">
      <label className="text-left text-base lg:text-lg font-semibold tracking-tight text-senses-primary">{label}:</label>
      <p className="text-left text-base lg:text-lg">{text}</p>
    </div>
  )
}
