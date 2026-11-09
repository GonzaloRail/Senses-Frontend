import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { attendanceError } from "../api/attendanceApi";

export function AttendanceReasonForm({ title, save, onClose }: {
  title: string;
  save: (reason: string) => Promise<void>;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: save,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["attendance"] });
      onClose();
    },
  });
  return (
    <form className="space-y-3 rounded-lg border p-4" onSubmit={(event) => {
      event.preventDefault();
      if (!mutation.isPending && reason.trim().length >= 10) mutation.mutate(reason.trim());
    }}>
      <h3 className="font-semibold">{title}</h3>
      <Label className="flex-col items-start">Motivo (mínimo 10 caracteres)
        <Textarea required minLength={10} value={reason} onChange={(event) => setReason(event.target.value)} />
      </Label>
      {mutation.isError && <p role="alert" className="text-destructive">{attendanceError(mutation.error, "No se pudo guardar el cambio.")}</p>}
      <div className="flex gap-2">
        <Button disabled={mutation.isPending || reason.trim().length < 10}>Confirmar</Button>
        <Button type="button" variant="outline" disabled={mutation.isPending} onClick={onClose}>Cancelar</Button>
      </div>
    </form>
  );
}
