export interface AppointmentEventsResponse {
  events: AppointmentEvent[];
}

export interface AppointmentEvent {
  title: string;
  startDate: Date;
  endDate: Date;
  resource: AppointmentEventResource;
}

export interface AppointmentEventResource {
  id: string;
  officeName: string;
  psychologistName: string;
  patientName: string;
  status: string;
  type: string;
}