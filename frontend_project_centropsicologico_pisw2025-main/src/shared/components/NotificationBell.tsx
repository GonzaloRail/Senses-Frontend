import { Bell, CheckCheck } from "lucide-react";
import { useNotifications } from "@/store/notifications/notifications.store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export const NotificationBell = () => {
  // Consumir el estado de notificaciones a nivel de sesión (sin instanciar ni desconectar WebSockets aquí)
  const notifications = useNotifications((state) => state.notifications);
  const unreadCount = useNotifications((state) => state.unreadCount);
  const markAsRead = useNotifications((state) => state.markAsRead);
  const markAllAsRead = useNotifications((state) => state.markAllAsRead);
  const isLoading = useNotifications((state) => state.isLoading);
  const error = useNotifications((state) => state.error);
  const fetchNotifications = useNotifications((state) => state.fetchNotifications);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Notificaciones, ${unreadCount} sin leer`} className="relative hover:bg-senses-secondary/10">
          <Bell className="h-5 w-5 text-senses-primary" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-senses-danger text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-[380px] max-w-[calc(100vw-2rem)] p-0 border-senses-secondary/20 shadow-xl overflow-hidden rounded-xl">
        <div className="flex items-center justify-between px-4 py-3 bg-senses-primary/5 border-b border-senses-secondary/20">
          <DropdownMenuLabel className="font-bold text-senses-primary text-base p-0">
            Notificaciones
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                void markAllAsRead();
              }}
              className="text-xs text-senses-secondary hover:text-senses-primary hover:bg-senses-secondary/10 h-8 px-2"
            >
              <CheckCheck className="w-3 h-3 mr-1" />
              Marcar todo como leído
            </Button>
          )}
        </div>
        
        <div className="max-h-[400px] overflow-y-auto custom-scroll">
          {error && (
            <div className="p-4 text-sm">
              <p role="alert">{error}</p>
              <Button variant="outline" size="sm" disabled={isLoading} onClick={() => void fetchNotifications()}>Reintentar</Button>
            </div>
          )}
          {isLoading && <p role="status" className="p-4 text-sm">Cargando notificaciones…</p>}
          {notifications.length === 0 && !isLoading && !error ? (
            <div className="p-8 text-center text-senses-primary/50 text-sm font-medium">
              <Bell className="w-8 h-8 mx-auto mb-3 opacity-20" />
              No tienes notificaciones
            </div>
          ) : (
            notifications.map((notif) => (
              <DropdownMenuItem
                key={notif.id}
                onSelect={(e) => {
                  e.preventDefault(); // Evitar cerrar el menú al hacer clic en Radix UI
                  if (!notif.isRead) void markAsRead(notif.id);
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
