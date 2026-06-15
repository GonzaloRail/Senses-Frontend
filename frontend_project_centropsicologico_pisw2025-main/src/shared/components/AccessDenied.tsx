import { useAuth } from "@/store/auth/auth.store";
import { Link, useNavigate } from "react-router-dom";

export const AccessDenied = () => {
  const navigate = useNavigate();
  const clearAuth = useAuth((state) => state.clearAuth);

  const logout = () => {
    clearAuth();
    navigate("/auth");
  };

  return (
    <div className="bg-gray-100">
      <div className="mx-10 flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-3xl font-bold text-red-600 mb-4">
          Acceso denegado
        </h1>
        <p className="mb-6 text-gray-700">
          No tienes permisos para ver esta página.
        </p>
        <Link
          to="/"
          className="px-4 py-2 bg-primary text-white rounded transition"
        >
          Volver al inicio
        </Link>
        <button
          onClick={logout}
          className="px-4 py-2 bg-red-600 text-white rounded transition cursor-pointer hover:bg-red-700"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
};
