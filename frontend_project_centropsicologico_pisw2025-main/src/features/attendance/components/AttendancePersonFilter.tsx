import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useUsersSearchQuery } from "@/features/systemUsers/hooks/useSystemUsersQueries";

export function AttendancePersonFilter({ value, onChange, required = false }: {
  value: string;
  onChange: (id: string) => void;
  required?: boolean;
}) {
  const [search, setSearchInput] = useState("");
  const { users, setSearch, isLoading, error } = useUsersSearchQuery();
  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search, setSearch]);
  return (
    <div className="space-y-2">
      <Label className="flex-col items-start">Buscar persona
        <Input value={search} onChange={(event) => {
          setSearchInput(event.target.value);
          onChange("");
        }} placeholder="Nombre o apellido" />
      </Label>
      <Label className="flex-col items-start">Persona
        <select className="h-9 w-full rounded-md border bg-background px-2" value={value} required={required} onChange={(event) => onChange(event.target.value)}>
          <option value="">{required ? "Seleccionar persona" : "Todas las personas"}</option>
          {users.map((user) => <option key={user.id} value={user.id}>{user.firstName} {user.lastName} · {user.dni}</option>)}
        </select>
      </Label>
      {isLoading && <p className="text-sm">Buscando personas…</p>}
      {error && <p role="alert" className="text-sm text-destructive">No se pudo buscar al personal.</p>}
    </div>
  );
}
