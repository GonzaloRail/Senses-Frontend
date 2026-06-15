import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { queryClient } from "@/lib/queryClient";
import type { AppointmentEvaluations, EvaluationOption } from "@/shared/interfaces/models";
import { useEffect, useState, type FormEvent } from "react";
import { getEvaluationOptionsApi } from "../api/myAppointmentsApi";

interface AddEvaluationModalProps {
  isOpen: boolean;
  handleClose: () => void;
  existingEvaluations: AppointmentEvaluations[];
  onAddEvaluation: (evaluationId: string, evaluationName: string) => void;
}

export const AddEvaluationModal = ({ isOpen, handleClose, existingEvaluations, onAddEvaluation }: AddEvaluationModalProps) => {

  const [evaluationOptions, setEvaluationOptions] = useState<EvaluationOption[]>([]);
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<string>("");

  useEffect(() => {
    const fetchEvaluationOptions = async () => {
      const options = await queryClient.fetchQuery<EvaluationOption[]>({
        queryKey: ["evaluationOptions"],
        queryFn: () => getEvaluationOptionsApi(),
      });
      setEvaluationOptions(options);
    };

    fetchEvaluationOptions();
  }, []);

  const availableOptions = evaluationOptions.filter(
    option => !existingEvaluations.some(evaluation => evaluation.id === option.id)
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!selectedEvaluationId) return;

    const selectedOption = evaluationOptions.find(opt => opt.id === selectedEvaluationId);
    if (selectedOption) {
      onAddEvaluation(selectedOption.id, selectedOption.name);
      setSelectedEvaluationId("");
      handleClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md gap-1">
        <DialogHeader>
          <DialogTitle>Agregar evaluación</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} >
          <div className="flex flex-col flex-1">
            <div className="flex flex-col my-2 items-center ">

              <div className="grid gap-2 my-2 w-full max-w-md">

                <Label className="font-normal" htmlFor="evaluation">Evaluación</Label>
                <Select name="evaluation" required value={selectedEvaluationId} onValueChange={setSelectedEvaluationId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona una evaluación" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Evaluaciones disponibles</SelectLabel>
                      {availableOptions.length === 0 ? (
                        <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                          No hay evaluaciones disponibles
                        </div>
                      ) : (
                        availableOptions.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectGroup>
                  </SelectContent>
                </Select>

              </div>
            </div>
          </div>
          <DialogFooter className="justify-end">
            <Button
              variant="outline"
              type="button"
              className="bg-senses-danger text-white hover:cursor-pointer hover:bg-senses-danger/80 hover:text-white"
              onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!selectedEvaluationId || availableOptions.length === 0}
              className="bg-senses-primary text-white hover:cursor-pointer hover:bg-senses-primary/80 hover:text-white">
              Agregar
            </Button>

          </DialogFooter>

        </form>

      </DialogContent>
    </Dialog>
  )
}
