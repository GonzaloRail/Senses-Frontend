import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { FaChevronLeft, FaChevronRight, FaTrashAlt } from "react-icons/fa";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/shared/components/SearchableSelect";
import { Loading } from "@/shared/components/Loading";
import { PatientSearchSelect } from "./PatientSearchSelect";
import { usePatientSearchQuery } from "@/features/patients/hooks";
import { usePsychologistSearchByNameQuery } from "@/features/systemUsers/hooks";
import { getUserByIdApi } from "@/features/systemUsers/api/systemUsersApi";
import { getAppointmentEventsByPsychologistApi } from "@/features/schedules/api/schedulesApi";
import { getAppointmentByIdApi } from "../api/appointmentsApi";
import { useCreateAppointment, useUpdateAppointmentStatus } from "../hooks/useAppointmentMutations";
import { useAlert } from "@/shared/hooks/useAlert";
import type { AppointmentEvent } from "@/shared/interfaces/apiResponses/getAllAppointmentEvents";
import type { AppointmentViewResponse } from "@/shared/interfaces/apiResponses/getAppointmentByIdResponse";
import type { AppointmentType, User } from "@/shared/interfaces/models";
import {
  allHourOptions,
  createId,
  createLocalIso,
  formatHour,
  formatSlotRange,
  generateMonthWeeks,
  getDateKey,
  getDatesBetween,
  getLongDateLabel,
  getMonthLabel,
  getSlotKey,
  getWeekdayIndex,
  getWorkScheduleForWeekday,
  isSlotInsideWorkSchedule,
  normalizeWorkSchedule,
  parseDateInput,
  shiftSlots,
  weekDayNames,
  type CalendarDay,
  type NormalizedWorkSchedule,
  type Shift,
  type TimeSlot,
} from "../utils/appointmentScheduler";

type SlotStatus = "available" | "appointment" | "blocked" | "selected" | "empty" | "unavailable";
type CreationMode = "single" | "block";

interface SlotState {
  status: SlotStatus;
  label?: string;
}

interface SelectedSlot {
  date: Date;
  dateKey: string;
  startHour: number;
  endHour: number;
  label: string;
  officeId: string;
  officeName: string;
}

interface SchedulerAppointment {
  id: string;
  dateKey: string;
  startHour: number;
  endHour: number;
  patientName: string;
  psychologistName: string;
  officeName: string;
  reason: string;
  type: AppointmentType;
}

interface AppointmentFormState {
  patientId: string;
  patientName: string;
  patientDni: string;
  officeId: string;
  officeName: string;
  reason: string;
  type: AppointmentType;
  mode: CreationMode;
  blockStartDate: string;
  blockEndDate: string;
  blockStartHour: number;
  blockEndHour: number;
}

interface BlockRule {
  id: string;
  weekdays: number[];
  startHour: number;
  endHour: number;
}

interface CalendarSlotProps {
  state: SlotState;
  ariaLabel?: string;
  onClick?: () => void;
}

const CalendarSlot = ({ state, ariaLabel, onClick }: CalendarSlotProps) => {
  if (state.status === "appointment") {
    const content = (
      <div className="flex h-full items-center justify-center truncate rounded-sm bg-senses-primary px-1 text-[0.65rem] text-white">
        {state.label}
      </div>
    );

    return (
      <div className="h-8 border border-dotted border-slate-300 p-0.5">
        {onClick ? (
          <button
            aria-label={ariaLabel}
            className="h-full w-full rounded-sm focus:outline-none focus:ring-2 focus:ring-senses-secondary"
            onClick={onClick}
            type="button"
          >
            {content}
          </button>
        ) : (
          content
        )}
      </div>
    );
  }

  if (state.status === "blocked") {
    return (
      <div className="flex h-8 items-center justify-center border border-slate-300 bg-slate-300 text-[0.65rem] font-medium text-slate-600">
        {state.label}
      </div>
    );
  }

  if (state.status === "selected") {
    return (
      <div className="flex h-8 items-center justify-end border-2 border-senses-secondary bg-senses-secondary/20 px-1 text-[0.65rem] font-bold text-senses-primary">
        {state.label}
      </div>
    );
  }

  if (state.status === "empty") {
    return <div className="h-8 border border-dotted border-slate-200 bg-slate-50" />;
  }

  if (state.status === "unavailable") {
    return <div className="h-8 border border-slate-200 bg-slate-100" />;
  }

  return (
    <button
      aria-label={ariaLabel}
      className="h-8 w-full border border-senses-secondary/40 bg-senses-secondary/10 transition hover:bg-senses-secondary/25 focus:outline-none focus:ring-2 focus:ring-senses-secondary"
      onClick={onClick}
      type="button"
    />
  );
};

function getEmptyForm(selectedSlot?: SelectedSlot): AppointmentFormState {
  const dateKey = selectedSlot?.dateKey ?? getDateKey(new Date());
  const startHour = selectedSlot?.startHour ?? 7;

  return {
    patientId: "",
    patientName: "",
    patientDni: "",
    officeId: selectedSlot?.officeId ?? "",
    officeName: selectedSlot?.officeName ?? "Pendiente",
    reason: "",
    type: "PARTICULAR",
    mode: "single",
    blockStartDate: dateKey,
    blockEndDate: dateKey,
    blockStartHour: startHour,
    blockEndHour: startHour + 1,
  };
}

function getEventDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function mapEventToAppointment(event: AppointmentEvent): SchedulerAppointment {
  const start = getEventDate(event.startDate);
  const end = getEventDate(event.endDate);
  return {
    id: event.resource.id,
    dateKey: getDateKey(start),
    startHour: start.getHours(),
    endHour: end.getHours(),
    patientName: event.resource.patientName,
    psychologistName: event.resource.psychologistName,
    officeName: event.resource.officeName,
    reason: event.title,
    type: event.resource.type === "SOCIAL" ? "SOCIAL" : "PARTICULAR",
  };
}

