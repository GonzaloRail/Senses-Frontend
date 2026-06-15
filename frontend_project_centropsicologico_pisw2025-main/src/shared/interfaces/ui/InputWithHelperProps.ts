import type { FieldError, UseFormRegisterReturn } from "react-hook-form";

export interface InputWithHelperProps {
  id: string;
  label?: string;
  helper: string;
  register?: UseFormRegisterReturn<string>;
  errors?: FieldError | undefined;
  type?: string;
  className?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  value?: string;
  autoComplete?: React.HTMLInputAutoCompleteAttribute | undefined;
  disabled?: boolean;
}
