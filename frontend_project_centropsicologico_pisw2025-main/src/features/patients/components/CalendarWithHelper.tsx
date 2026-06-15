import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { forwardRef, useState } from "react";

interface CalendarWithHelperProps {
  id: string;
  label: string;
  value?: string;
  readOnly?: boolean;
  disabled?: boolean;
  helper?: string;
  errors?: { message?: string };
  onChange?: (value: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register?: any;
}

export const CalendarWithHelper = forwardRef<
  HTMLButtonElement,
  CalendarWithHelperProps
>(
  (
    {
      id,
      label,
      value,
      readOnly = false,
      disabled = false,
      helper,
      errors,
      onChange,
      register,
      ...props
    },
    ref
  ) => {
    // Estado local para el popover
    const [open, setOpen] = useState(false);

    // Si es modo solo lectura, mostrar como div estático
    if (readOnly) {
      console.log(value);
      return (
        <div className="grid gap-2 my-2 w-full max-w-md">
          <Label className="font-normal">{label}</Label>
          <div className="p-2 border rounded-md bg-gray-50">
            {value
              ? format(new Date(value + "T00:00:00"), "dd/MM/yyyy")
              : "No especificado"}
          </div>
        </div>
      );
    }

    // Determinar la fecha seleccionada
    const selectedDate = value ? new Date(`${value}T00:00:00`) : undefined;
    return (
      <div className="grid gap-2 my-1 w-full max-w-md">
        <Label className="font-normal" htmlFor={id}>
          {label}
        </Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={
                "w-full justify-between text-left font-normal" +
                (errors ? " border-red-500" : "")
              }
              disabled={disabled}
              ref={ref}
              type="button"
            >
              {selectedDate ? (
                format(selectedDate, "dd/MM/yyyy")
              ) : (
                <span className="text-muted-foreground">Seleccionar fecha</span>
              )}
              <CalendarIcon className="mr-2 h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                setOpen(false);
                console.log(date);
                if (date && onChange) {
                  onChange(format(date, "yyyy-MM-dd"));
                }
                if (date && register?.onChange) {
                  register.onChange({
                    target: { value: format(date, "yyyy-MM-dd") },
                  });
                }
              }}
              locale={es}
              initialFocus
              captionLayout="dropdown"
              defaultMonth={selectedDate || new Date(2000, 0)}
              startMonth={new Date(1920, 0)}
              {...props}
            />
          </PopoverContent>
        </Popover>
        <Label
          className={`font-light ${errors ? "text-red-500" : "text-slate-400"}`}
          htmlFor={id}
        >
          {errors ? errors.message : helper}
        </Label>
      </div>
    );
  }
);

CalendarWithHelper.displayName = "CalendarWithHelper";
