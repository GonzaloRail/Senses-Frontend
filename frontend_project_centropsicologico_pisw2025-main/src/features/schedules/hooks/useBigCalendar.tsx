import { Calendar, Views, dateFnsLocalizer, type Event, type EventProps, type SlotInfo } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from "date-fns"
import { es } from "date-fns/locale/es"
import { PsychologistEvent } from "../components/PsychologistEvent"
import { useState } from "react"
import 'react-big-calendar/lib/css/react-big-calendar.css'

interface UseBigCalendarProps {
  events: Event[]
  setSheetOpen: (open: boolean) => void
  type: "psychologist" | "office"
  workSchedule?: Array<{ day?: string; dayOfWeek?: string; startTime?: string; endTime?: string; officeId?: string }>
}

export const useBigCalendar = ({ events, setSheetOpen, type, workSchedule }: UseBigCalendarProps) => {
  const locales = {
    'es': es,
  }

  const DAY_INDEX_TO_NAME = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];

  const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
  })

  const handleSelectEvent = (event: Event) => {
    setSheetOpen(true);
    setSelectedEvent(event);
  }

  const handleSelectSlot = ({ start }: SlotInfo) => {
    if (view !== Views.MONTH) return;
    setDate(start);
    setView(Views.DAY);
  }

  const eventPropGetter = () => {
    return {
      style: {
        backgroundColor: "var(--color-senses-primary)",
        color: 'white',
        borderRadius: '8px',
        border: 'none',
        padding: '2px 4px',
      },
    }
  }

  const [view, setView] = useState('month')
  const [date, setDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const workingDays = new Set(
    (workSchedule || [])
      .map(s => (s.day || s.dayOfWeek || "").toString().toUpperCase())
      .filter(Boolean)
  );

  const isWorkingDay = (date: Date) => workingDays.has(DAY_INDEX_TO_NAME[getDay(date)]);

  const dayPropGetter = (date: Date) => {
    // Si no hay schedule, no pintar
    if (!workSchedule || workSchedule.length === 0) return {};
    if (!isWorkingDay(date)) {
      return {
        style: {
          backgroundColor: "rgba(0,0,0,0.1)",
        },
      };
    }
    return {};
  };

  const AppointmentCalendar = () => {
    return (
      <Calendar
        views={['month', 'week', 'day']}
        view={(view as 'month' | 'week' | 'day')}
        onView={nextView => {
          setView(nextView)
        }}

        date={date}
        onNavigate={nextDate => {
          setDate(nextDate)
        }}
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        className="h-full w-full"
        culture="es"
        onSelectEvent={handleSelectEvent}
        selectable
        onSelectSlot={handleSelectSlot}
        components={{
          event: (props: EventProps) => (<PsychologistEvent event={props.event} type={type} />),
        }}
        eventPropGetter={eventPropGetter}
        dayPropGetter={dayPropGetter}
        messages={
          {
            today: "Hoy",
            previous: "Atrás",
            next: "Siguiente",
            month: "Mes",
            week: "Semana",
            day: "Día",
          }
        }
      />
    )
  }
  return {
    AppointmentCalendar,
    selectedEvent,
  }
}