import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import { forwardRef } from "react";

interface FileUploadWithHelperProps {
  id: string;
  label: string;
  helper?: string;
  accept?: string;
  readOnly?: boolean;
  disabled?: boolean;
  currentFile?: File | string;

  // Para React Hook Form
  register?: any;
  errors?: { message?: string };
  existingFileName?: string;
  existingFileUrl?: string;

  // Para estado local
  onChange?: (file: File | null) => void;
}

export const FileUploadWithHelper = forwardRef<
  HTMLInputElement,
  FileUploadWithHelperProps
>(
  (
    {
      id,
      label,
      helper,
      accept = ".pdf,.doc,.docx",
      readOnly = false,
      disabled = false,
      currentFile,
      register,
      errors,
      onChange,
      existingFileName,
      existingFileUrl,
      ...props
    },
    ref
  ) => {
    // Si es modo solo lectura, mostrar como div estático
    if (readOnly) {
      return (
        <div className="grid gap-2 my-2 w-full max-w-md">
          <Label className="font-normal">{label}</Label>
          <div className="flex items-center gap-2 p-2 border rounded-md bg-gray-50">
            <FileText className="h-4 w-4" />
            {existingFileUrl ? (
              <a
                href={existingFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline text-sm"
              >
                {existingFileName || "Ver documento"}
              </a>
            ) : (
              <span className="text-sm">
                {currentFile
                  ? typeof currentFile === "string"
                    ? currentFile
                    : currentFile.name
                  : "No archivo"}
              </span>
            )}
          </div>
          {helper && (
            <Label className="font-light text-slate-400">{helper}</Label>
          )}
        </div>
      );
    }

    // Manejar el cambio de archivo
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;

      if (register?.onChange) {
        // Para React Hook Form
        register.onChange(e);
      } else if (onChange) {
        // Para estado local
        onChange(file);
      }
    };

    // Determinar las props del input
    const inputProps = register
      ? { ...register, ...props } // React Hook Form
      : { onChange: handleFileChange, ...props }; // Estado local

    return (
      <div className="grid gap-2 my-2 w-full max-w-md">
        <Label className="font-normal">{label}</Label>
        <div className="flex items-center gap-2">
          <Input
            {...inputProps}
            ref={ref}
            id={id}
            type="file"
            accept={accept}
            disabled={disabled}
            className="flex-1"
          />
          {currentFile && (
            <Badge variant="secondary" className="text-xs">
              {typeof currentFile === "string" ? "Actual" : "Nuevo"}
            </Badge>
          )}
        </div>
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

FileUploadWithHelper.displayName = "FileUploadWithHelper";
