import { useState } from "react";
import { useNavigate } from "react-router";
import { SiteHeader } from "@/shared/components/SiteHeader";
import { IngresoForm } from "../components/IngresoForm";
import { ReceiptPreviewModal } from "../components/ReceiptPreviewModal";
import { useCreateIngreso } from "../hooks/useIngresosMutations";
import { toast } from "sonner";
import type { CreateIncomePayload, IncomeReceipt } from "@/shared/interfaces/models/IncomeReceipt";

export const CreateIngreso = () => {
  const navigate = useNavigate();
  const createMutation = useCreateIngreso();
  const [createdReceipt, setCreatedReceipt] = useState<IncomeReceipt | null>(null);
  const [receiptExtra, setReceiptExtra] = useState<{ serviceDescription?: string }>({});

  const handleSubmit = (data: CreateIncomePayload) => {
    const { attentionType, serviceDescription, psychologistName, ...payload } = data;
    setReceiptExtra({ serviceDescription });

    createMutation.mutate(payload, {
      onSuccess: (receipt: IncomeReceipt) => {
        setCreatedReceipt(receipt);
        toast.success("Ingreso registrado correctamente");
      },
      onError: (error: any) => {
        const msg = error?.response?.data?.message || error?.message || "Error al registrar el ingreso";
        toast.error(msg);
      },
    });
  };

  const handleCloseReceipt = () => {
    setCreatedReceipt(null);
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
              onCancel={() => navigate("/ingresos")}
              isPending={createMutation.isPending}
            />
          </div>
        </div>
      </div>

      <ReceiptPreviewModal
        receipt={createdReceipt}
        serviceDescription={receiptExtra.serviceDescription}
        open={!!createdReceipt}
        onClose={handleCloseReceipt}
      />
    </>
  );
};
