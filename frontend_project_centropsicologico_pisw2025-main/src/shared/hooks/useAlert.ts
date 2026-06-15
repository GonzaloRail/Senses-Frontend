import { toast } from "sonner";

export const useAlert = () => {
  const showAlert = (
    message: string,
    type: "error" | "warning" | "info" | "success"
  ) => {
    switch (type) {
      case "error":
        toast.error(message, {
          position: "top-right",
          duration: 5000,
          style: {
            background: "#FEE2E2",
            border: "1px solid #EF4444",
            color: "#991B1B",
          },
        });
        break;
      case "warning":
        toast.warning(message, {
          position: "top-right",
          duration: 5000,
          style: {
            background: "#FEF3C7",
            border: "1px solid #F59E0B",
            color: "#92400E",
          },
        });
        break;
      case "info":
        toast.info(message, {
          position: "top-right",
          duration: 5000,
          style: {
            background: "#DBEAFE",
            border: "1px solid #3B82F6",
            color: "#1E40AF",
          },
        });
        break;
      case "success":
        toast.success(message, {
          position: "top-right",
          duration: 5000,
          style: {
            background: "#D1FAE5",
            border: "1px solid #10B981",
            color: "#065F46",
          },
        });
        break;
    }
  };

  return { showAlert };
};
