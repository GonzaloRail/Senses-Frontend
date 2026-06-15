import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppointmentBaseForm } from "../components/AppointmentBaseForm";
import {
  appointmentFormSchema,
  type AppointmentFormSchema,
} from "@/shared/interfaces/forms/AppointmentFormSchema";
import { usePsychologistSearchByNameQuery } from "@/features/systemUsers/hooks";
import { useOfficeSearchQuery } from "@/features/offices/hooks/useOfficesQueries";
import { useAlert } from "@/shared/hooks/useAlert";
import { Loading } from "@/shared/components/Loading";
import { useGetAppointmentById } from "../hooks/useAppointmentQueries";
import { useUpdateAppointment } from "../hooks/useAppointmentMutations";
import type { User } from "@/shared/interfaces/models";
import { getOfficeByIdApi } from "@/features/offices/api/officesApi";

export const EditAppointment = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { showAlert } = useAlert();
  const updateAppointment = useUpdateAppointment();

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

  const { data: appointmentData, isLoading: appointmentLoading } =
    useGetAppointmentById(id);
  const psychologistSearch = usePsychologistSearchByNameQuery();
  const officeSearch = useOfficeSearchQuery();
  // const updateAppointmentMutation = useUpdateAppointment();

  const [assignedOffice, setAssignedOffice] = useState<{
    id: string;
    name: string;
    location?: string;
  } | null>(null);
  const [selectedPsychologist, setSelectedPsychologist] =
    useState<Partial<User> | null>(null);

  // Cargar datos iniciales de la cita
  useEffect(() => {
    if (appointmentData) {
      const startDateLocal = new Date(
        new Date(appointmentData.startDate).getTime()
      );
      const endDateLocal = new Date(
        new Date(appointmentData.endDate).getTime()
      );

      setSelectedPsychologist(appointmentData.user);

      form.reset({
        patientId: appointmentData.patient.id,
        date: startDateLocal.toISOString().split("T")[0],
        startTime: startDateLocal.toTimeString().slice(0, 5),
        endTime: endDateLocal.toTimeString().slice(0, 5),
        psychologistId: appointmentData.user.id,
        officeId: appointmentData.office.id,
        reason: appointmentData.reason,
        typeId: appointmentData.type,
      });
    }
  }, [appointmentData, form]);

  const getDayOfWeek = (dateString: string): string => {
    const date = new Date(`${dateString}T00:00`);
    const days = [
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
    ];
    return days[date.getDay()];
  };

  // Determinar office automáticamente a partir del schedule (mismo patrón que Create)
  const date = form.watch("date");
  const startTime = form.watch("startTime");
  const endTime = form.watch("endTime");
  const psychologistId = form.watch("psychologistId");

  const getOfficeFromSchedule = useCallback(() => {
    if (!psychologistId || !date || !startTime || !selectedPsychologist) {
      form.setValue("officeId", "");
      setAssignedOffice(null);
      return;
    }

    const dayOfWeek = getDayOfWeek(date);

    const schedule = selectedPsychologist.workSchedule?.find((s: any) => {
      return (s.day || s.dayOfWeek)?.toString().toUpperCase() === dayOfWeek;
    });

    if (!schedule) {
      form.setValue("officeId", "");
      setAssignedOffice(null);
      return;
    }

    const extractTime = (isoTime: string): string => isoTime.split("T")[1].substring(0, 5);

    const scheduleStart = extractTime(schedule.startTime);
    const scheduleEnd = extractTime(schedule.endTime);
    const isTimeInRange = endTime > startTime && startTime >= scheduleStart && endTime <= scheduleEnd;

    if (isTimeInRange && schedule.officeId) {
      const requestedOfficeId = schedule.officeId;
      form.setValue("officeId", requestedOfficeId);
      setAssignedOffice(null);
      (async () => {
        try {
          const office = await getOfficeByIdApi(requestedOfficeId);
          if (form.getValues("officeId") === requestedOfficeId) {
            setAssignedOffice({
              id: office.id,
              name: office.name,
              location: office.location?.address,
            });
          }
        } catch (err) {
          console.error("Error fetching office by id:", err);
          if (form.getValues("officeId") === requestedOfficeId) setAssignedOffice(null);
        }
      })();
    } else {
      form.setValue("officeId", "");
      setAssignedOffice(null);
    }
  }, [psychologistId, date, startTime, endTime, selectedPsychologist, form]);

  // actualizar selectedPsychologist cuando cambie psychologistId
  useEffect(() => {
    if (psychologistId) {
      const p = psychologistSearch.psychologists.find((p) => p.id === psychologistId);
      setSelectedPsychologist(p || null);
    } else {
      setSelectedPsychologist(null);
    }
  }, [psychologistId, psychologistSearch.psychologists]);

  useEffect(() => {
    getOfficeFromSchedule();
  }, [getOfficeFromSchedule]);

  const handleSave = async (data: AppointmentFormSchema) => {
    if (!appointmentData) return;
    setLoading(true);
    try {
      const startDateTime = new Date(`${data.date}T${data.startTime}`);
      const endDateTime = new Date(`${data.date}T${data.endTime}`);

      const updateData = {
        patientId: data.patientId,
        psychologistId: data.psychologistId,
        officeId: data.officeId,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        reason: data.reason,
        type: data.typeId,
      };

      updateAppointment.mutate({
        id: appointmentData.id,
        appointmentToUpdate: updateData,
      });

      showAlert("La cita ha sido actualizada correctamente", "success");
      navigate(`/appointment/${appointmentData.id}`);
    } catch (error) {
      console.error("Error updating appointment:", error);
      showAlert("Error al actualizar la cita", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/appointment/${id}`);
  };

  if (appointmentLoading || loading) {
    return (
      <Loading
        message={
          appointmentLoading ? "Cargando cita..." : "Actualizando cita..."
        }
      />
    );
  }

  if (!appointmentData) {
    return <div>Cita no encontrada</div>;
  }

  return (
    <div>
      <AppointmentBaseForm
        mode="edit"
        form={form}
        onSave={form.handleSubmit(handleSave)}
        onCancel={handleCancel}
        loading={loading}
        // Search handlers
        onPatientSearch={() => {}} // Paciente no es editable
        onPsychologistSearch={psychologistSearch.setSearchQuery}
        onOfficeSearch={officeSearch.setSearch}
        // Date/Time handlers para búsquedas dinámicas
       /*  onPsychologistDateChange={handleDateChange}
        onPsychologistStartTimeChange={handleStartTimeChange}
        onPsychologistEndTimeChange={handleEndTimeChange}
        // Search options */
        patientOptions={[
          {
            id: appointmentData.patient.id,
            name: `${appointmentData.patient.firstName} ${appointmentData.patient.lastName}`,
            dni: appointmentData.patient.dni,
          },
        ]} // Solo el paciente actual (no editable)
        psychologistOptions={psychologistSearch.psychologists}
        officeOptions={officeSearch.offices.map((office) => ({
          id: office.id,
          name: office.name,
          location: office.location.address,
        }))}
        assignedOffice={assignedOffice}
        // Loading states
        patientSearchLoading={false} // No hay búsqueda de pacientes
        psychologistSearchLoading={psychologistSearch.isLoading}
        officeSearchLoading={officeSearch.isLoading}
        
      />
    </div>
  );
};
