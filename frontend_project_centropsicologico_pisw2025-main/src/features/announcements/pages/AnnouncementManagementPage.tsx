import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ImagePlus, Send } from "lucide-react";

export const AnnouncementManagementPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simular el tiempo de respuesta del servidor (backend incompleto)
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
    }, 1500);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Gestión de Comunicados
        </h1>
        <p className="text-slate-500">
          Crea y envía anuncios globales que aparecerán en la pantalla principal de los usuarios.
        </p>
      </div>

      <Card className="border shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b">
          <CardTitle>Nuevo Anuncio</CardTitle>
          <CardDescription>
            Completa los campos para publicar un nuevo aviso. (Prototipo Visual)
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Título */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-base font-semibold">Título del Anuncio</Label>
              <Input 
                id="title" 
                placeholder="Ej. Actualización de sistema el día viernes..." 
                className="text-lg py-6"
                required
              />
            </div>

            {/* Mensaje */}
            <div className="space-y-2">
              <Label htmlFor="message" className="text-base font-semibold">Cuerpo del Mensaje</Label>
              <Textarea 
                id="message" 
                placeholder="Escribe los detalles del anuncio aquí..." 
                className="min-h-[150px] resize-none text-base leading-relaxed"
                required
              />
            </div>

            {/* Imagen Destacada (Mock) */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Imagen Destacada (Opcional)</Label>
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer bg-white">
                <ImagePlus className="h-10 w-10 mb-3 text-slate-400" />
                <p className="font-medium">Haz clic para subir una imagen</p>
                <p className="text-xs text-slate-400 mt-1">PNG, JPG o GIF (Max. 2MB)</p>
              </div>
            </div>

            {/* Destinatarios */}
            <div className="space-y-3 pt-4 border-t">
              <Label className="text-base font-semibold">Destinatarios (Roles)</Label>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2 border p-4 rounded-lg bg-white shadow-sm">
                  <Checkbox id="role-psico" defaultChecked />
                  <Label htmlFor="role-psico" className="cursor-pointer">Psicólogos</Label>
                </div>
                <div className="flex items-center space-x-2 border p-4 rounded-lg bg-white shadow-sm">
                  <Checkbox id="role-admin" />
                  <Label htmlFor="role-admin" className="cursor-pointer">Administradores</Label>
                </div>
                <div className="flex items-center space-x-2 border p-4 rounded-lg bg-white shadow-sm">
                  <Checkbox id="role-admi" />
                  <Label htmlFor="role-admi" className="cursor-pointer">Admisión / Recepción</Label>
                </div>
              </div>
            </div>

            {/* Botón Guardar */}
            <div className="pt-6 flex items-center justify-end border-t">
              <Button 
                type="submit" 
                disabled={isSubmitting || isSuccess}
                className={`px-8 py-6 text-lg rounded-xl transition-all shadow-md hover:shadow-lg ${isSuccess ? 'bg-green-600 hover:bg-green-700' : 'bg-senses-primary hover:bg-senses-primary/90'}`}
              >
                {isSubmitting ? (
                  "Enviando..."
                ) : isSuccess ? (
                  "¡Anuncio Publicado!"
                ) : (
                  <>
                    <Send className="mr-2 h-5 w-5" />
                    Publicar Anuncio
                  </>
                )}
              </Button>
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  );
};
