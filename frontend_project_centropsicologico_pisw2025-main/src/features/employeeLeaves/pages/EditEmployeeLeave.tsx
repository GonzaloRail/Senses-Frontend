import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EmployeeLeaveBaseForm } from "../components/EmployeeLeaveBaseForm";
import {
  employeeLeaveFormSchema,
  type EmployeeLeaveFormSchema,
} from "@/shared/interfaces/forms/EmployeeLeaveFormSchema";
import { useAlert } from "@/shared/hooks/useAlert";
import { Loading } from "@/shared/components/Loading";
import { useGetEmployeeLeaveById } from "../hooks/useEmployeeLeaveQueries";
import { useUpdateEmployeeLeave } from "../hooks/useEmployeeLeaveMutations";

export const EditEmployeeLeave = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { showAlert } = useAlert();
  const updateEmployeeLeave = useUpdateEmployeeLeave();

  const form = useForm<EmployeeLeaveFormSchema>({
    resolver: zodResolver(employeeLeaveFormSchema),
    defaultValues: {
      userId: "",
      startDate: "",
      endDate: "",
      reason: "",
    },
  });

  const { data: employeeLeaveData, isLoading: employeeLeaveLoading } =
    useGetEmployeeLeaveById(id);

  // Cargar datos iniciales del permiso
  useEffect(() => {
    if (employeeLeaveData) {
      const startDateLocal = new Date(employeeLeaveData.startDate);
      const endDateLocal = new Date(employeeLeaveData.endDate);

      const formatDateForInput = (date: Date) => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      form.reset({
        userId: employeeLeaveData.user.id,
        startDate: formatDateForInput(startDateLocal),
        endDate: formatDateForInput(endDateLocal),
        reason: employeeLeaveData.reason || "",
      });
    }
  }, [employeeLeaveData, form]);

  const handleSave = async (data: EmployeeLeaveFormSchema) => {
    if (!employeeLeaveData) return;

    setLoading(true);
    // Convertir fechas correctamente en zona horaria local
    const [startYear, startMonth, startDay] = data.startDate
      .split("-")
      .map(Number);
    const startDate = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);

    const [endYear, endMonth, endDay] = data.endDate.split("-").map(Number);
    const endDate = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);

    const updateData = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      reason: data.reason || "",
    };

    console.log("Updating employee leave with data:", updateData);
    updateEmployeeLeave.mutate(
      {
        id: employeeLeaveData.id,
        employeeLeaveToUpdate: updateData,
      },
      {
        onSuccess: () => {
          showAlert("El permiso ha sido actualizado correctamente", "success");
          navigate(`/employee-leave/${employeeLeaveData.id}`);
          setLoading(false);
        },
        onError: (error) => {
          console.error("Error updating employee leave:", error);
          showAlert("Error al actualizar el permiso", "error");
        },
      }
    );
  };

  const handleCancel = () => {
    navigate(`/employee-leave/${id}`);
  };

  if (employeeLeaveLoading || loading) {
    return (
      <Loading
        message={
          employeeLeaveLoading
            ? "Cargando permiso..."
            : "Actualizando permiso..."
        }
      />
    );
  }

  if (!employeeLeaveData) {
    return <div>Permiso no encontrado</div>;
  }

  return (
    <div>
      <EmployeeLeaveBaseForm
        mode="edit"
        form={form}
        onSave={form.handleSubmit(handleSave)}
        onCancel={handleCancel}
        loading={loading}
        // Search handlers
        onUsersSearch={() => {}} // Psicólogo no es editable
        // Search options
        usersOptions={[
          {
            id: employeeLeaveData.user.id,
            firstName: employeeLeaveData.user.firstName,
            lastName: employeeLeaveData.user.lastName,
            dni: employeeLeaveData.user.dni,
          },
        ]} // Solo el psicólogo actual (no editable)
        // Loading states
        usersSearchLoading={false} // No hay búsqueda de psicólogos
      />
    </div>
  );
};
