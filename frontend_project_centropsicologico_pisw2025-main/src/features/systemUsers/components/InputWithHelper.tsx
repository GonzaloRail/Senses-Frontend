import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { forwardRef } from "react"
import { useFormContext } from "react-hook-form"

interface InputWithHelperProps {
  id: string
  label: string
  helper?: string
  type?: string
  value?: string
  readOnly?: boolean
  disabled?: boolean
  placeholder?: string

  // Para React Hook Form
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register?: any
  errors?: { message?: string }

  // Para estado local
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export const InputWithHelper = forwardRef<HTMLInputElement, InputWithHelperProps>(
  ({
    id,
    label,
    helper,
    type = "text",
    value,
    readOnly = false,
    disabled = false,
    placeholder,
    register,
    errors,
    onChange,
    ...props
  }, ref) => {
    // Si es modo solo lectura, mostrar como div estático
    // Obtener valores del formulario si está en modo readOnly y no se pasa value
    const form = useFormContext?.();
    const formValue = form?.getValues ? form.getValues(id) : undefined;

    if (readOnly) {
      return (
        <div className="grid gap-2 my-2 w-full max-w-md">
          <Label className="font-normal">{label}</Label>
          <div className="p-2 border rounded-md bg-gray-50">
            {value ?? formValue ?? "No especificado"}
          </div>
        </div>
      )
    }

    // Determinar las props del input
    const inputProps = register
      ? { ...register, ...props } // React Hook Form
      : { value, onChange, ...props } // Estado local

    return (
      <div className="grid gap-2 my-2 w-full max-w-md">
        <Label className="font-normal" htmlFor={id}>{label}</Label>
        <Input
          {...inputProps}
          ref={ref}
          id={id}
          type={type}
          disabled={disabled}
          placeholder={placeholder}
        />
        <Label
          className={`font-light ${errors ? "text-red-500" : "text-slate-400"}`}
          htmlFor={id}>
          {errors ? errors.message : helper}
        </Label>
      </div>
    )
  }
)

InputWithHelper.displayName = "InputWithHelper"