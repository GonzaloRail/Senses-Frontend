import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface ApiError {
  status: "error";
  message: string;
  statusCode?: number;
  errors?: unknown;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
  mutationCache: new MutationCache({
    onError: (error) => {
      const message = getErrorMessage(error);
      toast.error(message, {
        position: "top-right",
        duration: 5000,
        style: {
          background: "#FEE2E2",
          border: "1px solid #EF4444",
          color: "#991B1B",
        },
      });
    },
  }),
  queryCache: new QueryCache({
    onError: (error) => {
      const message = getErrorMessage(error);
      toast.error(message, {
        position: "top-right",
        duration: 5000,
        style: {
          background: "#FEE2E2",
          border: "1px solid #EF4444",
          color: "#991B1B",
        },
      });
    },
  }),
});

// Función helper para extraer mensaje de error
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    // Si es una respuesta de tu API
    if ("response" in error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const apiError = (error as any).response?.data as ApiError;
      return apiError?.message || "Error en la petición";
    }
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Ha ocurrido un error inesperado";
};
