import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PatientSearchType = "DNI" | "NAME_SURNAME";

export interface PatientTableFilters {
  dni: string;
  firstname: string;
  lastname: string;
}

interface PatientTableSearchProps {
  onFiltersChange: (filters: PatientTableFilters) => void;
}

const emptyFilters: PatientTableFilters = {
  dni: "",
  firstname: "",
  lastname: "",
};

export const PatientTableSearch = ({ onFiltersChange }: PatientTableSearchProps) => {
  const [searchType, setSearchType] = useState<PatientSearchType>("DNI");
  const [dniSearch, setDniSearch] = useState("");
  const [nameSearch, setNameSearch] = useState("");
  const [lastNameSearch, setLastNameSearch] = useState("");

  const buildFilters = (): PatientTableFilters => {
    if (searchType === "DNI") {
      return {
        dni: dniSearch.trim(),
        firstname: "",
        lastname: "",
      };
    }

    return {
      dni: "",
      firstname: nameSearch.trim(),
      lastname: lastNameSearch.trim(),
    };
  };

  const handleSearch = () => {
    onFiltersChange(buildFilters());
  };

  const handleSearchTypeChange = (value: PatientSearchType) => {
    setSearchType(value);
    setDniSearch("");
    setNameSearch("");
    setLastNameSearch("");
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange(buildFilters());
    }, 350);

    return () => clearTimeout(timer);
  }, [searchType, dniSearch, nameSearch, lastNameSearch]);

  return (
    <div className="px-4 lg:px-6">
      <div className="flex justify-end">
        <div className="flex w-full max-w-4xl items-center gap-2">
          <Select
            value={searchType}
            onValueChange={(value) => handleSearchTypeChange(value as PatientSearchType)}
          >
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DNI">DNI</SelectItem>
              <SelectItem value="NAME_SURNAME">Nombre y Apellido</SelectItem>
            </SelectContent>
          </Select>

          {searchType === "DNI" ? (
            <Input
              value={dniSearch}
              onChange={(event) => setDniSearch(event.target.value.replace(/\D/g, "").slice(0, 8))}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleSearch();
                }
              }}
              placeholder="Buscar por DNI..."
              maxLength={8}
              className="w-full"
            />
          ) : (
            <>
              <Input
                value={nameSearch}
                onChange={(event) => setNameSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleSearch();
                  }
                }}
                placeholder="Nombre"
                maxLength={40}
                className="w-full"
              />
              <Input
                value={lastNameSearch}
                onChange={(event) => setLastNameSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleSearch();
                  }
                }}
                placeholder="Apellido"
                maxLength={40}
                className="w-full"
              />
            </>
          )}

          <Button type="button" onClick={handleSearch}>
            Buscar
          </Button>
        </div>
      </div>
    </div>
  );
};

export const arePatientTableFiltersEqual = (
  first: PatientTableFilters,
  second: PatientTableFilters
) =>
  first.dni === second.dni &&
  first.firstname === second.firstname &&
  first.lastname === second.lastname;

export const getEmptyPatientTableFilters = () => emptyFilters;
