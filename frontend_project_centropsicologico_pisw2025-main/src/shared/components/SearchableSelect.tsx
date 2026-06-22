import { useState, useEffect, useRef, forwardRef } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormContext } from "react-hook-form";

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  id?: string;
  label?: string;
  placeholder?: string;
  value?: string;
  onValueChange: (value: string) => void;
  onSearch?: (query: string) => void;
  options: Option[];
  loading?: boolean;
  readOnly?: boolean;
  helper?: string;
  error?: string;
  className?: string;
  disabled?: boolean;
}

export const SearchableSelect = forwardRef<
  HTMLInputElement,
  SearchableSelectProps
>(
  (
    {
      id,
      label,
      placeholder = "Buscar...",
      value,
      onValueChange,
      onSearch,
      options,
      loading = false,
      readOnly = false,
      helper,
      error,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      className,
      disabled
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedLabel, setSelectedLabel] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const form = useFormContext?.();
    // TODO: REVIEW
    // @ts-ignore
    const formValue = form?.getValues ? form.getValues(id) : undefined;

    // Debounce para la búsqueda
    useEffect(() => {
      const timer = setTimeout(() => {
        if (searchQuery.trim() && onSearch) {
          onSearch(searchQuery.trim());
        }
      }, 300);

      return () => clearTimeout(timer);
    }, [searchQuery, onSearch]);

    // Actualizar el label seleccionado cuando cambia el value
    useEffect(() => {
      const currentValue = value ?? formValue;
      if (currentValue) {
        const selectedOption = options.find(
          (option) => option.value === currentValue
        );
        if (selectedOption) {
          setSelectedLabel(selectedOption.label);
        }
      } else {
        setSelectedLabel("");
      }
    }, [value, formValue, options]);

    // Cerrar dropdown al hacer click fuera
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
          setSearchQuery("");
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleOptionSelect = (option: Option) => {
      onValueChange(option.value);
      setSelectedLabel(option.label);
      setIsOpen(false);
      setSearchQuery("");
    };

    const handleInputClick = () => {
      if (!readOnly) {
        setIsOpen(true);
        setSearchQuery("");
        // Cargar todas las opciones al abrir
        if (onSearch) {
          onSearch("");
        }
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }
    };
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      setSearchQuery(query);
      if (!isOpen) setIsOpen(true);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    // Si es modo solo lectura, usar el mismo patrón que InputWithHelper
    if (readOnly) {
      return (
        <div className={`grid gap-2 my-2 w-full max-w-md ${className ?? ""}`}>
          <Label className="font-normal">{label}</Label>
          <div className="p-2 border rounded-md bg-gray-50">
            {selectedLabel || "No seleccionado"}
          </div>
        </div>
      );
    }

    return (
      <div className={`grid gap-2 my-2 w-full max-w-md ${className ?? ""}`} ref={containerRef}>
        <Label className="font-normal" htmlFor={id}>
          {label}
        </Label>

        <div className="relative">
          {/* Campo de entrada - mantener altura consistente */}
          <div className="relative">
            <Input
              ref={isOpen ? inputRef : ref}
              id={id}
              type="text"
              placeholder={isOpen ? placeholder : selectedLabel || placeholder}
              value={isOpen ? searchQuery : ""}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              onClick={handleInputClick}
              className={`pr-10 cursor-pointer ${
                isOpen ? "cursor-text" : "cursor-pointer"
              }`}
              readOnly={!isOpen}
              autoComplete="off"
              disabled={disabled}
            />

            {/* Iconos */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {loading && (
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              )}
              <ChevronDown
                className={`h-4 w-4 text-gray-400 transition-transform pointer-events-none ${
                  isOpen ? "transform rotate-180" : ""
                }`}
              />
            </div>
          </div>

          {/* Dropdown */}
          {isOpen && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              {loading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-gray-500">Buscando...</span>
                </div>
              ) : options.length > 0 ? (
                <div className="py-1">
                  {options.map((option) => (
                    <div
                      key={option.value}
                      className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 flex items-center"
                      onClick={() => handleOptionSelect(option)}
                    >
                      <span className="flex-1">{option.label}</span>
                    </div>
                  ))}
                </div>
              ) : searchQuery.trim() ? (
                <div className="px-3 py-2 text-sm text-gray-500">
                  No se encontraron resultados para "{searchQuery}"
                </div>
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500">
                  Escriba para buscar...
                </div>
              )}
            </div>
          )}
        </div>

        {/* Helper/Error text */}
        <Label
          className={`font-light ${error ? "text-red-500" : "text-slate-400"}`}
          htmlFor={id}
        >
          {error || helper}
        </Label>
      </div>
    );
  }
);

SearchableSelect.displayName = "SearchableSelect";
