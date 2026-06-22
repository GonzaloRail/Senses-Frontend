import { Loading } from "@/shared/components/Loading";
import {
  evaluationFormSchema,
  type EvaluationFormSchema,
} from "@/shared/interfaces/forms/EvaluationFormSchema";
import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router";
import { AddTestModal } from "../components/AddTestModal";
import { EvaluationBaseForm } from "../components/EvaluationBaseForm";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAlert } from "@/shared/hooks/useAlert";
import {
  useCreateEvaluation,
  useCreateTestBatch,
} from "../hooks/useEvaluationsMutations";
import { useAuth } from "@/store/auth/auth.store";
import { uploadFileToCloudStorage } from "@/shared/utils/uploadFileToCloudStorage";
import { createFormTemplateApi } from "../api/formTemplatesApi";

const mapFieldToBackend = (q: any, idx: number): any => {
  let type = q.type;
  if (type === "number") type = "NUMBER";
  else if (type === "checkbox") type = "CHECKBOX";
  else if (type === "select") type = "SELECT";
  else if (type === "text") type = "TEXT";

  return {
    id: q.id,
    label: q.label,
    type: type,
    required: q.required || false,
    order: q.order !== undefined ? q.order : idx,
    options: q.options || undefined,
    placeholder: q.placeholder || `Ingrese ${q.label.toLowerCase()}...`,
    helpText: q.helpText,
    isClinicalHistory: q.isClinicalHistory,
  };
};

const mapFormQuestionsToFieldsSchema = (questionsJsonStr: string) => {
  try {
    const parsed = JSON.parse(questionsJsonStr);
    
    // Retrocompatibilidad con esquemas planos
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].type !== undefined) {
      return [
        {
          id: "default_section",
          title: "Información General",
          order: 0,
          fields: parsed.map((q: any, idx: number) => mapFieldToBackend(q, idx)),
          subsections: [],
        },
      ];
    }

    return parsed.map((sec: any, secIdx: number) => ({
      id: sec.id,
      title: sec.title || `Sección ${secIdx + 1}`,
      order: sec.order !== undefined ? sec.order : secIdx,
      fields: (sec.fields || []).map((q: any, idx: number) => mapFieldToBackend(q, idx)),
      subsections: (sec.subsections || []).map((sub: any, subIdx: number) => ({
        id: sub.id,
        title: sub.title || `Subsección ${subIdx + 1}`,
        order: sub.order !== undefined ? sub.order : subIdx,
        fields: (sub.fields || []).map((q: any, idx: number) => mapFieldToBackend(q, idx)),
      })),
    }));
  } catch (e) {
    console.error("Error parsing templateContent", e);
    return [];
  }
};

