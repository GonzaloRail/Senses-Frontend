import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/store/auth/auth.store";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useSelectRoleAndLocationMutation } from "../hooks";

const rolesName = {
  ADMISSION: "Admisión",
  PSYCHOLOGIST: "Psicólogo",
  ADMIN: "Gerente",
  INTERNAL: "Interno",
};

export const SelectRolePage = () => {
  const [selectedRole, setSelectedRole] = useState("");

  const user = useAuth((state) => state.user);
  const isAuthBootstrapped = useAuth((state) => state.isAuthBootstrapped);
  const clearAuth = useAuth((state) => state.clearAuth);

  const navigate = useNavigate();
  
  const selectAndLocation = useSelectRoleAndLocationMutation();
  
  const accessToken = useAuth((state) => state.accessToken);
  const roleSelected = useAuth((state) => state.roleSelected);

  useEffect(() => {
    if (accessToken && roleSelected) {
      navigate("/");
    }
    if (isAuthBootstrapped && !accessToken) {
      navigate("/auth", { replace: true });
    }
  }, [accessToken, navigate, roleSelected, isAuthBootstrapped]);

  if (!isAuthBootstrapped) {
    console.log("SelectRolePage - Showing spinner");
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-senses-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  const userRoles = (user?.roles ?? []).map((role) => ({
    id: String(role.role.id),
    name: rolesName[role.role.name],
  })).filter(role => role.name !== rolesName.INTERNAL);
  
  // Verificar si ambos campos están seleccionados
  const isFormComplete = selectedRole;

  const handleEnter = () => {
    if (isFormComplete) {
      const data = {
        roleId: selectedRole,
      };
      console.log("Rol seleccionado:", selectedRole);
      selectAndLocation.mutate(data, {
        onSuccess: () => {
          console.log("Rol seleccionado correctamente");
          navigate("/");
        },
      });
    }
  };

  const handleBackToLogin = async () => {
    try {
      clearAuth();
    } catch (error) {
      console.error("Logout fallo:", error);
    } finally {
      navigate("/auth");
    }
  };
  return (
    <div className="flex flex-col items-center justify-center">
      <h1 className="scroll-m-20 text-3xl font-bold tracking-tight mb-10 lg:text-4xl text-senses-primary text-center">
        Seleccione su rol
      </h1>
      <div className="flex justify-between gap-2 mb-20 lg:gap-5 lg:mb-30">
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-full lg:w-[180px]">
            <SelectValue placeholder="Seleccione su rol" />
          </SelectTrigger>
          <SelectContent>
            {userRoles?.map((role) => (
              <SelectItem key={role.id} value={role.id}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={handleEnter}
          disabled={!isFormComplete}
          className={!isFormComplete ? "opacity-50 cursor-not-allowed" : ""}
        >
          Ingresar
        </Button>
        <Button variant="outline" onClick={handleBackToLogin}>
          Cambiar usuario
        </Button>
      </div>
    </div>
  );
};
