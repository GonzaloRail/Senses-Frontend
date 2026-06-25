import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { useCreateAppointment, useUpdateAppointment, useUpdateAppointmentStatus } from "../hooks/useAppointmentMutations";
import { useAlert } from "@/shared/hooks/useAlert";
import type { AppointmentEvent } from "@/shared/interfaces/apiResponses/getAllAppointmentEvents";
import type { AppointmentViewResponse } from "@/shared/interfaces/apiResponses/getAppointmentByIdResponse";
import type { AppointmentStatus, AppointmentType, User } from "@/shared/interfaces/models";
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

type SlotStatus = "available" | "appointment" | "canceled" | "blocked" | "selected" | "empty" | "unavailable";
type CreationMode = "single" | "block";
type BlockScheduleMode = "fixed" | "custom";
type AgendaFilter = "all" | "today" | "week" | "upcoming";

interface SlotState {
  status: SlotStatus;
  label?: string;
  appointmentId?: string;
}

interface AppointmentSchedulerProps {
  psychologistId?: string;
  hidePsychologistSelector?: boolean;
  readOnly?: boolean;
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
  status: AppointmentStatus;
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

interface BlockPreview {
  creatableCount: number;
  occupiedCount: number;
  outOfScheduleCount: number;
}

interface CalendarSlotProps {
  state: SlotState;
  ariaLabel?: string;
  canDrag?: boolean;
  onClick?: () => void;
}

interface DroppableSlotData {
  date: Date;
  dateKey: string;
  startHour: number;
  endHour: number;
  label: string;
  officeId: string;
  officeName: string;
}

interface DroppableCalendarSlotProps extends CalendarSlotProps {
  disabled: boolean;
  droppableId: string;
  slotData?: DroppableSlotData;
}

const DraggableAppointmentContent = ({ appointmentId, label }: { appointmentId: string; label?: string }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `appointment-${appointmentId}`,
    data: { appointmentId },
  });
  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex h-full items-center justify-center truncate rounded-sm bg-senses-primary px-1 text-[0.65rem] text-white touch-none cursor-grab active:cursor-grabbing ${
        isDragging ? "opacity-60 shadow-md" : ""
      }`}
    >
      {label}
    </div>
  );
};

const DroppableCalendarSlot = ({
  disabled,
  droppableId,
  slotData,
  state,
  ariaLabel,
  canDrag,
  onClick,
}: DroppableCalendarSlotProps) => {
  const { isOver, setNodeRef } = useDroppable({
    id: droppableId,
    data: slotData,
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      className={`h-8 w-full ${isOver && !disabled ? "ring-2 ring-senses-secondary ring-offset-1" : ""}`}
    >
      <CalendarSlot ariaLabel={ariaLabel} canDrag={canDrag} onClick={onClick} state={state} />
    </div>
  );
};

const CalendarSlot = ({ state, ariaLabel, canDrag = true, onClick }: CalendarSlotProps) => {
  if (state.status === "appointment") {
    const content = state.appointmentId && canDrag ? (
      <DraggableAppointmentContent appointmentId={state.appointmentId} label={state.label} />
    ) : (
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

  if (state.status === "canceled") {
    const content = (
      <div className="flex h-full items-center justify-center truncate rounded-sm bg-senses-danger/15 px-1 text-[0.65rem] font-semibold text-senses-danger line-through">
        {state.label}
      </div>
    );

    return (
      <div className="h-8 border border-dotted border-senses-danger/30 bg-senses-danger/5 p-0.5">
        {onClick ? (
          <button
            aria-label={ariaLabel}
            className="h-full w-full rounded-sm focus:outline-none focus:ring-2 focus:ring-senses-danger/40"
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
    status: event.resource.status as AppointmentStatus,
  };
}

function getAppointmentPatientName(appointment: SchedulerAppointment) {
  return appointment.patientName.trim();
}

function getScheduleForSlot(schedules: NormalizedWorkSchedule[], slot: SelectedSlot) {
  return getWorkScheduleForWeekday(schedules, getWeekdayIndex(slot.date));
}

function rulesOverlap(firstRule: BlockRule, secondRule: BlockRule) {
  const sharesWeekday = firstRule.weekdays.some((weekday) => secondRule.weekdays.includes(weekday));
  if (!sharesWeekday) return false;

  return firstRule.startHour < secondRule.endHour && secondRule.startHour < firstRule.endHour;
}

function getBlockRulesForPreview(
  mode: BlockScheduleMode,
  rules: BlockRule[],
  weekdays: number[],
  startHour: number,
  endHour: number
) {
  if (mode === "custom") return rules;

  return [
    {
      id: "fixed-preview-rule",
      weekdays,
      startHour,
      endHour,
    },
  ];
}

function getWeekBounds(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - getWeekdayIndex(start));

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function isDateBetween(date: Date, start: Date, end: Date) {
  return date >= start && date <= end;
}

function getShortDateLabel(date: Date) {
  const label = date.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export const AppointmentScheduler = ({
  psychologistId,
  hidePsychologistSelector = false,
  readOnly = false,
}: AppointmentSchedulerProps = {}) => {
  const [selectedPsychologistId, setSelectedPsychologistId] = useState(psychologistId ?? "");
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
  const [blockScheduleMode, setBlockScheduleMode] = useState<BlockScheduleMode>("fixed");
  const [blockWeekdays, setBlockWeekdays] = useState<number[]>([]);
  const [blockRules, setBlockRules] = useState<BlockRule[]>([]);
  const [feedback, setFeedback] = useState("");
  const [isAppointmentsPanelOpen, setIsAppointmentsPanelOpen] = useState(true);
  const [agendaFilter, setAgendaFilter] = useState<AgendaFilter>("all");
  const [appointmentToCancel, setAppointmentToCancel] = useState<SchedulerAppointment | null>(null);
  const [creatingBlock, setCreatingBlock] = useState(false);
  const [expandedWeekKeys, setExpandedWeekKeys] = useState<string[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );
  const { showAlert } = useAlert();
  const patientSearch = usePatientSearchQuery();
  const psychologistSearch = usePsychologistSearchByNameQuery();
  const createAppointmentMutation = useCreateAppointment();
  const updateAppointmentMutation = useUpdateAppointment();
  const updateAppointmentStatus = useUpdateAppointmentStatus();

  useEffect(() => {
    if (psychologistId) {
      setSelectedPsychologistId(psychologistId);
      return;
    }

    if (!hidePsychologistSelector && !selectedPsychologistId && psychologistSearch.psychologists.length > 0) {
      setSelectedPsychologistId(psychologistSearch.psychologists[0].id);
    }
  }, [hidePsychologistSelector, psychologistId, psychologistSearch.psychologists, selectedPsychologistId]);

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

  const selectedPsychologistFromSearch = useMemo(
    () => psychologistSearch.psychologists.find((psychologist) => psychologist.id === selectedPsychologistId),
    [psychologistSearch.psychologists, selectedPsychologistId]
  );

  const selectedPsychologistWithSchedule = selectedPsychologist?.workSchedule?.length
    ? selectedPsychologist
    : selectedPsychologistFromSearch;

  const workSchedules = useMemo(
    () => normalizeWorkSchedule(selectedPsychologistWithSchedule?.workSchedule),
    [selectedPsychologistWithSchedule?.workSchedule]
  );

  const selectedPsychologistName = selectedPsychologistWithSchedule
    ? `${selectedPsychologistWithSchedule.firstName} ${selectedPsychologistWithSchedule.lastName}`
    : "Seleccione un psicólogo";

  const appointments = useMemo(
    () => appointmentEvents.map(mapEventToAppointment),
    [appointmentEvents]
  );

  const monthWeeks = generateMonthWeeks(visibleMonth);
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

  const blockPreview = useMemo<BlockPreview>(() => {
    if (form.mode !== "block") {
      return { creatableCount: 0, occupiedCount: 0, outOfScheduleCount: 0 };
    }

    const dates = getDatesBetween(parseDateInput(form.blockStartDate), parseDateInput(form.blockEndDate));
    const rules = getBlockRulesForPreview(
      blockScheduleMode,
      blockRules,
      blockWeekdays,
      form.blockStartHour,
      form.blockEndHour
    );
    const occupiedSlots = new Set(
      appointments.map((appointment) => getSlotKey(appointment.dateKey, appointment.startHour))
    );
    const preview: BlockPreview = { creatableCount: 0, occupiedCount: 0, outOfScheduleCount: 0 };

    dates.forEach((date) => {
      const weekdayIndex = getWeekdayIndex(date);
      const dateKey = getDateKey(date);
      const workSchedule = getWorkScheduleForWeekday(workSchedules, weekdayIndex);

      rules.forEach((rule) => {
        if (!rule.weekdays.includes(weekdayIndex)) return;

        for (let hour = rule.startHour; hour < rule.endHour; hour += 1) {
          const slot = { startHour: hour, endHour: hour + 1, label: formatSlotRange(hour, hour + 1) };
          const slotKey = getSlotKey(dateKey, hour);

          if (!isSlotInsideWorkSchedule(slot, workSchedule)) {
            preview.outOfScheduleCount += 1;
            continue;
          }

          if (occupiedSlots.has(slotKey)) {
            preview.occupiedCount += 1;
            continue;
          }

          preview.creatableCount += 1;
          occupiedSlots.add(slotKey);
        }
      });
    });

    return preview;
  }, [appointments, blockRules, blockScheduleMode, blockWeekdays, form, workSchedules]);

  const agendaToday = new Date();
  agendaToday.setHours(0, 0, 0, 0);
  const agendaTodayKey = getDateKey(agendaToday);
  const agendaWeekBounds = getWeekBounds(agendaToday);

  const weekAppointmentsCount = visibleAppointments.filter((appointment) =>
    isDateBetween(parseDateInput(appointment.dateKey), agendaWeekBounds.start, agendaWeekBounds.end)
  ).length;

  const nextAppointment = visibleAppointments.find((appointment) => {
    const appointmentDate = parseDateInput(appointment.dateKey);
    appointmentDate.setHours(appointment.startHour, 0, 0, 0);
    return appointmentDate >= new Date();
  });

  const filteredAgendaAppointments = visibleAppointments.filter((appointment) => {
    const appointmentDate = parseDateInput(appointment.dateKey);

    if (agendaFilter === "today") return appointment.dateKey === agendaTodayKey;
    if (agendaFilter === "week") return isDateBetween(appointmentDate, agendaWeekBounds.start, agendaWeekBounds.end);
    if (agendaFilter === "upcoming") {
      appointmentDate.setHours(appointment.startHour, 0, 0, 0);
      return appointmentDate >= new Date();
    }

    return true;
  });

  const groupedAgendaAppointments = filteredAgendaAppointments.reduce<
    Array<{ dateKey: string; date: Date; appointments: SchedulerAppointment[] }>
  >((groups, appointment) => {
    const existingGroup = groups.find((group) => group.dateKey === appointment.dateKey);
    if (existingGroup) {
      existingGroup.appointments.push(appointment);
      return groups;
    }

    groups.push({
      dateKey: appointment.dateKey,
      date: parseDateInput(appointment.dateKey),
      appointments: [appointment],
    });

    return groups;
  }, []);

  const getWeekKey = (weekIndex: number) =>
    `${visibleMonth.getFullYear()}-${visibleMonth.getMonth()}-${weekIndex}`;

  const toggleExpandedWeek = (weekKey: string) => {
    setExpandedWeekKeys((currentKeys) =>
      currentKeys.includes(weekKey)
        ? currentKeys.filter((currentKey) => currentKey !== weekKey)
        : [...currentKeys, weekKey]
    );
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    if (readOnly) return;

    const appointmentId = event.active.data.current?.appointmentId;
    const targetSlot = event.over?.data.current as DroppableSlotData | undefined;

    if (!appointmentId || !targetSlot || !selectedPsychologistId) return;

    const appointment = appointments.find((item) => item.id === appointmentId);
    if (
      appointment?.dateKey === targetSlot.dateKey &&
      appointment.startHour === targetSlot.startHour &&
      appointment.endHour === targetSlot.endHour
    ) {
      return;
    }

    try {
      await updateAppointmentMutation.mutateAsync({
        id: appointmentId,
        appointmentToUpdate: {
          startDate: createLocalIso(targetSlot.dateKey, targetSlot.startHour),
          endDate: createLocalIso(targetSlot.dateKey, targetSlot.endHour),
          psychologistId: selectedPsychologistId,
          officeId: targetSlot.officeId,
        },
      });
      await refetchAppointments();
      showAlert("Cita movida correctamente", "success");
    } catch (error) {
      showAlert(error instanceof Error ? error.message : "No se pudo mover la cita", "error");
    }
  };

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
      return {
        status: appointment.status === "CANCELED" ? "canceled" : "appointment",
        label: getAppointmentPatientName(appointment),
        appointmentId: appointment.id,
      };
    }

    if (!isSlotInsideWorkSchedule(slot, workSchedule)) {
      return { status: "unavailable" };
    }

    return { status: "available" };
  };

  const openCreateDialog = (day: CalendarDay, slot: TimeSlot) => {
    if (readOnly) return;

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
    setBlockScheduleMode("fixed");
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
    if (readOnly) return;
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
    setBlockScheduleMode("fixed");
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

    const nextRule: BlockRule = {
      id: createId(),
      weekdays: blockWeekdays,
      startHour: form.blockStartHour,
      endHour: form.blockEndHour,
    };

    if (blockRules.some((rule) => rulesOverlap(rule, nextRule))) {
      setFeedback("Esta regla se cruza con otra regla ya agregada.");
      return;
    }

    setBlockRules((currentRules) => [
      ...currentRules,
      nextRule,
    ]);
    setBlockWeekdays([]);
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

    if (blockScheduleMode === "custom" && blockRules.length === 0) {
      setFeedback("Agrega al menos una regla con días y horario antes de agendar.");
      return;
    }

    const rules =
      blockScheduleMode === "custom"
        ? blockRules
        : [
            {
              id: "fixed-rule",
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
    if (readOnly) return;

    try {
      await updateAppointmentStatus.mutateAsync({ id: appointmentId, status: "CANCELED" });
      await refetchAppointments();
      setAppointmentToCancel(null);
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
                  {!hidePsychologistSelector && (
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
                  )}
                  {isBusy && <Loading message="Cargando horario..." />}
                </div>

                <h2 className="mt-2 text-lg font-semibold text-senses-primary">
                  Disponibilidad de {selectedPsychologistName}
                </h2>
                {readOnly && (
                  <div className="mt-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                    Solo visualización
                  </div>
                )}
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

            {!readOnly && copiedAppointment && (
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
                <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                  <div className="min-w-[900px] text-xs">
                    {monthWeeks.map((week, weekIndex) => {
                      const weekKey = getWeekKey(weekIndex);
                      const isExpandedWeek = expandedWeekKeys.includes(weekKey);
                      const weekSlots = isExpandedWeek
                        ? [...shiftSlots.morning, ...shiftSlots.afternoon]
                        : shiftSlots[shift];

                      return (
                        <div
                          className="mb-3 grid grid-cols-[74px_repeat(7,minmax(105px,1fr))] last:mb-0"
                          key={weekKey}
                        >
                          <button
                            className="flex items-center justify-center border border-slate-200 bg-senses-primary px-1 text-[0.65rem] font-semibold text-white transition hover:bg-senses-primary/90 focus:outline-none focus:ring-2 focus:ring-senses-secondary"
                            onClick={() => toggleExpandedWeek(weekKey)}
                            type="button"
                          >
                            {isExpandedWeek ? "Reducir" : "Ampliar"}
                          </button>
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
                            {weekSlots.map((slot) => (
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
                              {weekSlots.map((slot) => {
                                if (!day) {
                                  return (
                                    <DroppableCalendarSlot
                                      disabled
                                      droppableId={`empty-${weekIndex}-${dayIndex}-${slot.startHour}`}
                                      key={slot.startHour}
                                      state={{ status: "empty" }}
                                    />
                                  );
                                }

                                const state = getSlotState(day, slot);
                                const appointment = getAppointmentForSlot(day.key, slot.startHour);
                                const workSchedule = getWorkScheduleForWeekday(workSchedules, day.weekdayIndex);
                            const targetSlot =
                              !readOnly && workSchedule && state.status === "available"
                                ? {
                                        date: day.date,
                                        dateKey: day.key,
                                        startHour: slot.startHour,
                                        endHour: slot.endHour,
                                        label: slot.label,
                                        officeId: workSchedule.officeId,
                                        officeName: workSchedule.officeName,
                                      }
                                    : undefined;

                                return (
                                  <DroppableCalendarSlot
                                    ariaLabel={
                                      appointment
                                        ? `Ver cita de ${getAppointmentPatientName(appointment)}`
                                    : readOnly
                                      ? `${getLongDateLabel(day.date)} de ${slot.label}`
                                      : `Crear cita el ${getLongDateLabel(day.date)} de ${slot.label}`
                                }
                                canDrag={!readOnly}
                                disabled={!targetSlot}
                                    droppableId={`slot-${day.key}-${slot.startHour}`}
                                    key={slot.startHour}
                                    onClick={
                                      appointment
                                        ? () => openAppointmentDetail(appointment)
                                        : !readOnly && state.status === "available"
                                          ? () => openCreateDialog(day, slot)
                                          : undefined
                                    }
                                    slotData={targetSlot}
                                    state={state}
                                  />
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </DndContext>
              </div>
            )}
          </main>

          {isAppointmentsPanelOpen && (
            <aside className="custom-scroll flex max-h-full w-full flex-col overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-sm xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] xl:w-80 xl:shrink-0">
              <div className="flex-1 p-5">
                <div className="mb-4 border-b border-slate-200 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-senses-primary">Agenda del mes</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        {readOnly
                          ? "Consulta tus próximas citas y disponibilidad."
                          : "Revisa, filtra y administra las citas del calendario."}
                      </p>
                    </div>
                    <Button
                      aria-label="Ocultar agenda del mes"
                      className="h-8 w-8 shrink-0 border-slate-300 bg-white p-0 text-slate-600 hover:bg-slate-100"
                      onClick={() => setIsAppointmentsPanelOpen(false)}
                      type="button"
                      variant="outline"
                    >
                      <FaChevronRight className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-md bg-senses-secondary/15 px-2 py-2 text-senses-primary">
                      <p className="text-base font-bold leading-none">{visibleAppointments.length}</p>
                      <p className="mt-1 text-[0.65rem] font-medium">Mes</p>
                    </div>
                    <div className="rounded-md bg-slate-100 px-2 py-2 text-slate-600">
                      <p className="text-base font-bold leading-none">{weekAppointmentsCount}</p>
                      <p className="mt-1 text-[0.65rem] font-medium">Semana</p>
                    </div>
                    <div className="rounded-md bg-slate-100 px-2 py-2 text-slate-600">
                      <p className="truncate text-[0.7rem] font-bold leading-none">
                        {nextAppointment ? formatHour(nextAppointment.startHour) : "-"}
                      </p>
                      <p className="mt-1 text-[0.65rem] font-medium">Próxima</p>
                    </div>
                  </div>

                  {nextAppointment && (
                    <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
                      Próxima: {getShortDateLabel(parseDateInput(nextAppointment.dateKey))} ·{" "}
                      {formatSlotRange(nextAppointment.startHour, nextAppointment.endHour)}
                    </p>
                  )}

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    {[
                      { value: "all", label: "Todas" },
                      { value: "today", label: "Hoy" },
                      { value: "week", label: "Semana" },
                      { value: "upcoming", label: "Próximas" },
                    ].map((filter) => (
                      <button
                        className={`rounded-full border px-2 py-1 font-semibold transition ${
                          agendaFilter === filter.value
                            ? "border-senses-primary bg-senses-primary text-white"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                        }`}
                        key={filter.value}
                        onClick={() => setAgendaFilter(filter.value as AgendaFilter)}
                        type="button"
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredAgendaAppointments.length === 0 ? (
                  <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                    No hay citas para el filtro seleccionado.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {groupedAgendaAppointments.map((group) => (
                      <section key={group.dateKey}>
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <h3 className="text-sm font-semibold text-senses-primary">
                            {getShortDateLabel(group.date)}
                          </h3>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.65rem] font-semibold text-slate-500">
                            {group.appointments.length} citas
                          </span>
                        </div>

                        <div className="space-y-2">
                          {group.appointments.map((appointment) => (
                            <div
                              className={`rounded-md border p-2 text-sm ${
                                appointment.status === "CANCELED"
                                  ? "border-senses-danger/30 bg-senses-danger/5"
                                  : "border-slate-200 bg-slate-50"
                              }`}
                              key={appointment.id}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <button
                                  className="min-w-0 flex-1 text-left"
                                  onClick={() => openAppointmentDetail(appointment)}
                                  type="button"
                                >
                                  <p className="text-xs font-semibold text-slate-500">
                                    {formatSlotRange(appointment.startHour, appointment.endHour)}
                                  </p>
                                  <p
                                    className={`truncate font-semibold ${
                                      appointment.status === "CANCELED"
                                        ? "text-senses-danger line-through"
                                        : "text-senses-primary"
                                    }`}
                                  >
                                    {getAppointmentPatientName(appointment)}
                                  </p>
                                  <p className="mt-1 truncate text-[0.65rem] text-slate-500">
                                    {appointment.type === "PARTICULAR" ? "Particular" : "Caso social"} · {appointment.officeName}
                                  </p>
                                  {appointment.status === "CANCELED" && (
                                    <span className="mt-1 inline-flex rounded-full bg-senses-danger/10 px-2 py-0.5 text-[0.6rem] font-semibold text-senses-danger">
                                      Cancelada
                                    </span>
                                  )}
                                </button>
                                {!readOnly && appointment.status !== "CANCELED" && (
                                  <Button
                                    aria-label={`Cancelar cita de ${getAppointmentPatientName(appointment)}`}
                                    className="h-7 w-7 shrink-0 border-senses-danger/30 bg-white p-0 text-senses-danger hover:bg-senses-danger/10 hover:text-senses-danger"
                                    onClick={() => setAppointmentToCancel(appointment)}
                                    type="button"
                                    variant="outline"
                                  >
                                    <FaTrashAlt className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>
      </div>

      <AlertDialog open={Boolean(appointmentToCancel)} onOpenChange={(open) => !open && setAppointmentToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar cita</AlertDialogTitle>
            <AlertDialogDescription>
              {appointmentToCancel
                ? `¿Deseas cancelar la cita de ${getAppointmentPatientName(appointmentToCancel)} el ${getShortDateLabel(
                    parseDateInput(appointmentToCancel.dateKey)
                  )} de ${formatSlotRange(appointmentToCancel.startHour, appointmentToCancel.endHour)}?`
                : "¿Deseas cancelar esta cita?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction
              className="bg-senses-danger text-white hover:bg-senses-danger/90"
              disabled={updateAppointmentStatus.isPending}
              onClick={(event) => {
                event.preventDefault();
                if (!appointmentToCancel) return;
                void handleCancelAppointment(appointmentToCancel.id);
              }}
            >
              {updateAppointmentStatus.isPending ? "Cancelando..." : "Cancelar cita"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                    Elige si todos los días usarán el mismo horario o si cada grupo de días tendrá su propia regla.
                  </p>
                </div>

                <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    className={`rounded-md border px-3 py-2 text-left text-sm transition ${
                      blockScheduleMode === "fixed"
                        ? "border-senses-primary bg-senses-primary text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-senses-primary/10 hover:text-senses-primary"
                    }`}
                    onClick={() => setBlockScheduleMode("fixed")}
                    type="button"
                  >
                    <span className="block font-semibold">Mismo horario</span>
                    <span className="mt-1 block text-xs opacity-80">Un horario para todos los días seleccionados.</span>
                  </button>
                  <button
                    className={`rounded-md border px-3 py-2 text-left text-sm transition ${
                      blockScheduleMode === "custom"
                        ? "border-senses-primary bg-senses-primary text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-senses-primary/10 hover:text-senses-primary"
                    }`}
                    onClick={() => setBlockScheduleMode("custom")}
                    type="button"
                  >
                    <span className="block font-semibold">Horarios distintos</span>
                    <span className="mt-1 block text-xs opacity-80">Agrega reglas como lunes 11-12 y viernes 2-3.</span>
                  </button>
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
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      {blockScheduleMode === "custom" ? "Días de esta regla" : "Días"}
                    </span>
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
                      {blockScheduleMode === "custom" ? "Hora inicio de esta regla" : "Hora inicio"}
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
                      {blockScheduleMode === "custom" ? "Hora fin de esta regla" : "Hora fin"}
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

                {blockScheduleMode === "custom" && (
                  <div className="mt-4 flex justify-end">
                    <Button
                      className="border-senses-primary text-senses-primary hover:bg-senses-primary/10"
                      onClick={handleAddBlockRule}
                      type="button"
                      variant="outline"
                    >
                      Agregar regla
                    </Button>
                  </div>
                )}

                {blockScheduleMode === "custom" && blockRules.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium text-slate-700">Reglas agregadas</p>
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

                <div className="mt-4 rounded-md border border-senses-secondary/30 bg-white p-3 text-sm">
                  <p className="font-semibold text-senses-primary">Resumen del bloque</p>
                  <div className="mt-2 grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
                    <span className="rounded-full bg-senses-secondary/15 px-2 py-1 text-senses-primary">
                      {blockPreview.creatableCount} citas por crear
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-1">
                      {blockPreview.occupiedCount} horarios ocupados
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-1">
                      {blockPreview.outOfScheduleCount} fuera de horario
                    </span>
                  </div>
                </div>
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
              {readOnly
                ? "Revisa la información de la cita."
                : "Revisa la información de la cita o cópiala para pegarla en otro horario."}
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

              <div>
                <span className="text-xs font-medium uppercase text-slate-500">Estado</span>
                <p
                  className={`font-semibold ${
                    selectedAppointmentDetail.status === "CANCELED" ? "text-senses-danger" : "text-slate-700"
                  }`}
                >
                  {selectedAppointmentDetail.status === "CANCELED" ? "Cancelada" : "Activa"}
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
            {!readOnly && selectedAppointmentDetail?.status !== "CANCELED" && (
              <Button
                className="bg-senses-primary text-white hover:bg-senses-primary/90"
                disabled={!selectedAppointmentDetail}
                onClick={handleCopyAppointment}
                type="button"
              >
                <Copy className="h-4 w-4" />
                Copiar cita
              </Button>
            )}
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
