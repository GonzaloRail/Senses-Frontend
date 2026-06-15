import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { testFormSchema, type TestFormSchema } from "@/shared/interfaces/forms/TestFormSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useAlert } from "@/shared/hooks/useAlert";

interface AddTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (test: {
    name: string;
    description: string;
    filename: string;
    testFile: File;
    isNew: boolean;
  }) => void;
}

export const AddTestModal = ({ isOpen, onSave, onClose }: AddTestModalProps) => {
  const { showAlert } = useAlert();
  const form = useForm<TestFormSchema>({
    resolver: zodResolver(testFormSchema),
    defaultValues: {
      testName: "",
      testDescription: "",
      testFile: undefined,
    },
  });

  const onSubmit: SubmitHandler<TestFormSchema> = (data) => {
    // Validar que el archivo existe
    if (!data.testFile || data.testFile.length === 0) {
      showAlert("Debe seleccionar un archivo", "error");
      return;
    }

    // Extraer el primer archivo del FileList
    const file = data.testFile[0];

    // Validar el nombre de la prueba
    if (!data.testName.trim()) {
      showAlert("El nombre de la prueba es requerido", "error");
      return;
    }

    // Pasar los datos al componente padre (sin crear nada en la BD)
    onSave({
      name: data.testName,
      description: data.testDescription || "",
      filename: file.name,
      testFile: file,
      isNew: true, // Flag para identificar que es una prueba nueva
    });

    // Resetear el formulario y cerrar el modal
    form.reset();
    onClose();
    showAlert("Prueba agregada temporalmente. Guarda la evaluación para confirmar.", "success");
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md gap-1">
        <DialogHeader>
          <DialogTitle className="font-bold text-senses-primary font-outfit">Agregar nueva plantilla Word</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} >
          <div className="flex flex-col flex-1">
            <div className="flex flex-col my-2 items-center ">

              <div className="grid gap-2 my-2 w-full max-w-md">

                <Label className="font-normal" htmlFor="testName">Nombre de la prueba</Label>
                <Input
                  id="testName"
                  placeholder="Ingresa el nombre de la prueba..."
                  {...form.register("testName")}
                />
                {
                  form.formState.errors.testName && (
                    <Label
                      className={`font-light ${form.formState.errors ? "text-red-500" : "text-slate-400"}`}
                      htmlFor="name">
                      {form.formState.errors.testName.message}
                    </Label>
                  )
                }

              </div>
              <div className="w-full max-w-md">
                <Label className="font-normal" htmlFor="testDescription">Descripción</Label>
                <Textarea
                  id="testDescription"
                  className="overflow-y-auto h-25 resize-none mt-3 max-w-md"
                  placeholder="Ingresa una descripción..."
                  {...form.register("testDescription")}
                />
              </div>
              <div className="grid gap-2 my-2 w-full max-w-md">
                <Label className="font-normal" htmlFor="testFile">Plantilla</Label>
                <Input
                  id="testFile"
                  type="file"
                  {...form.register("testFile")}
                />
                {
                  form.formState.errors.testFile && (
                    <Label
                      className={`font-light ${form.formState.errors ? "text-red-500" : "text-slate-400"}`}
                      htmlFor="name">
                      Debe adjuntar un archivo para la prueba
                    </Label>
                  )
                }
                {form.watch("testFile")?.[0] && (
                  <p className="text-sm text-muted-foreground">
                    Archivo seleccionado: {form.watch("testFile")[0].name}
                  </p>
                )}
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
              Guardar
            </Button>

          </DialogFooter>

        </form>

      </DialogContent>
    </Dialog>

  )
}
