import { useCallback, useEffect, useState } from "react";
import {
  AppointmentBaseForm,
  type FormMode,
} from "../components/AppointmentBaseForm";
import { useForm } from "react-hook-form";
import {
  appointmentFormSchema,
  type AppointmentFormSchema,
} from "@/shared/interfaces/forms/AppointmentFormSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePatientSearchQuery } from "@/features/patients/hooks";
import {
  usePsychologistSearchByNameQuery,
} from "@/features/systemUsers/hooks";
import { useNavigate } from "react-router";
import { useAlert } from "@/shared/hooks/useAlert";
import { Loading } from "@/shared/components/Loading";
import { useOfficeSearchQuery } from "@/features/offices/hooks/useOfficesQueries";
import { useCreateAppointment } from "../hooks/useAppointmentMutations";
import type { User } from "@/shared/interfaces/models";
import { getOfficeByIdApi } from "@/features/offices/api/officesApi";
import { updatePatientPsychologistIdApi } from "../api/appointmentsApi";

export const CreateAppointment = () => {
  const navigate = useNavigate();
  const [mode] = useState<FormMode>("create");
  const [loading, setLoading] = useState(false);
  const { showAlert } = useAlert();

  const form = useForm<AppointmentFormSchema>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      patientId: "",
      date: "",
      startTime: "",
      endTime: "",
      psychologistId: "",
      officeId: "",
      typeId: "PARTICULAR",
    },
  });
  const patientSearch = usePatientSearchQuery();
  const psychologistSearch = usePsychologistSearchByNameQuery();
  const officeSearch = useOfficeSearchQuery();

  const createAppointmentMutation = useCreateAppointment();

  const [assignedOffice, setAssignedOffice] = useState<{
    id: string;
    name: string;
    location?: string;
  } | null>(null);
  const [selectedPsychologist, setSelectedPsychologist] =
    useState<Partial<User> | null>(null);
  const date = form.watch("date");
  const startTime = form.watch("startTime");
  const endTime = form.watch("endTime");
  const psychologistId = form.watch("psychologistId");

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

  // Función para encontrar la oficina basada en el día y hora
  const getOfficeFromSchedule = useCallback(() => {
    if (!psychologistId || !date || !startTime || !selectedPsychologist) {
      form.setValue("officeId", "");
      setAssignedOffice(null);
      return;
    }

    const dayOfWeek = getDayOfWeek(date);
    console.log("dia sseleccionado:", dayOfWeek);
    console.log("psicologo", selectedPsychologist);

    // Buscar en el workSchedule del psicólogo
    const schedule = selectedPsychologist.workSchedule?.find((schedule) => {
      console.log("comparando:", schedule.day, "===", dayOfWeek);
      return schedule.day === dayOfWeek;
    });

    console.log("schedule del psicologo en ese dia:", schedule);

    if (!schedule) {
      form.setValue("officeId", "");
      setAssignedOffice(null);
      console.log("No se encontró schedule para este día");
      return;
    }

    const extractTime = (isoTime: string): string => {
      return isoTime.split("T")[1].substring(0, 5); // Extrae "HH:MM"
    };

    const scheduleStart = extractTime(schedule.startTime);
    const scheduleEnd = extractTime(schedule.endTime);
    const isTimeInRange = endTime > startTime && startTime >= scheduleStart && endTime <= scheduleEnd;

    if (isTimeInRange && schedule.officeId) {
      form.setValue("officeId", schedule.officeId);
      (async () => {
        try {
          const office = await getOfficeByIdApi(schedule.officeId);
          console.log("office", office);
          setAssignedOffice({
            id: office.id,
            name: office.name,
            location: office.location?.address,
          });
        } catch (err) {
          console.error("Error en fetch:", err);
          setAssignedOffice(null);
        }
      })();

      console.log("asignando");
    } else {
      form.setValue("officeId", "");
      setAssignedOffice(null);
    }
  }, [psychologistId, date, startTime, endTime, selectedPsychologist, form]);

  // Efecto para actualizar la oficina cuando cambia el psicólogo, fecha u hora
  useEffect(() => {
    if (psychologistId) {
      const psychologist = psychologistSearch.psychologists.find(
        (p) => p.id === psychologistId
      );
      setSelectedPsychologist(psychologist || null);
    }
  }, [psychologistId, psychologistSearch.psychologists]);

  useEffect(() => {
    getOfficeFromSchedule();
  }, [getOfficeFromSchedule]);

  const handleSave = async (data: AppointmentFormSchema) => {
    setLoading(true);
    // Convertir fecha y hora local de Perú a UTC
    const startDateTime = new Date(`${data.date}T${data.startTime}`);
    const endDateTime = new Date(`${data.date}T${data.endTime}`);

    const appointmentData = {
      patientId: data.patientId,
      psychologistId: data.psychologistId,
      officeId: data.officeId,
      startDate: startDateTime.toISOString(), // Enviar como ISO string UTC
      endDate: endDateTime.toISOString(), // Enviar como ISO string UTC
      reason: data.reason,
      type: data.typeId,
    };

    console.log("Sending appointment data:", appointmentData);

    createAppointmentMutation.mutate(appointmentData, {
      onSuccess: () => {
        showAlert("La cita ha sido creada correctamente", "success");
        navigate("/appointments");
        setLoading(false);
      },
    });
    await updatePatientPsychologistIdApi({
      patientId: data.patientId,
      psychologistId: data.psychologistId,
    });
    setLoading(false);
  };
  const handleCancel = () => {
    if (
      confirm("¿Estás seguro de que deseas cancelar la creación de la cita?")
    ) {
      navigate("/appointments");
    }
  };

  if (loading) {
    return <Loading message="Creando cita..." />;
  }

  return (
    <div>
      <AppointmentBaseForm
        mode={mode}
        form={form}
        onSave={form.handleSubmit(handleSave)}
        onCancel={handleCancel}
        loading={loading || createAppointmentMutation.isPending}
        // Search handlers
        onPatientSearch={patientSearch.setNameQuery}
        onPsychologistSearch={psychologistSearch.setSearchQuery}
        onOfficeSearch={officeSearch.setSearch}
        // Date/Time handlers for psychologist search
        //onPsychologistDateChange={handleDateChange}
        //onPsychologistStartTimeChange={}
        //onPsychologistEndTimeChange={}
        // Search options
        patientOptions={patientSearch.patients.map((patient) => ({
          id: patient.id,
          name: patient.firstName + " " + patient.lastName,
          dni: patient.dni,
        }))}
        psychologistOptions={psychologistSearch.psychologists}
        officeOptions={officeSearch.offices.map((office) => ({
          id: office.id,
          name: office.name,
          location: office.location.address,
        }))}
        assignedOffice={assignedOffice}
        // Loading states for searches
        patientSearchLoading={patientSearch.isLoading}
        psychologistSearchLoading={psychologistSearch.isLoading}
        officeSearchLoading={officeSearch.isLoading}
      />
    </div>
  );
};