function getAppointmentPatientName(appointment: SchedulerAppointment) {
  return appointment.patientName.trim();
}

function getScheduleForSlot(schedules: NormalizedWorkSchedule[], slot: SelectedSlot) {
  return getWorkScheduleForWeekday(schedules, getWeekdayIndex(slot.date));
}

export const AppointmentScheduler = () => {
  const [selectedPsychologistId, setSelectedPsychologistId] = useState("");
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [shift, setShift] = useState<Shift>("morning");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [appointmentDetailOpen, setAppointmentDetailOpen] = useState(false);
  const [copiedAppointment, setCopiedAppointment] = useState<AppointmentViewResponse | null>(null);
  const [pasteSlot, setPasteSlot] = useState<SelectedSlot | null>(null);
  const [pasteDialogOpen, setPasteDialogOpen] = useState(false);
  const [form, setForm] = useState<AppointmentFormState>(() => getEmptyForm());
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [blockWeekdays, setBlockWeekdays] = useState<number[]>([]);
  const [blockRules, setBlockRules] = useState<BlockRule[]>([]);
  const [feedback, setFeedback] = useState("");
  const [isAppointmentsPanelOpen, setIsAppointmentsPanelOpen] = useState(true);
  const [creatingBlock, setCreatingBlock] = useState(false);

  const { showAlert } = useAlert();
  const patientSearch = usePatientSearchQuery();
  const psychologistSearch = usePsychologistSearchByNameQuery();
  const createAppointmentMutation = useCreateAppointment();
  const updateAppointmentStatus = useUpdateAppointmentStatus();

  useEffect(() => {
    if (!selectedPsychologistId && psychologistSearch.psychologists.length > 0) {
      setSelectedPsychologistId(psychologistSearch.psychologists[0].id);
    }
  }, [psychologistSearch.psychologists, selectedPsychologistId]);

  const { data: selectedPsychologist, isLoading: psychologistLoading } = useQuery<User>({
    queryKey: ["appointment-scheduler", "psychologist", selectedPsychologistId],
    queryFn: () => getUserByIdApi({ id: selectedPsychologistId }),
    enabled: Boolean(selectedPsychologistId),
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: appointmentEvents = [],
    isLoading: appointmentsLoading,
    refetch: refetchAppointments,
  } = useQuery<AppointmentEvent[]>({
    queryKey: ["appointment-scheduler", "appointments", selectedPsychologistId],
    queryFn: () => getAppointmentEventsByPsychologistApi(selectedPsychologistId),
    enabled: Boolean(selectedPsychologistId),
    staleTime: 1000 * 30,
  });

  const { data: selectedAppointmentDetail } = useQuery<AppointmentViewResponse>({
    queryKey: ["appointment", selectedAppointmentId],
    queryFn: () => getAppointmentByIdApi(selectedAppointmentId ?? ""),
    enabled: Boolean(selectedAppointmentId),
    staleTime: 1000 * 60,
  });

  const workSchedules = useMemo(
    () => normalizeWorkSchedule(selectedPsychologist?.workSchedule),
    [selectedPsychologist?.workSchedule]
  );

  const selectedPsychologistName = selectedPsychologist
    ? `${selectedPsychologist.firstName} ${selectedPsychologist.lastName}`
    : "Seleccione un psicólogo";

  const appointments = useMemo(
    () => appointmentEvents.map(mapEventToAppointment),
    [appointmentEvents]
  );

  const monthWeeks = generateMonthWeeks(visibleMonth);
  const visibleSlots = shiftSlots[shift];
  const visibleAppointments = appointments
    .filter((appointment) => {
      const appointmentDate = parseDateInput(appointment.dateKey);
      return (
        appointmentDate.getFullYear() === visibleMonth.getFullYear() &&
        appointmentDate.getMonth() === visibleMonth.getMonth()
      );
    })
    .sort((first, second) => {
      const dateComparison = first.dateKey.localeCompare(second.dateKey);
      return dateComparison || first.startHour - second.startHour;
    });

  const updateFormField = <Key extends keyof AppointmentFormState>(
    field: Key,
    value: AppointmentFormState[Key]
  ) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  };

  const getAppointmentForSlot = (dateKey: string, startHour: number) => {
    return appointments.find(
      (appointment) => appointment.dateKey === dateKey && appointment.startHour === startHour
    );
  };

  const getSlotState = (day: CalendarDay, slot: TimeSlot): SlotState => {
    const appointment = getAppointmentForSlot(day.key, slot.startHour);
    const workSchedule = getWorkScheduleForWeekday(workSchedules, day.weekdayIndex);

    if (
      selectedSlot?.dateKey === day.key &&
      selectedSlot.startHour === slot.startHour &&
      (dialogOpen || pasteDialogOpen)
    ) {
      return { status: "selected", label: "OK" };
    }

    if (appointment) {
      return { status: "appointment", label: getAppointmentPatientName(appointment) };
    }

    if (!isSlotInsideWorkSchedule(slot, workSchedule)) {
      return { status: "unavailable" };
    }

    return { status: "available" };
  };

  const openCreateDialog = (day: CalendarDay, slot: TimeSlot) => {
    const state = getSlotState(day, slot);
    if (state.status !== "available") return;

    const workSchedule = getWorkScheduleForWeekday(workSchedules, day.weekdayIndex);
    if (!workSchedule) return;

    const nextSelectedSlot = {
      date: day.date,
      dateKey: day.key,
      startHour: slot.startHour,
      endHour: slot.endHour,
      label: slot.label,
      officeId: workSchedule.officeId,
      officeName: workSchedule.officeName,
    };

    setSelectedSlot(nextSelectedSlot);
    setFeedback("");

    if (copiedAppointment) {
      setPasteSlot(nextSelectedSlot);
      setPasteDialogOpen(true);
      return;
    }

    setSelectedPatientId("");
    setForm(getEmptyForm(nextSelectedSlot));
    setBlockWeekdays([day.weekdayIndex]);
    setBlockRules([]);
    setDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setSelectedSlot(null);
      setSelectedPatientId("");
      setFeedback("");
    }
  };

  const handleAppointmentDetailOpenChange = (open: boolean) => {
    setAppointmentDetailOpen(open);
    if (!open) {
      setSelectedAppointmentId(null);
    }
  };

  const openAppointmentDetail = (appointment: SchedulerAppointment) => {
    setSelectedAppointmentId(appointment.id);
    setAppointmentDetailOpen(true);
  };

  const handleCopyAppointment = () => {
    if (!selectedAppointmentDetail) return;
    setCopiedAppointment(selectedAppointmentDetail);
    setAppointmentDetailOpen(false);
    setSelectedAppointmentId(null);
  };

  const handleCancelCopiedAppointment = () => {
    setCopiedAppointment(null);
    setPasteDialogOpen(false);
    setPasteSlot(null);
    setSelectedSlot(null);
    setFeedback("");
  };

  const handlePasteDialogOpenChange = (open: boolean) => {
    setPasteDialogOpen(open);
    if (!open) {
      setPasteSlot(null);
      setSelectedSlot(null);
      setFeedback("");
    }
  };

  const isSelectedSlotAvailable = (slot: SelectedSlot) => {
    const workSchedule = getScheduleForSlot(workSchedules, slot);
    const timeSlot = {
      startHour: slot.startHour,
      endHour: slot.endHour,
      label: slot.label,
    };

    return (
      isSlotInsideWorkSchedule(timeSlot, workSchedule) &&
      !appointments.some(
        (appointment) => appointment.dateKey === slot.dateKey && appointment.startHour === slot.startHour
      )
    );
  };

  const createAppointment = async ({
    patientId,
    dateKey,
    startHour,
    endHour,
    officeId,
    reason,
    type,
  }: {
    patientId: string;
    dateKey: string;
    startHour: number;
    endHour: number;
    officeId: string;
    reason: string;
    type: AppointmentType;
  }) => {
    if (!selectedPsychologistId) throw new Error("Seleccione un psicólogo");
    if (!officeId) throw new Error("No se encontró consultorio para este horario.");

    return createAppointmentMutation.mutateAsync({
      patientId,
      psychologistId: selectedPsychologistId,
      officeId,
      startDate: createLocalIso(dateKey, startHour),
      endDate: createLocalIso(dateKey, endHour),
      reason,
      type,
    });
  };

  const handlePasteCopiedAppointment = async () => {
    if (!copiedAppointment || !pasteSlot) return;

    if (!isSelectedSlotAvailable(pasteSlot)) {
      setFeedback("Ese horario ya no está disponible.");
      return;
    }

    try {
      await createAppointment({
        patientId: copiedAppointment.patient.id,
        dateKey: pasteSlot.dateKey,
        startHour: pasteSlot.startHour,
        endHour: pasteSlot.endHour,
        officeId: pasteSlot.officeId,
        reason: copiedAppointment.reason,
        type: copiedAppointment.type === "SOCIAL" ? "SOCIAL" : "PARTICULAR",
      });
      await refetchAppointments();
      showAlert("Cita copiada correctamente", "success");
      setCopiedAppointment(null);
      setPasteDialogOpen(false);
      setPasteSlot(null);
      setSelectedSlot(null);
      setFeedback("");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No se pudo pegar la cita.");
    }
  };

  const handleCreateNewFromPasteSlot = () => {
    if (!pasteSlot) return;

    const targetSlot = pasteSlot;
    setCopiedAppointment(null);
    setPasteDialogOpen(false);
    setPasteSlot(null);
    setSelectedSlot(targetSlot);
    setSelectedPatientId("");
    setForm(getEmptyForm(targetSlot));
    setBlockWeekdays([getWeekdayIndex(targetSlot.date)]);
    setBlockRules([]);
    setFeedback("");
    setDialogOpen(true);
  };

  const handlePatientSelect = (patientId: string) => {
    setSelectedPatientId(patientId);

    const patient = patientSearch.patients.find((item) => item.id === patientId);
    if (!patient) return;

    setForm((currentForm) => ({
      ...currentForm,
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      patientDni: patient.dni,
    }));
  };

  const handleBlockWeekdayToggle = (weekdayIndex: number) => {
    if (!getWorkScheduleForWeekday(workSchedules, weekdayIndex)) return;

    setBlockWeekdays((currentWeekdays) => {
      if (currentWeekdays.includes(weekdayIndex)) {
        return currentWeekdays.filter((item) => item !== weekdayIndex);
      }
      return [...currentWeekdays, weekdayIndex].sort((first, second) => first - second);
    });
  };

  const handleAddBlockRule = () => {
    if (blockWeekdays.length === 0) {
      setFeedback("Selecciona al menos un día para agregar el bloque.");
      return;
    }

    if (form.blockEndHour <= form.blockStartHour) {
      setFeedback("La hora de fin debe ser posterior a la hora de inicio.");
      return;
    }

    setBlockRules((currentRules) => [
      ...currentRules,
      {
        id: createId(),
        weekdays: blockWeekdays,
        startHour: form.blockStartHour,
        endHour: form.blockEndHour,
      },
    ]);
    setFeedback("");
  };

  const handleRemoveBlockRule = (ruleId: string) => {
    setBlockRules((currentRules) => currentRules.filter((rule) => rule.id !== ruleId));
  };

  const handleCreateSingleAppointment = async () => {
    if (!selectedSlot) return;

    const slotAlreadyTaken = appointments.some(
      (appointment) =>
        appointment.dateKey === selectedSlot.dateKey && appointment.startHour === selectedSlot.startHour
    );

    if (slotAlreadyTaken) {
      setFeedback("Ese horario ya no está disponible.");
      return;
    }

    try {
      await createAppointment({
        patientId: form.patientId,
        dateKey: selectedSlot.dateKey,
        startHour: selectedSlot.startHour,
        endHour: selectedSlot.endHour,
        officeId: selectedSlot.officeId,
        reason: form.reason.trim(),
        type: form.type,
      });
      await refetchAppointments();
      showAlert("La cita ha sido creada correctamente", "success");
      setDialogOpen(false);
      setSelectedSlot(null);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No se pudo crear la cita.");
    }
  };

  const handleCreateBlockAppointments = async () => {
    const startDate = parseDateInput(form.blockStartDate);
    const endDate = parseDateInput(form.blockEndDate);
    const dates = getDatesBetween(startDate, endDate);

    if (dates.length === 0) {
      setFeedback("El rango de fechas no es válido.");
      return;
    }

    const rules =
      blockRules.length > 0
        ? blockRules
        : [
            {
              id: "draft-rule",
              weekdays: blockWeekdays,
              startHour: form.blockStartHour,
              endHour: form.blockEndHour,
            },
          ];

    if (rules.some((rule) => rule.weekdays.length === 0)) {
      setFeedback("Selecciona al menos un día para el bloque.");
      return;
    }

    if (rules.some((rule) => rule.endHour <= rule.startHour)) {
      setFeedback("Todos los bloques deben tener una hora de fin válida.");
      return;
    }

    const occupiedSlots = new Set(
      appointments.map((appointment) => getSlotKey(appointment.dateKey, appointment.startHour))
    );
    const appointmentsToCreate: Array<{ dateKey: string; startHour: number; endHour: number; officeId: string }> = [];

    dates.forEach((date) => {
      const weekdayIndex = getWeekdayIndex(date);
      const dateKey = getDateKey(date);
      const workSchedule = getWorkScheduleForWeekday(workSchedules, weekdayIndex);

      if (!workSchedule) return;

      rules.forEach((rule) => {
        if (!rule.weekdays.includes(weekdayIndex)) return;

        for (let hour = rule.startHour; hour < rule.endHour; hour += 1) {
          const slot = { startHour: hour, endHour: hour + 1, label: formatSlotRange(hour, hour + 1) };
          const slotKey = getSlotKey(dateKey, hour);
          if (!isSlotInsideWorkSchedule(slot, workSchedule) || occupiedSlots.has(slotKey)) {
            continue;
          }

          appointmentsToCreate.push({
            dateKey,
            startHour: hour,
            endHour: hour + 1,
            officeId: workSchedule.officeId,
          });
          occupiedSlots.add(slotKey);
        }
      });
    });

    if (appointmentsToCreate.length === 0) {
      setFeedback("No se encontraron horarios libres para crear el bloque.");
      return;
    }

    setCreatingBlock(true);
    let createdCount = 0;
    let failedCount = 0;

    for (const appointment of appointmentsToCreate) {
      try {
        await createAppointment({
          patientId: form.patientId,
          dateKey: appointment.dateKey,
          startHour: appointment.startHour,
          endHour: appointment.endHour,
          officeId: appointment.officeId,
          reason: form.reason.trim(),
          type: form.type,
        });
        createdCount += 1;
      } catch {
        failedCount += 1;
      }
    }

    setCreatingBlock(false);
    await refetchAppointments();

    if (createdCount === 0) {
      setFeedback("No se pudo crear ninguna cita del bloque.");
      return;
    }

    showAlert(
      failedCount > 0
        ? `${createdCount} citas creadas. ${failedCount} no se crearon por conflicto.`
        : `${createdCount} citas creadas correctamente`,
      failedCount > 0 ? "warning" : "success"
    );
    setDialogOpen(false);
    setSelectedSlot(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedPsychologistId) {
      setFeedback("Selecciona un psicólogo antes de agendar.");
      return;
    }

    if (!form.patientId) {
      setFeedback("Selecciona un paciente antes de agendar.");
      return;
    }

    if (!form.reason.trim()) {
      setFeedback("Ingresa el motivo de la cita.");
      return;
    }

    if (form.mode === "single") {
      void handleCreateSingleAppointment();
      return;
    }

    void handleCreateBlockAppointments();
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm("¿Deseas cancelar esta cita?")) return;

    try {
      await updateAppointmentStatus.mutateAsync({ id: appointmentId, status: "CANCELED" });
      await refetchAppointments();
      showAlert("Cita cancelada", "success");
    } catch (error) {
      showAlert(error instanceof Error ? error.message : "No se pudo cancelar la cita", "error");
    }
  };

  const isBusy = psychologistLoading || appointmentsLoading;

  return (
    <>
      <div className="flex flex-1 flex-col overflow-hidden bg-slate-50">
        <div className="relative flex flex-1 flex-col gap-3 overflow-hidden p-4 xl:flex-row">
          <main className="custom-scroll flex min-h-[560px] flex-1 flex-col overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-200 p-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                  <SearchableSelect
                    id="appointment-scheduler-psychologist"
                    label="Disponibilidad del psicólogo"
                    placeholder="Buscar psicólogo..."
                    value={selectedPsychologistId}
                    onValueChange={(value) => {
                      setSelectedPsychologistId(value);
                      setCopiedAppointment(null);
                      setFeedback("");
                    }}
                    onSearch={psychologistSearch.setSearchQuery}
                    options={psychologistSearch.psychologists.map((psychologist) => ({
                      value: psychologist.id,
                      label: `${psychologist.firstName} ${psychologist.lastName} - DNI: ${psychologist.dni}`,
                    }))}
                    loading={psychologistSearch.isLoading}
                    helper="Seleccione un psicólogo para ver su disponibilidad y citas programadas"
                  />
                  {isBusy && <Loading message="Cargando horario..." />}
                </div>

                <h2 className="mt-2 text-lg font-semibold text-senses-primary">
                  Disponibilidad de {selectedPsychologistName}
                </h2>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 rounded-sm border border-senses-secondary/40 bg-senses-secondary/15" />
                    <span>Disponible según horario</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 rounded-sm bg-senses-primary" />
                    <span>Cita</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 rounded-sm bg-slate-100 ring-1 ring-slate-200" />
                    <span>Fuera de horario</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 self-start lg:self-center">
                <div className="flex items-center gap-2">
                  <Button
                    aria-label="Mes anterior"
                    className="h-8 w-8 border-slate-300 bg-white p-0 text-slate-600 hover:bg-slate-100"
                    onClick={() =>
                      setVisibleMonth(
                        (currentMonth) =>
                          new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
                      )
                    }
                    type="button"
                    variant="outline"
                  >
                    <FaChevronLeft className="h-3 w-3" />
                  </Button>
                  <span className="w-32 text-center text-sm font-semibold text-senses-primary">
                    {getMonthLabel(visibleMonth)}
                  </span>
                  <Button
                    aria-label="Mes siguiente"
                    className="h-8 w-8 border-slate-300 bg-white p-0 text-slate-600 hover:bg-slate-100"
                    onClick={() =>
                      setVisibleMonth(
                        (currentMonth) =>
                          new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
                      )
                    }
                    type="button"
                    variant="outline"
                  >
                    <FaChevronRight className="h-3 w-3" />
                  </Button>
                  <Button
                    className="h-8 border-senses-primary bg-white px-3 text-xs font-semibold text-senses-primary hover:bg-senses-primary/10"
                    onClick={() => setIsAppointmentsPanelOpen((currentValue) => !currentValue)}
                    type="button"
                    variant="outline"
                  >
                    {isAppointmentsPanelOpen ? "Ocultar citas" : "Citas"}
                  </Button>
                </div>

                <div className="flex rounded-md border border-slate-200 bg-slate-50 p-1">
                  <Button
                    className={`h-8 flex-1 px-3 text-xs ${
                      shift === "morning"
                        ? "bg-senses-primary text-white hover:bg-senses-primary/90"
                        : "bg-transparent text-senses-primary hover:bg-senses-primary/10"
                    }`}
                    onClick={() => setShift("morning")}
                    type="button"
                    variant="ghost"
                  >
                    Mañana
                  </Button>
                  <Button
                    className={`h-8 flex-1 px-3 text-xs ${
                      shift === "afternoon"
                        ? "bg-senses-primary text-white hover:bg-senses-primary/90"
                        : "bg-transparent text-senses-primary hover:bg-senses-primary/10"
                    }`}
                    onClick={() => setShift("afternoon")}
                    type="button"
                    variant="ghost"
                  >
                    Tarde
                  </Button>
                </div>
              </div>
            </div>

            {copiedAppointment && (
              <div className="mx-4 mt-4 flex flex-col gap-3 rounded-lg border border-senses-secondary/40 bg-senses-secondary/10 p-3 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-senses-primary">
                    Cita copiada: {copiedAppointment.patient.firstName} {copiedAppointment.patient.lastName}
                  </p>
                  <p className="text-xs text-slate-500">
                    Selecciona una casilla disponible para pegarla en otro horario.
                  </p>
                </div>
                <Button
                  className="border-senses-primary bg-white text-senses-primary hover:bg-senses-primary/10"
                  onClick={handleCancelCopiedAppointment}
                  type="button"
                  variant="outline"
                >
                  Cancelar copia
                </Button>
              </div>
            )}

            {!selectedPsychologistId ? (
              <div className="m-4 rounded-md border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                Selecciona un psicólogo para visualizar su horario.
              </div>
            ) : workSchedules.length === 0 ? (
              <div className="m-4 rounded-md border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                El psicólogo seleccionado no tiene horarios configurados.
              </div>
            ) : (
              <div className="custom-scroll flex-1 overflow-x-auto p-4">
                <div className="min-w-[900px] text-xs">
                  {monthWeeks.map((week, weekIndex) => (
                    <div
                      className="mb-3 grid grid-cols-[74px_repeat(7,minmax(105px,1fr))] last:mb-0"
                      key={`${visibleMonth.getFullYear()}-${visibleMonth.getMonth()}-${weekIndex}`}
                    >
                      <div className="border border-slate-200 bg-senses-primary p-1 text-center font-medium text-white" />
                      {week.map((day, dayIndex) => {
                        const workSchedule = day
                          ? getWorkScheduleForWeekday(workSchedules, day.weekdayIndex)
                          : undefined;

                        return (
                          <div
                            className={`border border-slate-200 p-1 text-center font-medium ${
                              day && workSchedule
                                ? "bg-senses-primary text-white"
                                : "bg-slate-100 text-slate-500"
                            }`}
                            key={day?.key ?? `empty-header-${weekIndex}-${dayIndex}`}
                          >
                            <div>{day ? `${weekDayNames[day.weekdayIndex]} ${day.day}` : weekDayNames[dayIndex]}</div>
                            {day && (
                              <div
                                className={`mt-1 rounded-sm px-1 py-0.5 text-[0.6rem] font-medium ${
                                  workSchedule ? "bg-white/15 text-white" : "bg-white text-slate-500"
                                }`}
                              >
                                {workSchedule
                                  ? `${workSchedule.officeName} · ${formatSlotRange(
                                      workSchedule.startHour,
                                      workSchedule.endHour
                                    )}`
                                  : "Sin atención"}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      <div className="flex flex-col">
                        {visibleSlots.map((slot) => (
                          <div
                            className="flex h-8 items-center justify-center border-b border-r border-slate-200 bg-slate-50 text-[0.65rem] font-medium text-slate-500"
                            key={slot.startHour}
                          >
                            {slot.label}
                          </div>
                        ))}
                      </div>

                      {week.map((day, dayIndex) => (
                        <div
                          className="flex flex-col border-r border-slate-200"
                          key={day?.key ?? `empty-column-${weekIndex}-${dayIndex}`}
                        >
                          {visibleSlots.map((slot) => {
                            if (!day) {
                              return <CalendarSlot key={slot.startHour} state={{ status: "empty" }} />;
                            }

                            const state = getSlotState(day, slot);
                            const appointment = getAppointmentForSlot(day.key, slot.startHour);
                            return (
                              <CalendarSlot
                                ariaLabel={
                                  appointment
                                    ? `Ver cita de ${getAppointmentPatientName(appointment)}`
                                    : `Crear cita el ${getLongDateLabel(day.date)} de ${slot.label}`
                                }
                                key={slot.startHour}
                                onClick={
                                  appointment
                                    ? () => openAppointmentDetail(appointment)
                                    : state.status === "available"
                                      ? () => openCreateDialog(day, slot)
                                      : undefined
                                }
                                state={state}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>

          {isAppointmentsPanelOpen && (
            <aside className="custom-scroll flex max-h-full w-full flex-col overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-sm xl:w-80 xl:shrink-0">
              <div className="flex-1 p-5">
                <div className="mb-4 border-b border-slate-200 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-senses-primary">Citas programadas</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Haz clic en una casilla disponible para crear una cita o configurar bloques.
                      </p>
                    </div>
                    <Button
                      aria-label="Ocultar citas programadas"
                      className="h-8 w-8 shrink-0 border-slate-300 bg-white p-0 text-slate-600 hover:bg-slate-100"
                      onClick={() => setIsAppointmentsPanelOpen(false)}
                      type="button"
                      variant="outline"
                    >
                      <FaChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="mt-3 inline-flex rounded-full bg-senses-secondary/20 px-2.5 py-1 text-xs font-semibold text-senses-primary">
                    {visibleAppointments.length} citas este mes
                  </div>
                </div>

                {visibleAppointments.length === 0 ? (
                  <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                    No hay citas creadas para este mes.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {visibleAppointments.map((appointment) => (
                      <div
                        className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm"
                        key={appointment.id}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <button
                            className="min-w-0 text-left"
                            onClick={() => openAppointmentDetail(appointment)}
                            type="button"
                          >
                            <p className="font-semibold text-senses-primary">
                              {getAppointmentPatientName(appointment)}
                            </p>
                            <p className="text-xs text-slate-500">
                              {parseDateInput(appointment.dateKey).toLocaleDateString("es-ES", {
                                day: "numeric",
                                month: "long",
                              })}{" "}
                              · {formatSlotRange(appointment.startHour, appointment.endHour)}
                            </p>
                          </button>
                          <Button
                            aria-label={`Cancelar cita de ${getAppointmentPatientName(appointment)}`}
                            className="h-7 w-7 border-senses-danger/30 bg-white p-0 text-senses-danger hover:bg-senses-danger/10 hover:text-senses-danger"
                            onClick={() => void handleCancelAppointment(appointment.id)}
                            type="button"
                            variant="outline"
                          >
                            <FaTrashAlt className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1 text-[0.65rem]">
                          <span className="rounded-full bg-senses-secondary/20 px-2 py-0.5 text-senses-primary">
                            {appointment.type === "PARTICULAR" ? "Particular" : "Caso social"}
                          </span>
                          <span className="rounded-full bg-white px-2 py-0.5 text-slate-600">
                            {appointment.officeName}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="custom-scroll max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-senses-primary">Nueva cita</DialogTitle>
            <DialogDescription>
              {selectedSlot
                ? `${getLongDateLabel(selectedSlot.date)} · ${selectedSlot.label}`
                : "Configura los datos de la cita."}
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 rounded-lg border border-slate-200 bg-slate-50 p-1 text-sm">
              <button
                className={`rounded-md px-3 py-2 font-medium transition ${
                  form.mode === "single"
                    ? "bg-senses-primary text-white shadow-sm"
                    : "text-senses-primary hover:bg-senses-primary/10"
                }`}
                onClick={() => updateFormField("mode", "single")}
                type="button"
              >
                Cita única
              </button>
              <button
                className={`rounded-md px-3 py-2 font-medium transition ${
                  form.mode === "block"
                    ? "bg-senses-primary text-white shadow-sm"
                    : "text-senses-primary hover:bg-senses-primary/10"
                }`}
                onClick={() => updateFormField("mode", "block")}
                type="button"
              >
                Bloque de horarios
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <PatientSearchSelect
                  id="scheduler-patient-search"
                  label="Paciente"
                  value={selectedPatientId}
                  onValueChange={handlePatientSelect}
                  onSearch={patientSearch.setSearchFilters}
                  options={patientSearch.patients.map((patient) => ({
                    id: patient.id,
                    name: `${patient.firstName} ${patient.lastName}`,
                    dni: patient.dni,
                  }))}
                  loading={patientSearch.isLoading}
                  helper="Busque por DNI o por nombre y apellido para llenar los datos del paciente"
                />
              </div>

              <div>
                <Label className="mb-1" htmlFor="scheduler-patient-name">
                  Paciente seleccionado
                </Label>
                <Input id="scheduler-patient-name" readOnly value={form.patientName || "Pendiente"} />
              </div>

              <div>
                <Label className="mb-1" htmlFor="scheduler-patient-dni">
                  DNI
                </Label>
                <Input id="scheduler-patient-dni" readOnly value={form.patientDni || "Pendiente"} />
              </div>

              <div>
                <Label className="mb-1" htmlFor="scheduler-psychologist-name">
                  Psicólogo a cargo
                </Label>
                <Input id="scheduler-psychologist-name" readOnly value={selectedPsychologistName} />
              </div>

              <div>
                <Label className="mb-1" htmlFor="scheduler-office-name">
                  Consultorio
                </Label>
                <Input
                  id="scheduler-office-name"
                  readOnly
                  value={form.mode === "block" ? "Según horario laboral" : form.officeName}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Se asigna automáticamente según el horario del psicólogo.
                </p>
              </div>

              <div className="md:col-span-2">
                <Label className="mb-1" htmlFor="scheduler-appointment-reason">
                  Motivo
                </Label>
                <Textarea
                  className="resize-none"
                  id="scheduler-appointment-reason"
                  onChange={(event) => updateFormField("reason", event.target.value)}
                  placeholder="Ej. Evaluación de seguimiento"
                  rows={2}
                  value={form.reason}
                />
              </div>

              <div className="md:col-span-2">
                <span className="mb-2 block text-sm font-medium text-slate-700">Tipo de cita</span>
                <div className="flex flex-wrap gap-4 text-sm">
                  <label className="inline-flex items-center gap-2">
                    <input
                      checked={form.type === "PARTICULAR"}
                      className="h-4 w-4 accent-senses-primary"
                      name="scheduler-appointment-type"
                      onChange={() => updateFormField("type", "PARTICULAR")}
                      type="radio"
                    />
                    Particular
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      checked={form.type === "SOCIAL"}
                      className="h-4 w-4 accent-senses-primary"
                      name="scheduler-appointment-type"
                      onChange={() => updateFormField("type", "SOCIAL")}
                      type="radio"
                    />
                    Caso social
                  </label>
                </div>
              </div>
            </div>

            {form.mode === "block" && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="mb-4">
                  <h3 className="font-semibold text-senses-primary">Configuración por bloques</h3>
                  <p className="text-xs text-slate-500">
                    Agrega más de una regla si algunos días tienen horarios distintos.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="mb-1" htmlFor="scheduler-block-start-date">
                      Desde
                    </Label>
                    <Input
                      id="scheduler-block-start-date"
                      onChange={(event) => updateFormField("blockStartDate", event.target.value)}
                      type="date"
                      value={form.blockStartDate}
                    />
                  </div>
                  <div>
                    <Label className="mb-1" htmlFor="scheduler-block-end-date">
                      Hasta
                    </Label>
                    <Input
                      id="scheduler-block-end-date"
                      onChange={(event) => updateFormField("blockEndDate", event.target.value)}
                      type="date"
                      value={form.blockEndDate}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Días</span>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {weekDayNames.map((dayName, index) => {
                        const selected = blockWeekdays.includes(index);
                        const workSchedule = getWorkScheduleForWeekday(workSchedules, index);
                        return (
                          <button
                            className={`rounded-md border px-3 py-2 text-xs font-medium transition ${
                              selected
                                ? "border-senses-primary bg-senses-primary text-white"
                                : workSchedule
                                  ? "border-slate-200 bg-white text-slate-600 hover:bg-senses-primary/10 hover:text-senses-primary"
                                  : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                            }`}
                            disabled={!workSchedule}
                            key={dayName}
                            onClick={() => handleBlockWeekdayToggle(index)}
                            type="button"
                          >
                            <span className="block">{dayName}</span>
                            <span className="mt-1 block text-[0.6rem] font-normal">
                              {workSchedule
                                ? `${workSchedule.officeName} · ${formatSlotRange(
                                    workSchedule.startHour,
                                    workSchedule.endHour
                                  )}`
                                : "Sin atención"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <Label className="mb-1" htmlFor="scheduler-block-start-hour">
                      Hora inicio
                    </Label>
                    <select
                      className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition focus:border-senses-secondary focus:ring-2 focus:ring-senses-secondary/30"
                      id="scheduler-block-start-hour"
                      onChange={(event) => {
                        const nextStartHour = Number(event.target.value);
                        setForm((currentForm) => ({
                          ...currentForm,
                          blockStartHour: nextStartHour,
                          blockEndHour: Math.max(currentForm.blockEndHour, nextStartHour + 1),
                        }));
                      }}
                      value={form.blockStartHour}
                    >
                      {allHourOptions.slice(0, -1).map((hour) => (
                        <option key={hour} value={hour}>
                          {formatHour(hour)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label className="mb-1" htmlFor="scheduler-block-end-hour">
                      Hora fin
                    </Label>
                    <select
                      className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition focus:border-senses-secondary focus:ring-2 focus:ring-senses-secondary/30"
                      id="scheduler-block-end-hour"
                      onChange={(event) => updateFormField("blockEndHour", Number(event.target.value))}
                      value={form.blockEndHour}
                    >
                      {allHourOptions
                        .filter((hour) => hour > form.blockStartHour)
                        .map((hour) => (
                          <option key={hour} value={hour}>
                            {formatHour(hour)}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button
                    className="border-senses-primary text-senses-primary hover:bg-senses-primary/10"
                    onClick={handleAddBlockRule}
                    type="button"
                    variant="outline"
                  >
                    Agregar bloque
                  </Button>
                </div>

                {blockRules.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {blockRules.map((rule) => (
                      <div
                        className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white p-2 text-sm"
                        key={rule.id}
                      >
                        <span className="text-slate-700">
                          {rule.weekdays.map((weekday) => weekDayNames[weekday]).join(", ")} ·{" "}
                          {formatSlotRange(rule.startHour, rule.endHour)}
                        </span>
                        <Button
                          aria-label="Eliminar bloque"
                          className="h-7 w-7 border-senses-danger/30 bg-white p-0 text-senses-danger hover:bg-senses-danger/10 hover:text-senses-danger"
                          onClick={() => handleRemoveBlockRule(rule.id)}
                          type="button"
                          variant="outline"
                        >
                          <FaTrashAlt className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {feedback && (
              <div className="rounded-md border border-senses-danger/30 bg-senses-danger/10 px-3 py-2 text-sm text-senses-danger">
                {feedback}
              </div>
            )}

            <DialogFooter>
              <Button
                className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                onClick={() => handleDialogOpenChange(false)}
                type="button"
                variant="outline"
              >
                Cancelar
              </Button>
              <Button
                className="bg-senses-success text-white hover:bg-senses-success/90"
                disabled={createAppointmentMutation.isPending || creatingBlock}
                type="submit"
              >
                {creatingBlock ? "Agendando..." : "Agendar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={appointmentDetailOpen} onOpenChange={handleAppointmentDetailOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-senses-primary">Detalle de cita</DialogTitle>
            <DialogDescription>
              Revisa la información de la cita o cópiala para pegarla en otro horario.
            </DialogDescription>
          </DialogHeader>

          {selectedAppointmentDetail ? (
            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
              <div>
                <span className="text-xs font-medium uppercase text-slate-500">Paciente</span>
                <p className="font-semibold text-senses-primary">
                  {selectedAppointmentDetail.patient.firstName} {selectedAppointmentDetail.patient.lastName}
                </p>
                <p className="text-xs text-slate-500">DNI: {selectedAppointmentDetail.patient.dni}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <span className="text-xs font-medium uppercase text-slate-500">Fecha</span>
                  <p className="text-slate-700">
                    {getLongDateLabel(new Date(selectedAppointmentDetail.startDate))}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium uppercase text-slate-500">Hora</span>
                  <p className="text-slate-700">
                    {formatSlotRange(
                      new Date(selectedAppointmentDetail.startDate).getHours(),
                      new Date(selectedAppointmentDetail.endDate).getHours()
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium uppercase text-slate-500">Psicólogo</span>
                  <p className="text-slate-700">
                    {selectedAppointmentDetail.user.firstName} {selectedAppointmentDetail.user.lastName}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium uppercase text-slate-500">Consultorio</span>
                  <p className="text-slate-700">{selectedAppointmentDetail.office.name}</p>
                </div>
              </div>

              <div>
                <span className="text-xs font-medium uppercase text-slate-500">Motivo</span>
                <p className="text-slate-700">{selectedAppointmentDetail.reason || "Sin motivo"}</p>
              </div>

              <div>
                <span className="text-xs font-medium uppercase text-slate-500">Tipo</span>
                <p className="text-slate-700">
                  {selectedAppointmentDetail.type === "PARTICULAR" ? "Particular" : "Caso social"}
                </p>
              </div>
            </div>
          ) : (
            <Loading message="Cargando cita..." />
          )}

          <DialogFooter>
            <Button
              className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
              onClick={() => handleAppointmentDetailOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cerrar
            </Button>
            <Button
              className="bg-senses-primary text-white hover:bg-senses-primary/90"
              disabled={!selectedAppointmentDetail}
              onClick={handleCopyAppointment}
              type="button"
            >
              <Copy className="h-4 w-4" />
              Copiar cita
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={pasteDialogOpen} onOpenChange={handlePasteDialogOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-senses-primary">Pegar cita copiada</DialogTitle>
            <DialogDescription>
              {pasteSlot
                ? `${getLongDateLabel(pasteSlot.date)} · ${pasteSlot.label}`
                : "Selecciona dónde pegar la cita copiada."}
            </DialogDescription>
          </DialogHeader>

          {copiedAppointment && pasteSlot && (
            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
              <div>
                <span className="text-xs font-medium uppercase text-slate-500">Cita copiada</span>
                <p className="font-semibold text-senses-primary">
                  {copiedAppointment.patient.firstName} {copiedAppointment.patient.lastName}
                </p>
                <p className="text-xs text-slate-500">DNI: {copiedAppointment.patient.dni}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <span className="text-xs font-medium uppercase text-slate-500">Nuevo horario</span>
                  <p className="text-slate-700">{formatSlotRange(pasteSlot.startHour, pasteSlot.endHour)}</p>
                </div>
                <div>
                  <span className="text-xs font-medium uppercase text-slate-500">Nuevo consultorio</span>
                  <p className="text-slate-700">{pasteSlot.officeName}</p>
                </div>
              </div>

              <p className="text-xs text-slate-500">
                Se conservarán paciente, motivo y tipo de cita. Se cambiarán fecha, hora y consultorio.
              </p>
            </div>
          )}

          {feedback && (
            <div className="rounded-md border border-senses-danger/30 bg-senses-danger/10 px-3 py-2 text-sm text-senses-danger">
              {feedback}
            </div>
          )}

          <DialogFooter>
            <Button
              className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
              onClick={() => handlePasteDialogOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancelar
            </Button>
            <Button
              className="border-senses-primary bg-white text-senses-primary hover:bg-senses-primary/10"
              onClick={handleCreateNewFromPasteSlot}
              type="button"
              variant="outline"
            >
              Crear cita nueva
            </Button>
            <Button
              className="bg-senses-success text-white hover:bg-senses-success/90"
              disabled={createAppointmentMutation.isPending}
              onClick={() => void handlePasteCopiedAppointment()}
              type="button"
            >
              Pegar cita
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
