import { useAuth } from "@/store/auth/auth.store";
import { Navigate, Outlet } from "react-router";

interface ProtectedRouteProps {
  allowedRoles: string[];
}

export const ProtectedRoute = ( {allowedRoles} : ProtectedRouteProps) => {
  const user = useAuth((state) => state.user)
  const roleSelected = useAuth((state) => state.roleSelected)

  // Si hay usuario autenticado o no tiene el rol requerido
  if (!user || !roleSelected || !allowedRoles.includes(roleSelected)) {
    return <Navigate to="/access-denied" replace />;
  }
  
  return <Outlet />; // Renderiza los componentes hijos si el usuario tiene el rol permitido
}
