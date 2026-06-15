import { useAuth } from "@/store/auth/auth.store";
import { Link, useNavigate } from "react-router";

export const NotFound = () => {
  const navigate = useNavigate();
  const clearAuth = useAuth((state) => state.clearAuth);

  const logout = () => {
    clearAuth();
    navigate("/auth");
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50">
        <div
          role="button"
          tabIndex={0}
          onClick={logout}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") logout();
          }}
          className="max-w-xs sm:max-w-md px-3 py-2 text-yellow-800 rounded shadow cursor-pointer select-none
               flex items-center gap-2 text-xs sm:text-sm"
        >
          <span className="truncate">
            ¿Tienes problemas? Vuelve a{" "}
            <span className="font-semibold underline">iniciar sesión</span>.
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <h1 className="text-5xl font-bold text-blue-700 mb-4">404</h1>
        <p className="mb-6 text-gray-700 text-lg">Página no encontrada</p>
        <Link
          to="/"
          className="px-4 py-2 bg-primary text-white rounded transition"
        >
          Volver al inicio
        </Link>
      </div>
    </>
  );
};
