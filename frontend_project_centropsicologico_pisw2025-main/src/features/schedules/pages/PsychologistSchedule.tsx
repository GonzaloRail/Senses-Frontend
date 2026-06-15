import { SiteHeader } from "@/shared/components/SiteHeader"
import { useNavigate, useParams } from "react-router"
import { useEffect, useState } from "react"
import { AppointmentDetailSheet } from "../components/AppointmentDetailSheet"
import { useBigCalendar } from "../hooks/useBigCalendar"
import { getAppointmentEventsByPsychologistApi } from "../api/schedulesApi"
import { queryClient } from "@/lib/queryClient"
import type { AppointmentEvent, AppointmentEventResource } from "@/shared/interfaces/apiResponses/getAllAppointmentEvents"
import { getUserByIdApi } from "@/features/systemUsers/api/systemUsersApi"
import type { User } from "@/shared/interfaces/models"
import { Loading } from "@/shared/components/Loading"

export const PsychologistSchedule = () => {
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);

  const { id } = useParams<{ id: string }>();
  const [psychologistName, setPsychologistName] = useState("")
  const [workSchedule, setWorkSchedule] = useState<any[] | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const [events, setEvents] = useState<{ title: string, start: Date, end: Date, resource: AppointmentEventResource }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const response = await queryClient.fetchQuery<AppointmentEvent[]>({
          queryKey: ["appointmenteventspsychologist", id],
          queryFn: () => getAppointmentEventsByPsychologistApi(id),
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
      const response = await queryClient.fetchQuery<User>({
        queryKey: ["appointmentpsychologistinfo", id],
        queryFn: () => getUserByIdApi({ id }),
      });

      setPsychologistName(`${response.firstName} ${response.lastName}`);
      setWorkSchedule(response.workSchedule); 
    };
    fetchPsychologistData();
  }, []);


  const { AppointmentCalendar, selectedEvent } = useBigCalendar({ events, setSheetOpen, type: "psychologist", workSchedule });

  if (loading) {
    return <Loading message="Cargando horario..."/>
  }

  return (
    <>
      <SiteHeader title={`Horario de ${psychologistName}`} backButton={true} onBackButtonClick={() => { navigate(-1) }} />
      <div className="p-5 w-full h-18/20 overflow-x-auto">
        <AppointmentCalendar />
      </div>
      <AppointmentDetailSheet open={sheetOpen} onOpenChange={setSheetOpen} selectedEvent={selectedEvent} />
    </>
  )
}
