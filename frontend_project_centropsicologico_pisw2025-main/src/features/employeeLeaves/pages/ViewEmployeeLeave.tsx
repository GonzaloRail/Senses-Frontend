import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EmployeeLeaveBaseForm } from "../components/EmployeeLeaveBaseForm";
import {
  employeeLeaveFormSchema,
  type EmployeeLeaveFormSchema,
} from "@/shared/interfaces/forms/EmployeeLeaveFormSchema";
import { Loading } from "@/shared/components/Loading";
import { useGetEmployeeLeaveById } from "../hooks/useEmployeeLeaveQueries";
import { useAlert } from "@/shared/hooks/useAlert";
import { useUpdateEmployeeLeaveStatus } from "../hooks/useEmployeeLeaveMutations";

export const ViewEmployeeLeave = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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

  const { data: employeeLeaveData, isLoading: loading } =
    useGetEmployeeLeaveById(id);

  const { mutate: updateEmployeeLeaveStatus } = useUpdateEmployeeLeaveStatus();

  // Cargar datos del permiso
  useEffect(() => {
    if (employeeLeaveData) {
      const startDateLocal = new Date(employeeLeaveData.startDate);
      const endDateLocal = new Date(employeeLeaveData.endDate);

      const formatDateForView = (date: Date) => {
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      };

      form.reset({
        userId: employeeLeaveData.user.id,
        startDate: formatDateForView(startDateLocal),
        endDate: formatDateForView(endDateLocal),
        reason: employeeLeaveData.reason || "",
      });
    }
  }, [employeeLeaveData, form]);

  const handleEdit = () => {
    // Navegar a la página de edición
    navigate(`/employee-leave/${id}/edit`);
  };

  const handleDisable = () => {
    if (!employeeLeaveData) return;

    updateEmployeeLeaveStatus(
      {
        id: employeeLeaveData.id,
        isActive: false,
      },
      {
        onSuccess: () => {
          showAlert("Permiso cancelado", "success");
        },
        onError: () => {
          showAlert("Error al cancelar el permiso", "error");
        },
      }
    );
  };

  const handleCancel = () => {
    // Volver a la lista de permisos
    navigate("/employee-leaves");
  };

  // No se implementa handleSave porque no se puede guardar en modo view
  const handleSave = () => {
    // No hacer nada - este componente es solo para vista
  };

  if (loading) {
    return <Loading message="Cargando permiso..." />;
  }

  if (!employeeLeaveData) {
    return <div>Permiso no encontrado</div>;
  }

  return (
    <div>
      <EmployeeLeaveBaseForm
        mode="view"
        form={form}
        onSave={handleSave}
        onCancel={handleCancel}
        onDisable={handleDisable}
        onEdit={handleEdit}
        loading={loading}
        // Opciones pre-cargadas para mostrar
        onUsersSearch={() => {}}
        usersOptions={[
          {
            id: employeeLeaveData.user.id,
            firstName: employeeLeaveData.user.firstName,
            lastName: employeeLeaveData.user.lastName,
            dni: employeeLeaveData.user.dni,
          },
        ]}
        // Estados de carga
        usersSearchLoading={false}
        // Estado del permiso
        isActive={employeeLeaveData.isActive}
      />
    </div>
  );
};
