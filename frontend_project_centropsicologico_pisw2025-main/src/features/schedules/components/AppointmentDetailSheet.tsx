import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import type { Event } from "react-big-calendar"
import { format } from "date-fns"

interface AppointmentDetailSheetProps {
  open: boolean | undefined;
  onOpenChange: (open: boolean) => void;
  selectedEvent: Event | null;
}

export const AppointmentDetailSheet = ({ open, onOpenChange, selectedEvent }: AppointmentDetailSheetProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Detalles de cita</SheetTitle>
        </SheetHeader>
        <div className="grid flex-1 auto-rows-min gap-3 px-4">
          <div className="grid gap-1">
            <Label htmlFor="sheet-demo-username">Consultorio</Label>
            <Input id="sheet-demo-username" value={selectedEvent?.resource?.officeName} readOnly />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="sheet-demo-username">Psicólogo</Label>
            <Input id="sheet-demo-username" value={selectedEvent?.resource?.psychologistName} readOnly />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="sheet-demo-username">Paciente</Label>
            <Input id="sheet-demo-username" value={selectedEvent?.resource?.patientName} readOnly />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="sheet-demo-username">Fecha</Label>
            <Input id="sheet-demo-username" type="date" value={selectedEvent?.start ? format(selectedEvent.start as Date, "yyyy-MM-dd") : ""}  readOnly />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="sheet-demo-username">Hora de inicio</Label>
            <Input id="sheet-demo-username" type="time" value={selectedEvent?.start ? format(selectedEvent.start as Date, "HH:mm") : ""} readOnly />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="sheet-demo-username">Hora de fin</Label>
            <Input id="sheet-demo-username" type="time" value={selectedEvent?.end ? format(selectedEvent.end as Date, "HH:mm") : ""} readOnly />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="sheet-demo-username">Motivo</Label>
            <Textarea readOnly className="overflow-y-auto h-25 resize-none" value={selectedEvent?.title?.toString()} />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="sheet-demo-username">Tipo</Label>
            <Input id="sheet-demo-username" value={selectedEvent?.resource?.type} readOnly />
          </div>

        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button className="bg-senses-primary cursor-pointer">Cerrar</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
