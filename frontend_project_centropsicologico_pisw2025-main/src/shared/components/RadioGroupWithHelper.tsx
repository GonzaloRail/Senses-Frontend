import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface Option {
  id: string;
  label: string;
  disabled?: boolean;
}

interface RadioGroupWithHelperProps {
  id: string;
  name?: string;
  label?: string;
  helper?: string;
  options: Option[];
  value?: string;
  readOnly?: boolean;
  disabled?: boolean;
  className?: string;
  direction?: "row" | "column";
  // UseForm register (UseFormRegisterReturn)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register?: any;
  errors?: { message?: string } | null;
  onChange?: (value: string) => void;
  defaultValue?: string;
}

export const RadioGroupWithHelper = ({
  id,
  name,
  label,
  helper,
  options,
  value,
  readOnly = false,
  disabled = false,
  className,
  direction = "column",
  register,
  errors,
  onChange,
  defaultValue
}: RadioGroupWithHelperProps) => {
  const groupName = register?.name ?? name ?? id;

  const handleValueChange = (v: string) => {
    // Compatible con register.onChange (RH Form)
    if (register?.onChange) {
      // Simular evento target para RHF
      register.onChange({ target: { name: register.name, value: v } } as any);
    }
    if (onChange) onChange(v);
  };

  return (
    <div className={cn(className, "grid gap-2 my-2 w-full max-w-md")}>
      {label && (
        <Label className="font-normal" htmlFor={id}>
          {label}
        </Label>
      )}

      <RadioGroup
        value={value}
        onValueChange={handleValueChange}
        aria-labelledby={id}
        className={cn(
          "flex gap-10",
          direction === "row" ? "flex-row" : "flex-col"
        )}
        name={groupName}
        defaultValue={defaultValue}
      >
        {options.map((opt) => {
          const isDisabled = disabled || readOnly || opt.disabled;
          return (
            <label
              key={opt.id}
              htmlFor={`${id}-${opt.id}`}
              className={cn(
                "flex items-center gap-1 cursor-pointer select-none",
                isDisabled && "cursor-not-allowed opacity-60"
              )}
            >
              <RadioGroupItem
                id={`${id}-${opt.id}`}
                value={opt.id}
                disabled={isDisabled}
                className="mr-2"
              />
              <span>{opt.label}</span>
            </label>
          );
        })}
      </RadioGroup>

      <Label
        className={`font-light ${errors ? "text-senses-danger" : "text-slate-400"}`}
        htmlFor={id}
      >
        {errors ? errors.message : helper}
      </Label>
    </div>
  );
};

export default RadioGroupWithHelper;