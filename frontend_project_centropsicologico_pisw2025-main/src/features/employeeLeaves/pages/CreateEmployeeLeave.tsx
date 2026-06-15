import { useState } from "react";
import {
  EmployeeLeaveBaseForm,
  type FormMode,
} from "../components/EmployeeLeaveBaseForm";
import { useForm } from "react-hook-form";
import {
  employeeLeaveFormSchema,
  type EmployeeLeaveFormSchema,
} from "@/shared/interfaces/forms/EmployeeLeaveFormSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePsychologistSearchByNameQuery } from "@/features/systemUsers/hooks";
import { useNavigate } from "react-router";
import { useAlert } from "@/shared/hooks/useAlert";
import { Loading } from "@/shared/components/Loading";
import { useCreateEmployeeLeave } from "../hooks/useEmployeeLeaveMutations";

export const CreateEmployeeLeave = () => {
  const navigate = useNavigate();
  const [mode] = useState<FormMode>("create");
  const [loading, setLoading] = useState(false);
  const { showAlert } = useAlert();

  const form = useForm<EmployeeLeaveFormSchema>({
    resolver: zodResolver(employeeLeaveFormSchema),
    defaultValues: {
      userId: "",
      startDate: "",
      endDate: "",
      reason: "",
    },
  });

  const psychologistSearch = usePsychologistSearchByNameQuery();
  const createEmployeeLeaveMutation = useCreateEmployeeLeave();

  const handleSave = async (data: EmployeeLeaveFormSchema) => {
    setLoading(true);
    try {
      // Convertir fechas a ISO string (inicio del día y fin del día)
      const [startYear, startMonth, startDay] = data.startDate
        .split("-")
        .map(Number);
      const startDate = new Date(
        startYear,
        startMonth - 1,
        startDay,
        0,
        0,
        0,
        0
      );

      const [endYear, endMonth, endDay] = data.endDate.split("-").map(Number);
      const endDate = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);

      const employeeLeaveData = {
        userId: data.userId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        reason: data.reason || "",
      };

      console.log("Sending employee leave data:", employeeLeaveData);

      createEmployeeLeaveMutation.mutate(employeeLeaveData, {
        onSuccess: () => {
          showAlert("El permiso ha sido creado correctamente", "success");
          navigate("/employee-leaves");
        }
      });
    } catch (error) {
      console.error("Error creating employee leave:", error);
      showAlert(
        "No se pudo crear el permiso. Por favor, intente nuevamente.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/employee-leaves");
  };

  if (loading) {
    return <Loading message="Creando permiso..." />;
  }

  return (
    <div>
      <EmployeeLeaveBaseForm
        mode={mode}
        form={form}
        onSave={form.handleSubmit(handleSave)}
        onCancel={handleCancel}
        loading={loading || createEmployeeLeaveMutation.isPending}
        // Search handlers
        onUsersSearch={psychologistSearch.setSearchQuery}
        // Search options
        usersOptions={psychologistSearch.psychologists}
        // Loading states for searches
        usersSearchLoading={psychologistSearch.isLoading}
      />
    </div>
  );
};