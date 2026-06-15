import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { forwardRef } from "react"

interface CheckboxOption {
  id: string
  label: string
  disabled?: boolean
}

interface CheckboxGroupWithHelperProps {
  id: string
  label: string
  helper?: string
  options: string[] | CheckboxOption[]
  selectedValues?: string[]
  readOnly?: boolean
  disabled?: boolean
  columns?: 1 | 2 | 3 | 4
  
  // Para React Hook Form
  register?: any
  errors?: { message?: string }
  
  // Para estado local
  onSelectionChange?: (selectedValues: string[]) => void
}

export const CheckboxGroupWithHelper = forwardRef<HTMLDivElement, CheckboxGroupWithHelperProps>(
  ({ 
    id, 
    label, 
    helper, 
    options,
    selectedValues = [],
    readOnly = false,
    disabled = false,
    columns = 2,
    register, 
    errors,
    onSelectionChange,
    ...props 
  }, ref) => {
    // Normalizar opciones
    const normalizedOptions: CheckboxOption[] = options.map(option => 
      typeof option === 'string' 
        ? { id: option, label: option }
        : option
    )

    // Si es modo solo lectura, mostrar como badges
    if (readOnly) {
      return (
        <div className="grid gap-2 my-2 w-full max-w-md" ref={ref}>
          <Label className="font-normal">{label}</Label>
          <div className="flex gap-2 flex-wrap">
            {selectedValues.length > 0 ? (
              selectedValues.map((value) => {
                const option = normalizedOptions.find(opt => opt.id === value)
                return (
                  <Badge key={value} variant="default">
                    {option?.label || value}
                  </Badge>
                )
              })
            ) : (
              <span className="text-sm text-gray-500">Ninguno seleccionado</span>
            )}
          </div>
          {!readOnly && helper && (
            <Label className="font-light text-slate-400">
              {helper}
            </Label>
          )}
        </div>
      )
    }

    // Manejar cambio individual
    const handleOptionChange = (optionId: string, checked: boolean) => {
      const newSelectedValues = checked
        ? [...selectedValues, optionId]
        : selectedValues.filter(value => value !== optionId)

      if (register?.onChange) {
        // Para React Hook Form
        register.onChange({ target: { value: newSelectedValues } })
      } else if (onSelectionChange) {
        // Para estado local
        onSelectionChange(newSelectedValues)
      }
    }

    // Clases para columnas
    const columnClasses = {
      1: "grid-cols-1",
      2: "grid-cols-2 gap-x-10 md:gap-x-20",
      3: "grid-cols-3 gap-x-6",
      4: "grid-cols-4 gap-x-4"
    }

    return (
      <div className="grid gap-2 my-2 w-full max-w-md" ref={ref} {...props}>
        <Label className="font-normal">{label}</Label>
        <div className={`grid ${columnClasses[columns]} gap-y-2`}>
          {normalizedOptions.map((option) => (
            <div key={option.id} className="flex items-center space-x-2">
              <Checkbox
                id={`${id}-${option.id}`}
                checked={selectedValues.includes(option.id)}
                onCheckedChange={(checked) => 
                  handleOptionChange(option.id, checked as boolean)
                }
                disabled={disabled || option.disabled}
              />
              <Label 
                htmlFor={`${id}-${option.id}`} 
                className="text-sm font-normal cursor-pointer"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </div>
        {!readOnly && (
          <Label
            className={`font-light ${errors ? "text-red-500" : "text-slate-400"}`}>
            {errors ? errors.message : helper}
          </Label>
        )}
      </div>
    )
  }
)

CheckboxGroupWithHelper.displayName = "CheckboxGroupWithHelper"