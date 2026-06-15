import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppointmentBaseForm } from "../components/AppointmentBaseForm";
import {
  appointmentFormSchema,
  type AppointmentFormSchema,
} from "@/shared/interfaces/forms/AppointmentFormSchema";
import { Loading } from "@/shared/components/Loading";
import { useGetAppointmentById } from "../hooks/useAppointmentQueries";
import { useAlert } from "@/shared/hooks/useAlert";
import { useUpdateAppointmentStatus } from "../hooks/useAppointmentMutations";

export const ViewAppointment = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const { mutate: updateAppointmentStatus } = useUpdateAppointmentStatus();

  const form = useForm<AppointmentFormSchema>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      patientId: "",
      date: "",
      startTime: "",
      endTime: "",
      psychologistId: "",
      officeId: "",
      reason: "",
      typeId: "",
    },
  });

  const { data: appointmentData, isLoading: loading } =
    useGetAppointmentById(id);

  // Cargar datos de la cita
  useEffect(() => {
    if (appointmentData) {
      console.log("data", appointmentData)
      const startDateLocal = new Date(
        new Date(appointmentData.startDate).getTime()
      );
      const endDateLocal = new Date(
        new Date(appointmentData.endDate).getTime()
      );

      const formatDateForView = (date: Date) => {
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      };

      form.reset({
        patientId: appointmentData.patient.id,
        date: formatDateForView(startDateLocal),
        startTime: startDateLocal.toTimeString().slice(0, 5),
        endTime: endDateLocal.toTimeString().slice(0, 5),
        psychologistId: appointmentData.user.id,
        officeId: appointmentData.office.id,
        reason: appointmentData.reason,
        typeId: appointmentData.type,
      });
    }
  }, [appointmentData, form]);

  const handleEdit = () => {
    // Navegar a la página de edición
    navigate(`/appointment/${id}/edit`);
  };

  const handleDisable = async () => {
    if (!appointmentData) return;
    try {
      await updateAppointmentStatus({
        id: appointmentData.id,
        status: "CANCELED",
      });

      showAlert("Cita cancelada", "success");
    } catch (error) {
      console.error("Error updating appointment status:", error);
      showAlert("Error al actualizar el estado de la cita", "error");
    }
  };

  const handleCancel = () => {
    // Volver a la lista de citas
    navigate("/appointments");
  };

  // No se implementa handleSave porque no se puede guardar en modo view
  const handleSave = () => {
    // No hacer nada - este componente es solo para vista
  };

  if (loading) {
    return <Loading message="Cargando cita..." />;
  }

  if (!appointmentData) {
    return <div>Cita no encontrada</div>;
  }

  return (
    <div>
      <AppointmentBaseForm
        mode="view" // Siempre en modo view
        form={form}
        onSave={handleSave} // No hace nada
        onCancel={handleCancel}
        onDisable={handleDisable}
        onEdit={handleEdit} // Navega a página de edición
        loading={loading}
        // Props para búsquedas (no activas en modo view)
        onPatientSearch={() => {}} // No funcional en modo view
        onPsychologistSearch={() => {}}
        onOfficeSearch={() => {}}
        // Opciones pre-cargadas para mostrar
        patientOptions={[
          {
            id: appointmentData.patient.id,
            name: `${appointmentData.patient.firstName} ${appointmentData.patient.lastName}`,
            dni: appointmentData.patient.dni,
          },
        ]}
        psychologistOptions={[
          {
            id: appointmentData.user.id,
            firstName: appointmentData.user.firstName,
            lastName: appointmentData.user.lastName,
            dni: appointmentData.user.dni,
          },
        ]}
        officeOptions={[
          {
            id: appointmentData.office.id,
            name: appointmentData.office.name,
            location: appointmentData.office.location.name,
          },
        ]}
        assignedOffice={{
          id: appointmentData.office.id,
          name: appointmentData.office.name,
          location: appointmentData.office.location.address,
        }}
        // Estados de carga
        patientSearchLoading={false}
        psychologistSearchLoading={false}
        officeSearchLoading={false}
        // Datos adicionales
        appointmentStatus={appointmentData.status}
      />
    </div>
  );
};
