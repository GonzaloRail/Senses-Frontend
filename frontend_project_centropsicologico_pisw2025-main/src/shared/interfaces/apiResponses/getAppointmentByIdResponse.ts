import type { AppointmentStatus } from "../models";

export interface AppointmentViewResponse {
  id: string;
  startDate: string; // ISO string UTC
  endDate: string; // ISO string UTC
  reason: string;
  status: AppointmentStatus;

  // Información del paciente
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    dni: string;
  };

  // Información del psicólogo
  user: {
    id: string;
    firstName: string;
    lastName: string;
    dni: string;
  };

  // Información del consultorio
  office: {
    id: string;
    name: string;
    type: string;
    capacity: number;
    location: {
      id: string;
      name: string;
      address: string;
    };
  };

  type: string;
  
  createdAt: string;
  updatedAt: string;
}
