import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { forwardRef } from "react";

interface SelectOption {
  id: string;
  name: string;
}

interface SelectWithHelperProps {
  id: string;
  label: string;
  helper?: string;
  value?: string;
  readOnly?: boolean;
  disabled?: boolean;
  placeholder?: string;
  options: string[] | SelectOption[];

  // Para React Hook Form
  register?: any;
  errors?: { message?: string };

  // Para estado local
  onValueChange?: (value: string) => void;
}

export const SelectWithHelper = forwardRef<
  HTMLButtonElement,
  SelectWithHelperProps
>(
  (
    {
      id,
      label,
      helper,
      value,
      readOnly = false,
      disabled = false,
      placeholder = "Seleccionar...",
      options,
      register,
      errors,
      onValueChange,
      ...props
    },
    ref
  ) => {
    // Si es modo solo lectura, mostrar como div estático
    if (readOnly) {
      // Encontrar el label del valor seleccionado
      let displayValue = "No especificado";
      if (value) {
        if (typeof options[0] === "string") {
          displayValue = value;
        } else {
          const selectedOption = (options as SelectOption[]).find(
            (opt) => opt.id === value
          );
          displayValue = selectedOption?.name || value;
        }
      }

      return (
        <div className="grid gap-2 my-2 w-full max-w-md">
          <Label className="font-normal">{label}</Label>
          <div className="p-2 border rounded-md bg-gray-50">{displayValue}</div>
          {!readOnly && helper && (
            <Label className="font-light text-slate-400">{helper}</Label>
          )}
        </div>
      );
    }

    // Manejar el cambio de valor
    const handleValueChange = (newValue: string) => {
      if (register?.onChange) {
        // Para React Hook Form
        register.onChange({ target: { value: newValue } });
      } else if (onValueChange) {
        // Para estado local
        onValueChange(newValue);
      }
    };

    return (
      <div className="grid gap-2 my-2 w-full max-w-md">
        <Label className="font-normal">{label}</Label>
        <Select
          value={value || ""}
          onValueChange={handleValueChange}
          disabled={disabled}
          {...props}
        >
          <SelectTrigger ref={ref}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => {
              const optionValue =
                typeof option === "string" ? option : option.id;
              const optionLabel =
                typeof option === "string" ? option : option.name;
              return (
                <SelectItem key={optionValue} value={optionValue}>
                  {optionLabel}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        {!readOnly && (
          <Label
            className={`font-light ${
              errors ? "text-red-500" : "text-slate-400"
            }`}
            htmlFor={id}
          >
            {errors ? errors.message : helper}
          </Label>
        )}
      </div>
    );
  }
);

SelectWithHelper.displayName = "SelectWithHelper";
