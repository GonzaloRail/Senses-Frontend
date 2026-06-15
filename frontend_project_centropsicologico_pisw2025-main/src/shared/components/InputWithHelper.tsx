import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { InputWithHelperProps } from "../interfaces/ui/InputWithHelperProps";
import { cn } from "@/lib/utils";

export const InputWithHelper = ({
  id,
  label,
  helper,
  register,
  errors,
  type,
  className,
  onChange,
  value,
  autoComplete,
  disabled
}: InputWithHelperProps) => {
  return (
    <div className={cn(className, "grid gap-2 my-2 w-65 md:w-80 lg:w-90")}>
      <Label className="font-normal" htmlFor={id}>
        {label}
      </Label>
      <Input
        {...register}
        id={id}
        type={type ? type : "text"}
        value={value}
        disabled={disabled}
        onChange={(e) => {
          if (register?.onChange) {
            register.onChange(e);
          }
          if (onChange) {
            onChange(e);
          }
        }}
        autoComplete={autoComplete}
      />
      <Label
        className={`font-light ${
          errors ? "text-senses-danger" : "text-slate-400"
        }`}
        htmlFor={id}
      >
        {errors ? errors.message : helper}
      </Label>
    </div>
  );
};
