import { useNavigate } from "react-router";
import { SiteHeader } from "@/shared/components/SiteHeader";
import { IngresoForm } from "../components/IngresoForm";
import { useCreateIngreso } from "../hooks/useIngresosMutations";
import type { CreateIncomeReceiptInput } from "@/shared/interfaces/models/IncomeReceipt";
import { toast } from "sonner";

export const CreateIngreso = () => {
  const navigate = useNavigate();
  const createMutation = useCreateIngreso();

  const handleSubmit = (data: CreateIncomeReceiptInput) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        toast.success("Ingreso registrado correctamente");
        navigate("/ingresos");
      },
      onError: () => {
        toast.error("Error al registrar el ingreso");
      },
    });
  };

  const handleCancel = () => {
    navigate("/ingresos");
  };

  return (
    <>
      <SiteHeader title="Nuevo ingreso" backButton onBackButtonClick={() => navigate("/ingresos")} />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <IngresoForm
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isPending={createMutation.isPending}
            />
          </div>
        </div>
      </div>
    </>
  );
};
