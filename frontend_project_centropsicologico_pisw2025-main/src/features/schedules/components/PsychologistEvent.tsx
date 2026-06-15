import type { Event } from "react-big-calendar"

interface PsychologistEventProps {
  event: Event
  type: "psychologist" | "office"
}

export const PsychologistEvent = ({ event, type }: PsychologistEventProps) => {
  return (
    <div className="bg-senses-primary text-white p-1">
      {(type === "psychologist") && <div className="font-bold text-sm">{event.resource?.officeName}</div>}
      {(type === "office") && <div className="font-bold text-sm">{event.resource?.psychologistName}</div>}
      <div className="font-light text-sm">
        {event.resource?.patientName}
      </div>
    </div>
  )
}
