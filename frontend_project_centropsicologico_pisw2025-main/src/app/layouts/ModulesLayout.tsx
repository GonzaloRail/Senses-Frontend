import { useEffect } from "react";
import { Outlet } from "react-router";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/shared/components/AppSidebar";
import { useAuth } from "@/store/auth/auth.store";
import { useNotifications } from "@/store/notifications/notifications.store";

export const ModulesLayout = () => {
  const accessToken = useAuth((state) => state.accessToken);
  const userId = useAuth((state) => state.user?.id);
  const initSession = useNotifications((state) => state.initSession);
  const clearSession = useNotifications((state) => state.clearSession);

  // Inicializar la conexión WebSocket y notificaciones una sola vez por sesión
  useEffect(() => {
    if (accessToken && userId) {
      void initSession(accessToken, userId);
    } else {
      clearSession();
    }
  }, [accessToken, userId, initSession, clearSession]);

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset className="overflow-y-auto max-h-[calc(100dvh-1rem)] custom-scroll">
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
};
