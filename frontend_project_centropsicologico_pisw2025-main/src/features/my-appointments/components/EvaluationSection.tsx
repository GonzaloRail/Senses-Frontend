import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TestCard } from "./TestCard";
import { Button } from "@/components/ui/button";
import type { AppointmentTest } from "@/shared/interfaces/models";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface EvaluationSectionProps {
  id: string;
  name: string;
  tests: AppointmentTest[];
  openAddTestModal: () => void;
  onOverrideFile: () => Promise<boolean>;
  setSelectedEvaluationId: (evaluationId: string) => void;
  handleCreatePatientTest: ({
    patientTestId,
    templateTestId,
    file,
  }: {
    patientTestId: string;
    templateTestId: string;
    file: File;
  }) => Promise<void>;
  onFillForm?: (params: {
    patientTestId: string;
    templateTestId: string;
    formTemplateId: string;
    formTemplateName: string;
    fieldsSchema: any[];
    existingSubmission: any;
  }) => void;
  onRemoveEvaluation?: (id: string) => void;
}

export const EvaluationSection = ({
  id,
  name,
  tests,
  openAddTestModal,
  onOverrideFile,
  setSelectedEvaluationId,
  handleCreatePatientTest,
  onFillForm,
  onRemoveEvaluation,
}: EvaluationSectionProps) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <div className="text-lg font-semibold">{name}</div>
          <div className="flex gap-2">
            {onRemoveEvaluation && tests.length === 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    className="cursor-pointer bg-white text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                  >
                    Eliminar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Eliminar evaluación</AlertDialogTitle>
                    <AlertDialogDescription>
                      ¿Estás muy seguro de que deseas eliminar esta evaluación de la cita actual?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onRemoveEvaluation(id)}
                      className="bg-red-600 text-white hover:bg-red-700"
                    >
                      Quitar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => {
                setSelectedEvaluationId(id);
                openAddTestModal();
              }}
              className="cursor-pointer bg-senses-primary text-white hover:bg-senses-primary hover:text-white"
            >
              Añadir prueba
            </Button>
          </div>
        </CardTitle>
        <div className="flex flex-col gap-2 w-full mt-2">
          {tests.map((test) => (
            <TestCard
              key={test.id || test.testId}
              patientTestId={test.id}
              templateTestId={test.testId}
              name={test.name}
              templateUrl={test.templateUrl}
              uploadedFileName={test.uploadedFileName}
              uploadedFile={test.uploadedFile}
              onOverrideFile={onOverrideFile}
              handleCreatePatientTest={handleCreatePatientTest}
              submissionMode={test.submissionMode}
              formTemplate={test.formTemplate}
              formSubmission={test.formSubmission}
              onFillForm={onFillForm}
            />
          ))}
        </div>
      </CardHeader>
    </Card>
  );
};
