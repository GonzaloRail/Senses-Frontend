import { SiteHeader } from "@/shared/components/SiteHeader"
import { useEffect, useState } from "react"
import { AppointmentDetailSheet } from "../components/AppointmentDetailSheet"
import { useBigCalendar } from "../hooks/useBigCalendar"
import { getAppointmentEventsByPsychologistApi } from "../api/schedulesApi"
import { queryClient } from "@/lib/queryClient"
import type { AppointmentEvent, AppointmentEventResource } from "@/shared/interfaces/apiResponses/getAllAppointmentEvents"
import { useAuth } from "@/store/auth/auth.store"
import type { User } from "@/shared/interfaces/models"
import { getUserByIdApi } from "@/features/systemUsers/api/systemUsersApi"
import { Loading } from "@/shared/components/Loading"

export const MySchedule = () => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [workSchedule, setWorkSchedule] = useState<any[] | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const id = user?.id;

  const [events, setEvents] = useState<{ title: string, start: Date, end: Date, resource: AppointmentEventResource }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        const response = await queryClient.fetchQuery<AppointmentEvent[]>({
          queryKey: ["myappointmentevents"],
          queryFn: () => getAppointmentEventsByPsychologistApi(user.id),
        });
  
        const data = response.map(event => ({
          title: event.title,
          start: new Date(event.startDate),
          end: new Date(event.endDate),
          resource: event.resource,
        }));
  
        setEvents(data);
      } catch (error) {
        console.log(error)
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchPsychologistData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const response = await queryClient.fetchQuery<User>({
          queryKey: ["appointmentpsychologistinfo", id],
          queryFn: () => getUserByIdApi({id}),
        });

        console.log("responmse: ", response)
  
        setWorkSchedule(response.workSchedule); 
      } catch (error) {
        console.log(error);        
      } finally {
        setLoading(false);
      }
    };
    fetchPsychologistData();
  }, []);

  const { AppointmentCalendar, selectedEvent } = useBigCalendar({ events, setSheetOpen, type: "psychologist", workSchedule });

  if (loading) {
    return <Loading message="Cargando horario..."/>
  }

  return (
    <>
      <SiteHeader title={`Mi horario`} />
      <div className="p-5 w-full h-18/20 overflow-x-auto">
        <AppointmentCalendar />
      </div>
      <AppointmentDetailSheet open={sheetOpen} onOpenChange={setSheetOpen} selectedEvent={selectedEvent} />
    </>
  )
}
