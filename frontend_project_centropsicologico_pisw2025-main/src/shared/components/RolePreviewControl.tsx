import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/store/auth/auth.store";

const previewRoles = {
  CASHIER: "Caja y Registro",
  HR: "Recursos Humanos",
} as const;

export const RolePreviewControl = () => {
  const roleSelected = useAuth((state) => state.roleSelected);
  const previewRole = useAuth((state) => state.previewRole);
  const roleBeforePreview = useAuth((state) => state.roleBeforePreview);
  const setRolePreview = useAuth((state) => state.setRolePreview);
  const clearRolePreview = useAuth((state) => state.clearRolePreview);

  const canPreview =
    import.meta.env.DEV &&
    (roleSelected === "ADMIN" || roleBeforePreview === "ADMIN");

  if (!canPreview) return null;

  return (
    <div className="mx-2 mb-3 rounded-md border border-amber-300 bg-amber-50 p-2 text-slate-800">
      <p className="mb-1 text-xs font-semibold">Vista previa de rol</p>
      <Select
        value={previewRole ?? "ADMIN"}
        onValueChange={(role) => {
          if (role === "ADMIN") clearRolePreview();
          else setRolePreview(role as keyof typeof previewRoles);
        }}
      >
        <SelectTrigger className="h-8 bg-white text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ADMIN">Rol real: Gerencia</SelectItem>
          {Object.entries(previewRoles).map(([role, label]) => (
            <SelectItem key={role} value={role}>
              Vista previa: {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {previewRole && (
        <Button
          type="button"
          variant="link"
          className="mt-1 h-auto p-0 text-xs text-slate-700"
          onClick={clearRolePreview}
        >
          Restaurar Gerencia
        </Button>
      )}
    </div>
  );
};
