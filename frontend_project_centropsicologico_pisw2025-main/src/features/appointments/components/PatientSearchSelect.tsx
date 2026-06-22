import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PatientSearchQuery } from "@/features/patients/api/patientsApi";

type PatientSearchType = "DNI" | "NAME_SURNAME";

type PatientOption = {
  id: string;
  name: string;
  dni?: string;
};

interface PatientSearchSelectProps {
  id?: string;
  label?: string;
  value?: string;
  onValueChange: (value: string) => void;
  onSearch: (filters: PatientSearchQuery) => void;
  options: PatientOption[];
  loading?: boolean;
  readOnly?: boolean;
  helper?: string;
  error?: string;
}

const getOptionLabel = (patient: PatientOption) =>
  patient.dni ? `${patient.name} - ${patient.dni}` : patient.name;

export const PatientSearchSelect = ({
  id,
  label,
  value,
  onValueChange,
  onSearch,
  options,
  loading = false,
  readOnly = false,
  helper,
  error,
}: PatientSearchSelectProps) => {
  const [searchType, setSearchType] = useState<PatientSearchType>("DNI");
  const [dniSearch, setDniSearch] = useState("");
  const [firstnameSearch, setFirstnameSearch] = useState("");
  const [lastnameSearch, setLastnameSearch] = useState("");
  const [selectedLabel, setSelectedLabel] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const hasSearch =
    searchType === "DNI"
      ? dniSearch.trim().length > 0
      : firstnameSearch.trim().length > 0 || lastnameSearch.trim().length > 0;

  useEffect(() => {
    if (!value) {
      setSelectedLabel("");
      return;
    }

    const selectedOption = options.find((option) => option.id === value);
    if (selectedOption) {
      setSelectedLabel(getOptionLabel(selectedOption));
    }
  }, [value, options]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (readOnly) return;

    const timer = setTimeout(() => {
      if (searchType === "DNI") {
        onSearch({
          dni: dniSearch.trim(),
          firstname: "",
          lastname: "",
        });
        return;
      }

      onSearch({
        dni: "",
        firstname: firstnameSearch.trim(),
        lastname: lastnameSearch.trim(),
      });
    }, 350);

    return () => clearTimeout(timer);
  }, [
    dniSearch,
    firstnameSearch,
    lastnameSearch,
    onSearch,
    readOnly,
    searchType,
  ]);

  const handleSearchTypeChange = (nextSearchType: PatientSearchType) => {
    setSearchType(nextSearchType);
    setDniSearch("");
    setFirstnameSearch("");
    setLastnameSearch("");
    setIsOpen(false);
    onSearch({ dni: "", firstname: "", lastname: "" });
  };

  const handleDniChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDniSearch(event.target.value.replace(/\D/g, "").slice(0, 8));
    setIsOpen(true);
  };

  const handleOptionSelect = (patient: PatientOption) => {
    onValueChange(patient.id);
    setSelectedLabel(getOptionLabel(patient));
    setIsOpen(false);
    setDniSearch("");
    setFirstnameSearch("");
    setLastnameSearch("");
    onSearch({ dni: "", firstname: "", lastname: "" });
  };

  if (readOnly) {
    return (
      <div className="grid gap-2 my-2 w-full max-w-md">
        <Label className="font-normal">{label}</Label>
        <div className="p-2 border rounded-md bg-gray-50">
          {selectedLabel || "No seleccionado"}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-2 my-2 w-full max-w-md" ref={containerRef}>
      <Label className="font-normal" htmlFor={id}>
        {label}
      </Label>

      {selectedLabel && (
        <div className="rounded-md border bg-gray-50 px-3 py-2 text-sm text-muted-foreground">
          Seleccionado: {selectedLabel}
        </div>
      )}

      <div className="relative grid gap-2">
        <Select
          value={searchType}
          onValueChange={(nextSearchType) =>
            handleSearchTypeChange(nextSearchType as PatientSearchType)
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DNI">DNI</SelectItem>
            <SelectItem value="NAME_SURNAME">Nombre y Apellido</SelectItem>
          </SelectContent>
        </Select>

        {searchType === "DNI" ? (
          <Input
            id={id}
            value={dniSearch}
            onChange={handleDniChange}
            onFocus={() => setIsOpen(true)}
            placeholder="Buscar por DNI..."
            inputMode="numeric"
            maxLength={8}
            autoComplete="off"
          />
        ) : (
          <div className="grid gap-2 md:grid-cols-2">
            <Input
              id={`${id}-firstname`}
              value={firstnameSearch}
              onChange={(event) => {
                setFirstnameSearch(event.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder="Nombre"
              maxLength={40}
              autoComplete="off"
            />
            <Input
              id={`${id}-lastname`}
              value={lastnameSearch}
              onChange={(event) => {
                setLastnameSearch(event.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder="Apellido"
              maxLength={40}
              autoComplete="off"
            />
          </div>
        )}

        {isOpen && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-md border border-gray-300 bg-white shadow-lg">
            {loading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-gray-500">Buscando...</span>
              </div>
            ) : options.length > 0 ? (
              <div className="py-1">
                {options.map((patient) => (
                  <div
                    key={patient.id}
                    className="flex cursor-pointer items-center px-3 py-2 text-sm hover:bg-gray-100"
                    onClick={() => handleOptionSelect(patient)}
                  >
                    <span className="flex-1">{getOptionLabel(patient)}</span>
                  </div>
                ))}
              </div>
            ) : hasSearch ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                No se encontraron pacientes
              </div>
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500">
                Ingrese datos para buscar
              </div>
            )}
          </div>
        )}
      </div>

      <Label
        className={`font-light ${error ? "text-red-500" : "text-slate-400"}`}
        htmlFor={id}
      >
        {error || helper}
      </Label>
    </div>
  );
};
