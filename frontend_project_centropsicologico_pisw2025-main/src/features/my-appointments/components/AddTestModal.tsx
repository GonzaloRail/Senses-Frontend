import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { queryClient } from "@/lib/queryClient";
import type { AppointmentTest, TestOption } from "@/shared/interfaces/models";
import { useEffect, useState, type FormEvent } from "react";
import { getTestOptionsByEvaluationIdApi } from "../api/myAppointmentsApi";

interface AddTestModalProps {
  isOpen: boolean;
  handleClose: () => void;
  evaluationId: string;
  existingTests: AppointmentTest[];
  onAddTest: (evaluationId: string, newTest: AppointmentTest) => void;
}

export const AddTestModal = ({ isOpen, handleClose, evaluationId, existingTests, onAddTest }: AddTestModalProps) => {
  const [testsOptions, setTestsOptions] = useState<TestOption[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      const testsOptions = await queryClient.fetchQuery<TestOption[]>({
        queryKey: ["appointmentTestsOptions", evaluationId],
        queryFn: () => getTestOptionsByEvaluationIdApi(evaluationId),
      });
      setTestsOptions(testsOptions)
    };
    fetchData();
  }, [evaluationId]);

  const availableOptions = testsOptions.filter(
    option => !existingTests.some(test => test.testId === option.id)
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!selectedTestId) return;

    const selectedOption = testsOptions.find(opt => opt.id === selectedTestId);
    if (selectedOption) {
      onAddTest(evaluationId, {
        id: "",
        testId: selectedOption.id,
        name: selectedOption.name,
        templateUrl: selectedOption.document?.fileUrl || "",
      });
      setSelectedTestId("");
      handleClose();
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md gap-1">
        <DialogHeader>
          <DialogTitle>Agregar prueba</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} >
          <div className="flex flex-col flex-1">
            <div className="flex flex-col my-2 items-center ">

              <div className="grid gap-2 my-2 w-full max-w-md">

                <Label className="font-normal" htmlFor="evaluation">Prueba</Label>
                <Select name="evaluation" required onValueChange={(value) => setSelectedTestId(value)} value={selectedTestId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona una evaluación" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Pruebas disponibles</SelectLabel>
                      {
                        availableOptions.length === 0 ? (
                          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                            No hay evaluaciones disponibles
                          </div>
                        ) : (
                          availableOptions.map((test) => (
                            <SelectItem key={test.id} value={test.id}>{test.name}</SelectItem>
                          ))
                        )
                      }
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
              className="bg-senses-primary text-white hover:cursor-pointer hover:bg-senses-primary/80 hover:text-white">
              Agregar
            </Button>

          </DialogFooter>

        </form>

      </DialogContent>
    </Dialog>
  )
}