export const CreateEvaluation = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  // PROTOTIPO HÍBRIDO: Un solo modal para carga de Word (el formulario se diseña inline)
  const [isAddTestModalOpen, setIsAddTestModalOpen] = useState(false);
  const { showAlert } = useAlert();

  const form = useForm<EvaluationFormSchema>({
    resolver: zodResolver(evaluationFormSchema),
    defaultValues: {
      name: "",
      description: "",
      isActive: true,
      openNewSection: false,
      psychologicalTests: [],
    },
  });

  const { mutate: createEvaluation } = useCreateEvaluation();
  const { mutate: createTestsBatch } = useCreateTestBatch();

  const handleAddTest = (test: {
    name: string;
    description: string;
    filename: string;
    testFile?: File;
    isNew: boolean;
    templateContent?: string;
  }) => {
    const currentTests = form.getValues("psychologicalTests");
    form.setValue("psychologicalTests", [...currentTests, test]);
  };

  const handleRemoveTest = (index: number) => {
    const currentTests = form.getValues("psychologicalTests");
    form.setValue(
      "psychologicalTests",
      currentTests.filter((_, i) => i !== index)
    );
    showAlert("Prueba eliminada", "success");
  };

  const uploadFile = async (
    file: File,
    customName: string
  ): Promise<string> => {
    return uploadFileToCloudStorage(file, user?.dni ?? "Unknown", customName);
  };

  const onSubmit: SubmitHandler<EvaluationFormSchema> = async (data) => {
    setLoading(true);
    try {
      // 1. Primero crear la evaluación
      const evaluationData = {
        name: data.name,
        description: data.description,
        createdById: user?.id || "",
        openNewSection: true,
      };

      // Crear la evaluación y obtener su ID
      const createdEvaluation = await new Promise<{ id: string }>((resolve) => {
        createEvaluation(
          { evaluationToCreate: evaluationData },
          {
            onSuccess: (evaluation) => {
              resolve(evaluation);
            },
          }
        );
      });

      // 2. Si hay pruebas, procesarlas (híbrido) y cargarlas al backend
      if (data.psychologicalTests && data.psychologicalTests.length > 0) {
        showAlert("Procesando pruebas e informes...", "info");

        // Procesar todos los tests por separado
        const testsWithUrls = await Promise.all(
          data.psychologicalTests.map(async (test) => {
            let filePath = "";
            // Si tiene plantilla de Word adjunta, la subimos a Supabase/Local
            if (test.testFile) {
              filePath = await uploadFile(test.testFile, test.filename);
            }
            
            return {
              name: test.name,
              description: test.description || "",
              filename: test.filename,
              filePath: filePath || "",
              evaluationId: createdEvaluation.id,
              createdById: user?.id,
              // PROTOTIPO HÍBRIDO: Agregamos el JSON de las preguntas que se guardará en Test.templateContent
              templateContent: (test as any).templateContent || null, 
            };
          })
        );

        console.log("Tests a crear en Base de Datos:", testsWithUrls);

        await new Promise<void>((resolve, reject) => {
          createTestsBatch(
            { testsToCreate: testsWithUrls },
            {
              onSuccess: async (batchResponse) => {
                // Si hay formularios dinámicos creados inline, los subimos a su respectiva API
                const createdTests = (batchResponse as any).tests || [];
                
                await Promise.all(
                  createdTests.map(async (createdTest: any, index: number) => {
                    const originalTest = data.psychologicalTests?.[index];

                    if (originalTest && (originalTest as any).templateContent) {
                      const fieldsSchema = mapFormQuestionsToFieldsSchema((originalTest as any).templateContent);
                      if (fieldsSchema.length > 0) {
                        try {
                          await createFormTemplateApi({
                            formTemplate: {
                              name: createdTest.name,
                              description: createdTest.description || "",
                              isDefault: false,
                              fieldsSchema,
                              createdById: user?.id || "",
                              testId: createdTest.id,
                            }
                          });
                        } catch (err) {
                          console.error("Error al registrar la plantilla digital de la prueba: " + createdTest.name, err);
                        }
                      }
                    }
                  })
                );

                showAlert(
                  `Evaluación creada con ${testsWithUrls.length} prueba(s)`,
                  "success"
                );
                resolve();
              },
              onError: (err) => {
                console.error("Error al crear pruebas:", err);
                reject(err);
              }
            }
          );
        });
      } else {
        showAlert("Evaluación creada correctamente", "success");
      }

      navigate("/evaluations");
    } catch (error) {
      console.error("Error creating evaluation:", error);
      showAlert("Error al crear la evaluación", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/evaluations");
  };

  if (loading) {
    return <Loading message="Creando evaluación..." />;
  }

  return (
    <>
      <EvaluationBaseForm
        form={form}
        onSubmit={onSubmit}
        onOpenTestModal={() => setIsAddTestModalOpen(true)}
        onRemoveTest={handleRemoveTest}
        mode="create"
        handleCancel={handleCancel}
        loading={loading}
      />
      {/* Modal: Carga de Word clásica */}
      <AddTestModal
        isOpen={isAddTestModalOpen}
        onClose={() => setIsAddTestModalOpen(false)}
        onSave={handleAddTest}
      />
    </>
  );
};
