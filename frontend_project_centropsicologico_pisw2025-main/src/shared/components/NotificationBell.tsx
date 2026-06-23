import { useState, useEffect, useCallback } from "react";
import { Bell, Check, CheckCheck } from "lucide-react";
import { io, Socket } from "socket.io-client";
import api from "@/api/api";
import { useAuth } from "@/store/auth/auth.store";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export const NotificationBell = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const accessToken = useAuth((state) => state.accessToken);

  // Cargar historial inicial
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get("/api/v1/notifications", { params: { take: 20 } });
      setNotifications(res.data.data || []);
    } catch (error) {
      console.error("Error fetching notifications", error);
    }
  }, []);

  useEffect(() => {
    if (!accessToken) return;

    fetchNotifications();

    // Conectar WebSocket
    const socket: Socket = io(import.meta.env.VITE_API_URL || "http://localhost:5000", {
      auth: { token: accessToken }
    });

    socket.on("connect", () => {
      console.log("WebSocket connected!");
    });

    socket.on("new_notification", (notification: Notification) => {
      // Agregar la nueva notificación al inicio de la lista
      setNotifications(prev => [notification, ...prev]);
      
      // Mostrar alerta flotante
      toast("Nueva Notificación", {
        description: notification.title,
        icon: <Bell className="text-senses-primary" />
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [accessToken, fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/api/v1/notifications/${id}/read`);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error("Error marking as read", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch("/api/v1/notifications/read-all");
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success("Todas marcadas como leídas");
    } catch (error) {
      console.error("Error marking all as read", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-senses-secondary/10">
          <Bell className="h-5 w-5 text-senses-primary" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-senses-danger text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-[380px] p-0 border-senses-secondary/20 shadow-xl overflow-hidden rounded-xl">
        <div className="flex items-center justify-between px-4 py-3 bg-senses-primary/5 border-b border-senses-secondary/20">
          <DropdownMenuLabel className="font-bold text-senses-primary text-base p-0">
            Notificaciones
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={(e) => {
                e.preventDefault();
                markAllAsRead();
              }}
              className="text-xs text-senses-secondary hover:text-senses-primary hover:bg-senses-secondary/10 h-8 px-2"
            >
              <CheckCheck className="w-3 h-3 mr-1" />
              Marcar todo como leído
            </Button>
          )}
        </div>
        
        <div className="max-h-[400px] overflow-y-auto custom-scroll">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-senses-primary/50 text-sm font-medium">
              <Bell className="w-8 h-8 mx-auto mb-3 opacity-20" />
              No tienes notificaciones
            </div>
          ) : (
            notifications.map((notif) => (
              <DropdownMenuItem
                key={notif.id}
                onClick={(e) => {
                  e.preventDefault(); // Evitar cerrar el menu si queremos
                  if (!notif.isRead) markAsRead(notif.id);
                }}
                className={`flex flex-col items-start px-4 py-3 cursor-pointer transition-colors focus:bg-senses-secondary/5 ${
                  notif.isRead 
                    ? 'bg-white opacity-70' 
                    : 'bg-senses-secondary/5 border-l-4 border-l-senses-secondary'
                }`}
              >
                <div className="flex items-start justify-between w-full mb-1">
                  <span className={`text-sm ${notif.isRead ? 'font-medium text-senses-primary/80' : 'font-bold text-senses-primary'}`}>
                    {notif.title}
                  </span>
                  {!notif.isRead && (
                    <span className="h-2 w-2 rounded-full bg-senses-secondary mt-1 flex-shrink-0" />
                  )}
                </div>
                <p className={`text-xs w-full line-clamp-2 ${notif.isRead ? 'text-senses-primary/60' : 'text-senses-primary/80 font-medium'}`}>
                  {notif.message}
                </p>
                <span className="text-[10px] text-senses-primary/40 mt-2 font-medium">
                  {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: es })}
                </span>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
