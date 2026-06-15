import { SiteHeader } from "@/shared/components/SiteHeader"
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router"
import { useBigCalendar } from "../hooks/useBigCalendar";
import { AppointmentDetailSheet } from "../components/AppointmentDetailSheet"
import type { AppointmentEvent, AppointmentEventResource } from "@/shared/interfaces/apiResponses/getAllAppointmentEvents";
import { queryClient } from "@/lib/queryClient";
import type { Office } from "@/shared/interfaces/models";
import { getAppointmentEventsByOfficeApi, getOfficeNameByIdApi } from "../api/schedulesApi";
import { Loading } from "@/shared/components/Loading";

export const OfficeSchedule = () => {
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);

  const { id } = useParams<{ id: string }>();
  const [officeName, setOfficeName] = useState("")
  const [loading, setLoading] = useState(false);

  const [events, setEvents] = useState<{ title: string, start: Date, end: Date, resource: AppointmentEventResource }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const response = await queryClient.fetchQuery<AppointmentEvent[]>({
          queryKey: ["appointmenteventsoffice", id],
          queryFn: () => getAppointmentEventsByOfficeApi(id),
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
    const fetchOfficeData = async () => {
      if (!id) return;
      const response = await queryClient.fetchQuery<Office>({
        queryKey: ["appointmentofficeinfo", id],
        queryFn: () => getOfficeNameByIdApi(id),
      });

      setOfficeName(response.name);
    };
    fetchOfficeData();
  }, []);

  const { AppointmentCalendar, selectedEvent } = useBigCalendar({ events, setSheetOpen, type: "office" });

  if (loading) {
    return <Loading message="Cargando horario..."/>
  }

  return (
    <>
      <SiteHeader title={`Horario de ${officeName}`} backButton={true} onBackButtonClick={() => { navigate(-1) }} />
      <div className="p-5 w-full h-18/20 overflow-x-auto">
        <AppointmentCalendar />
      </div>
      <AppointmentDetailSheet open={sheetOpen} onOpenChange={setSheetOpen} selectedEvent={selectedEvent} />
    </>
  )
}
