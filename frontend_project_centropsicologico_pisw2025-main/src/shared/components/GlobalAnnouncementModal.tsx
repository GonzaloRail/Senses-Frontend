import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/store/auth/auth.store";

export const GlobalAnnouncementModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const roleSelected = useAuth((state) => state.roleSelected);

  // Simulamos que la alerta llega del backend después de cargar la página
  useEffect(() => {
    // Si no es psicólogo, ni siquiera armamos el timer
    if (roleSelected !== "PSYCHOLOGIST") return;

    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 1500); // Aparece 1.5 segundos después de entrar

    return () => clearTimeout(timer);
  }, [roleSelected]);

  const handleClose = () => {
    // Aquí en el futuro llamaremos a POST /api/alerts/:id/read
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md gap-4 overflow-hidden p-0 border-0 shadow-2xl">
        
        {/* Cabecera con Imagen/Banner de fondo */}
        <div className="relative h-48 w-full bg-slate-100 flex items-center justify-center overflow-hidden">
          {/* Imagen de prueba (Dummy Data) */}
          <img 
            src="https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=800&q=80" 
            alt="Anuncio de capacitación" 
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          />
          {/* Capa de oscurecimiento suave */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-senses-primary text-white text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                Aviso Importante
              </span>
            </div>
            <DialogTitle className="text-xl font-bold leading-tight drop-shadow-md">
              Actualización de Historiales Clínicos
            </DialogTitle>
          </div>
        </div>

        <div className="px-6 py-2">
          <DialogHeader>
            <DialogDescription className="text-base text-slate-700 leading-relaxed">
              Hola equipo, les informamos que a partir del lunes la nueva función de agrupamiento de pruebas y autocompletado estará activa en todas las cuentas. 
              <br /><br />
              <strong>Por favor, revisen sus bandejas y cierren las citas pendientes antes del fin de semana.</strong> Si tienen dudas, comuníquense con el administrador de sistemas.
            </DialogDescription>
          </DialogHeader>
        </div>

        <DialogFooter className="px-6 pb-6 pt-2 sm:justify-center">
          <Button 
            type="button" 
            onClick={handleClose}
            className="w-full sm:w-auto bg-senses-primary hover:bg-senses-primary/90 text-white font-medium px-8 py-2 rounded-full shadow-md transition-all hover:shadow-lg"
          >
            Entendido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
