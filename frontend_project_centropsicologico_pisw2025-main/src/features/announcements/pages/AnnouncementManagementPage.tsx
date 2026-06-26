import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/api/api";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Send, Globe, CalendarClock, Users, CheckSquare, Square, Loader2, Filter } from "lucide-react";

// Diccionario para traducir los roles del backend a español
const ROLE_TRANSLATIONS: Record<string, string> = {
  "PSYCHOLOGIST": "Psicólogo",
  "ADMIN": "Administrador",
  "ADMISSION": "Admisión",
  "INTERNAL": "Interno",
  "PATIENT": "Paciente",
};

export const AnnouncementManagementPage = () => {
  const [activeTab, setActiveTab] = useState<"global" | "reminder">("global");
  
  // Fetch real users from backend
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users-for-reminders"],
    queryFn: async () => {
      const res = await api.get("/api/v1/users", { params: { page: 1, take: 100 } });
      return res.data.users; 
    }
  });

  const realUsers = useMemo(() => {
    if (!usersData) return [];
    return usersData.map((u: any) => {
      const rawRole = u.roles?.[0]?.role?.name || "USUARIO";
      const translatedRole = ROLE_TRANSLATIONS[rawRole] || rawRole;
      const displayName = `${u.firstName} ${u.lastName}`;
      return {
        id: u.id,
        name: displayName,
        role: translatedRole,
        rawRole: rawRole,
        initials: `${u.firstName?.[0] || ""}${u.lastName?.[0] || ""}`.toUpperCase()
      };
    });
  }, [usersData]);

  // States for Global Announcement (Mensajes Directos en Vivo)
  const [globalTitle, setGlobalTitle] = useState("");
  const [globalMessage, setGlobalMessage] = useState("");
  const [isSubmittingGlobal, setIsSubmittingGlobal] = useState(false);
  const [targetRoles, setTargetRoles] = useState({
    PSYCHOLOGIST: true,
    ADMIN: false,
    ADMISSION: false,
  });

  const handleGlobalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingGlobal(true);
    
    // Buscar todos los IDs de usuarios que tengan uno de los roles seleccionados
    const rolesToTarget = Object.entries(targetRoles)
      .filter(([_, isSelected]) => isSelected)
      .map(([role]) => role);
      
    if (rolesToTarget.length === 0) {
      toast.error("Selecciona al menos un rol de destino");
      setIsSubmittingGlobal(false);
      return;
    }

    const targetUsers = realUsers.filter((u: any) => rolesToTarget.includes(u.rawRole));
    
    if (targetUsers.length === 0) {
      toast.error("No hay usuarios en los roles seleccionados");
      setIsSubmittingGlobal(false);
      return;
    }

    try {
      // Disparar las notificaciones en vivo
      await Promise.all(
        targetUsers.map((user: any) => 
          api.post("/api/v1/notifications", {
            title: globalTitle,
            message: globalMessage,
            type: "SYSTEM_ALERT",
            userId: user.id
          })
        )
      );

      toast.success("¡Aviso Global publicado y enviado en tiempo real!", {
        description: `Enviado a ${targetUsers.length} usuarios exitosamente.`
      });
      setGlobalTitle("");
      setGlobalMessage("");
    } catch (error) {
      toast.error("Error al enviar el aviso global");
      console.error(error);
    } finally {
      setIsSubmittingGlobal(false);
    }
  };

  // States for Reminder (Eventos programados)
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventType, setEventType] = useState("MEETING");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>("TODOS");

  const filteredUsers = useMemo(() => {
    if (roleFilter === "TODOS") return realUsers;
    return realUsers.filter((u: any) => u.rawRole === roleFilter);
  }, [realUsers, roleFilter]);

  const uniqueRoles = useMemo(() => {
    const roles = new Set(realUsers.map((u: any) => u.rawRole));
    return Array.from(roles) as string[];
  }, [realUsers]);

  const createReminderMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post("/api/v1/admin/reminders", payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("¡Evento Programado Exitosamente!", {
        description: "El sistema enviará las alertas de forma automática."
      });
      setTitle("");
      setDescription("");
      setEventDate("");
      setEventType("MEETING");
      setSelectedUsers([]);
      setRoleFilter("TODOS");
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.message || "Ocurrió un error al conectar con el servidor.";
      toast.error("Error al programar el evento", { description: errorMsg });
    }
  });

  const allFilteredAreSelected = filteredUsers.length > 0 && filteredUsers.every((u: any) => selectedUsers.includes(u.id));

  const handleToggleAll = () => {
    if (allFilteredAreSelected) {
      const filteredIds = filteredUsers.map((u: any) => u.id);
      setSelectedUsers(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      const filteredIds = filteredUsers.map((u: any) => u.id);
      setSelectedUsers(prev => {
        const combined = new Set([...prev, ...filteredIds]);
        return Array.from(combined);
      });
    }
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleReminderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUsers.length === 0) {
      toast.error("Selección vacía", { description: "Por favor selecciona al menos un usuario destinatario."});
      return;
    }
    
    createReminderMutation.mutate({
      title,
      description: description || null,
      type: eventType,
      eventDate: new Date(eventDate).toISOString(),
      recipientIds: selectedUsers
    });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-senses-primary">
          Central de Alertas y Eventos
        </h1>
        <p className="text-senses-secondary font-medium text-lg">
          Gestiona los comunicados institucionales y programa eventos internos con alertas automáticas.
        </p>
      </div>

      <div className="flex p-1 bg-senses-primary/5 rounded-xl max-w-lg border border-senses-primary/10 shadow-sm">
        <button
          onClick={() => setActiveTab("global")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-sm transition-all ${
            activeTab === "global" 
              ? "bg-white text-senses-primary shadow-sm ring-1 ring-senses-primary/20" 
              : "text-senses-primary/60 hover:text-senses-primary hover:bg-senses-secondary/10"
          }`}
        >
          <Globe className="w-4 h-4" />
          Avisos Globales (En Vivo)
        </button>
        <button
          onClick={() => setActiveTab("reminder")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-sm transition-all ${
            activeTab === "reminder" 
              ? "bg-white text-senses-primary shadow-sm ring-1 ring-senses-primary/20" 
              : "text-senses-primary/60 hover:text-senses-primary hover:bg-senses-secondary/10"
          }`}
        >
          <CalendarClock className="w-4 h-4" />
          Programar Evento / Reunión
        </button>
      </div>

      {activeTab === "global" && (
        <Card className="border-senses-secondary/30 shadow-md animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="bg-senses-primary/5 border-b border-senses-secondary/20">
            <CardTitle className="text-senses-primary">Nuevo Aviso Global Instantáneo</CardTitle>
            <CardDescription className="text-senses-primary/70 font-medium">
              Este mensaje llegará de forma inmediata a la Campanita 🔔 de los roles seleccionados gracias a la conexión en tiempo real (WebSockets).
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleGlobalSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="global-title" className="text-base font-bold text-senses-primary">Título del Anuncio</Label>
                <Input 
                  id="global-title" 
                  value={globalTitle}
                  onChange={(e) => setGlobalTitle(e.target.value)}
                  placeholder="Ej. Actualización de sistema urgente..." 
                  className="text-lg py-6 border-senses-secondary/30 focus-visible:ring-senses-secondary" 
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="global-message" className="text-base font-bold text-senses-primary">Cuerpo del Mensaje</Label>
                <Textarea 
                  id="global-message" 
                  value={globalMessage}
                  onChange={(e) => setGlobalMessage(e.target.value)}
                  placeholder="Escribe los detalles del aviso aquí..." 
                  className="min-h-[150px] resize-none text-base leading-relaxed border-senses-secondary/30 focus-visible:ring-senses-secondary" 
                  required 
                />
              </div>

              <div className="space-y-3 pt-4 border-t border-senses-secondary/20">
                <Label className="text-base font-bold text-senses-primary">Enviar a todos los usuarios con el rol:</Label>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-3 border border-senses-secondary/30 p-4 rounded-lg bg-senses-primary/5 hover:bg-senses-secondary/10 transition-colors cursor-pointer">
                    <Checkbox 
                      id="role-psico" 
                      checked={targetRoles.PSYCHOLOGIST}
                      onCheckedChange={(c) => setTargetRoles(prev => ({...prev, PSYCHOLOGIST: !!c}))}
                      className="border-senses-secondary text-senses-primary" 
                    />
                    <Label htmlFor="role-psico" className="cursor-pointer font-bold text-senses-primary">Psicólogos</Label>
                  </div>
                  <div className="flex items-center space-x-3 border border-senses-secondary/30 p-4 rounded-lg bg-senses-primary/5 hover:bg-senses-secondary/10 transition-colors cursor-pointer">
                    <Checkbox 
                      id="role-admin" 
                      checked={targetRoles.ADMIN}
                      onCheckedChange={(c) => setTargetRoles(prev => ({...prev, ADMIN: !!c}))}
                      className="border-senses-secondary text-senses-primary" 
                    />
                    <Label htmlFor="role-admin" className="cursor-pointer font-bold text-senses-primary">Administradores</Label>
                  </div>
                  <div className="flex items-center space-x-3 border border-senses-secondary/30 p-4 rounded-lg bg-senses-primary/5 hover:bg-senses-secondary/10 transition-colors cursor-pointer">
                    <Checkbox 
                      id="role-admi" 
                      checked={targetRoles.ADMISSION}
                      onCheckedChange={(c) => setTargetRoles(prev => ({...prev, ADMISSION: !!c}))}
                      className="border-senses-secondary text-senses-primary" 
                    />
                    <Label htmlFor="role-admi" className="cursor-pointer font-bold text-senses-primary">Admisión / Recepción</Label>
                  </div>
                </div>
              </div>

              <div className="pt-6 flex items-center justify-end border-t border-senses-secondary/20">
                <Button type="submit" disabled={isSubmittingGlobal} className={`px-8 py-6 text-lg rounded-xl transition-all shadow-md hover:shadow-lg font-bold bg-senses-primary hover:bg-senses-primary/90 text-white`}>
                  {isSubmittingGlobal ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <Send className="mr-2 h-5 w-5" />}
                  {isSubmittingGlobal ? "Enviando en Vivo..." : "Publicar Aviso Global"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === "reminder" && (
        <Card className="border-senses-secondary/30 shadow-md animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
          <CardHeader className="bg-senses-primary/5 border-b border-senses-secondary/20">
            <CardTitle className="flex items-center gap-2 text-senses-primary">
              <CalendarClock className="h-6 w-6 text-senses-secondary" />
              Programar Evento Interno
            </CardTitle>
            <CardDescription className="text-senses-primary/70 font-medium">
              Crea un evento real. El sistema enviará alertas automáticamente a los usuarios seleccionados faltando 1 día, 1 hora y 15 minutos.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-0 p-0">
            <form onSubmit={handleReminderSubmit} className="flex flex-col md:flex-row h-full">
              
              <div className="flex-1 p-6 space-y-6 border-r border-senses-secondary/20 bg-white">
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-senses-secondary uppercase tracking-wider">Detalles del Evento</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="event-title" className="font-bold text-senses-primary">Título del Evento</Label>
                    <Input 
                      id="event-title" 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ej. Reunión Mensual de Casos Clínicos" 
                      className="text-base border-senses-secondary/30 focus-visible:ring-senses-secondary" 
                      required 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="event-date" className="font-bold text-senses-primary">Fecha y Hora</Label>
                      <Input 
                        id="event-date" 
                        type="datetime-local" 
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="text-base border-senses-secondary/30 focus-visible:ring-senses-secondary" 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="event-type" className="font-bold text-senses-primary">Tipo</Label>
                      <select 
                        id="event-type" 
                        value={eventType}
                        onChange={(e) => setEventType(e.target.value)}
                        className="flex h-10 w-full items-center justify-between rounded-md border border-senses-secondary/30 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-senses-secondary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="MEETING">Reunión</option>
                        <option value="TRAINING">Capacitación</option>
                        <option value="ADMINISTRATIVE">Trámite Administrativo</option>
                        <option value="OTHER">Otro</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="event-desc" className="font-bold text-senses-primary">Descripción (Opcional)</Label>
                    <Textarea 
                      id="event-desc" 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Detalles de la reunión, enlaces, etc..." 
                      className="min-h-[100px] resize-none border-senses-secondary/30 focus-visible:ring-senses-secondary" 
                    />
                  </div>
                </div>
              </div>

              <div className="w-full md:w-[400px] flex flex-col bg-senses-primary/5">
                <div className="p-4 border-b border-senses-secondary/20 bg-senses-primary/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-senses-primary" />
                    <h3 className="text-sm font-bold text-senses-primary">Usuarios Asignados</h3>
                  </div>
                  <span className="text-xs font-bold bg-senses-primary text-white px-3 py-1 rounded-full shadow-sm">
                    {selectedUsers.length} seleccionados
                  </span>
                </div>

                <div className="px-4 py-3 border-b border-senses-secondary/20 flex flex-col gap-3 bg-white">
                  
                  <div className="flex items-center gap-2 w-full">
                    <Filter className="w-4 h-4 text-senses-secondary" />
                    <select 
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="flex-1 text-sm rounded-md border border-senses-secondary/30 bg-background px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-senses-secondary"
                    >
                      <option value="TODOS">Todos los roles</option>
                      {uniqueRoles.map(role => (
                        <option key={role} value={role}>{ROLE_TRANSLATIONS[role] || role}</option>
                      ))}
                    </select>
                  </div>

                  <button 
                    type="button" 
                    onClick={handleToggleAll} 
                    className={`w-full py-2 rounded-md text-sm font-bold flex justify-center items-center gap-2 transition-all border ${
                      allFilteredAreSelected 
                        ? 'border-senses-danger text-senses-danger hover:bg-senses-danger/5' 
                        : 'border-senses-secondary text-senses-secondary hover:bg-senses-secondary/10'
                    }`}
                  >
                    {allFilteredAreSelected ? (
                      <><Square className="w-4 h-4" /> Desmarcar Todos ({filteredUsers.length})</>
                    ) : (
                      <><CheckSquare className="w-4 h-4" /> Marcar Todos ({filteredUsers.length})</>
                    )}
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[300px]">
                  {isLoadingUsers ? (
                    <div className="flex flex-col items-center justify-center h-full text-senses-secondary">
                      <Loader2 className="w-8 h-8 animate-spin mb-2" />
                      <p className="text-sm font-medium">Cargando usuarios...</p>
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center text-sm text-senses-primary/60 pt-10 font-medium">
                      No se encontraron usuarios para este rol.
                    </div>
                  ) : (
                    filteredUsers.map((user: any) => {
                      const isSelected = selectedUsers.includes(user.id);
                      return (
                        <div 
                          key={user.id}
                          onClick={() => toggleUser(user.id)}
                          className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-senses-secondary/15 border-senses-secondary shadow-sm' 
                              : 'bg-white border-transparent hover:border-senses-secondary/50 shadow-sm'
                          }`}
                        >
                          <input 
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="mr-3 w-4 h-4 accent-senses-primary pointer-events-none"
                          />
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold mr-3 shadow-inner ${isSelected ? 'bg-senses-primary text-white' : 'bg-senses-primary/10 text-senses-primary'}`}>
                            {user.initials}
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-bold ${isSelected ? 'text-senses-primary' : 'text-senses-primary/80'}`}>{user.name}</p>
                            <p className={`text-xs font-bold uppercase tracking-wider ${isSelected ? 'text-senses-secondary' : 'text-senses-primary/50'}`}>
                              {user.role}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                
                <div className="p-4 border-t border-senses-secondary/20 bg-white">
                  <Button type="submit" disabled={createReminderMutation.isPending || selectedUsers.length === 0} className={`w-full py-6 text-base rounded-xl transition-all shadow-md font-bold bg-senses-primary hover:bg-senses-primary/90 text-white disabled:bg-senses-primary/40`}>
                    {createReminderMutation.isPending ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <CalendarClock className="mr-2 h-5 w-5" />}
                    {createReminderMutation.isPending ? "Programando..." : "Programar Evento"}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

    </div>
  );
};
