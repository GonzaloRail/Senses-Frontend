// Componente TextareaWithHelper para consistencia
interface TextareaWithHelperProps {
  id: string
  label: string
  helper?: string
  type?: string
  value?: string
  readOnly?: boolean
  disabled?: boolean
  placeholder?: string
  rows?: number
  // Para React Hook Form
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register?: any
  errors?: { message?: string }
  
  // Para estado local
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
}
export const TextareaWithHelper = ({ id, label, value, placeholder, readOnly, helper, errors, rows = 3, ...props }: TextareaWithHelperProps) => {
  return (
    <div className="grid gap-2 my-2 w-full max-w-md">
      <label htmlFor={id} className="block text-sm mb-2 font-normal">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        placeholder={placeholder}
        readOnly={readOnly}
        rows={rows}
        className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500"
        disabled={readOnly}
        {...props}
      />
      {errors && (
        <p className="text-red-500 text-sm mt-1">{errors.message}</p>
      )}
      {helper && !errors && (
        <p className="text-xs text-gray-500 mt-1">{helper}</p>
      )}
    </div>
  );
};