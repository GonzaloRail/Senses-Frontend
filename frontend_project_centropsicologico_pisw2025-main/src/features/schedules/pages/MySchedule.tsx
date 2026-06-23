import { AppointmentScheduler } from "@/features/appointments/components/AppointmentScheduler";
import { SiteHeader } from "@/shared/components/SiteHeader";
import { Loading } from "@/shared/components/Loading";
import { useAuth } from "@/store/auth/auth.store";

export const MySchedule = () => {
  const { user } = useAuth();

  if (!user?.id) {
    return <Loading message="Cargando horario..." />;
  }

  return (
    <>
      <SiteHeader title="Mi horario" />
      <AppointmentScheduler psychologistId={user.id} hidePsychologistSelector readOnly />
    </>
  );
};
