import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { TextWithLabel } from "@/shared/components/TextWithLabel";
import {
  calculateAgeString,
  getBirthdateString,
} from "@/shared/utils/formatters";
import { PlusIcon } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { EvaluationSection } from "../components/EvaluationSection";
import { AddEvaluationModal } from "../components/AddEvaluationModal";
import { useEffect, useState } from "react";
import { AddTestModal } from "../components/AddTestModal";
import { AlertConfirmAction } from "../components/AlertConfirmAction";
import { queryClient } from "@/lib/queryClient";
import type {
  AppointmentEvaluations,
  AppointmentTest,
  Patient,
} from "@/shared/interfaces/models";
import {
  createPatientTestApi,
  createPatientTestDocumentApi,
  getPatientByAppointmentIdApi,
  getPatientTestsByAppointmentIdApi,
  updateAppointmentStatusApi,
  updatePatientTestDocumentFileNameApi,
} from "../api/myAppointmentsApi";
import { EmptyState } from "@/shared/components/EmptyState";
import { useAuth } from "@/store/auth/auth.store";
import { useAlert } from "@/shared/hooks/useAlert";
import { uploadFileToCloudStorage } from "@/shared/utils/uploadFileToCloudStorage";
import { getFormTemplateByTestIdApi } from "@/features/evaluations/api/formTemplatesApi";
import { createFormSubmissionApi, updateFormSubmissionApi } from "@/features/evaluations/api/formSubmissionsApi";
import { FormFillerModal } from "../components/FormFillerModal";
import { getAllEvaluationsByClinicalHistoryIdSortedBySectionApi } from "@/features/clinical-histories/api/clinicalHistoriesApi";
import { ClinicalHistorySections } from "@/features/clinical-histories/components/ClinicalHistorySections ";

export const MyAppointmentInformation = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isAddEvaluationModalOpen, setIsAddEvaluationModalOpen] =
    useState(false);
  const [isAddTestModalOpen, setIsAddTestModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"session" | "history">("session");
  const { user } = useAuth();
  const { showAlert } = useAlert();

  const [isAlertFileOverrideOpen, setIsAlertFileOverrideOpen] = useState(false);
  const [resolveFileOverride, setResolveFileOverride] = useState<
    ((value: boolean) => void) | null
  >(null);

  const onConfirmFileOverride = () => {
    if (resolveFileOverride) resolveFileOverride(true);
    setIsAlertFileOverrideOpen(false);
  };
  const onCancelFileOverride = () => {
    if (resolveFileOverride) resolveFileOverride(false);
    setIsAlertFileOverrideOpen(false);
  };

  const onOverrideFile = () => {
    return new Promise<boolean>((resolve) => {
      setResolveFileOverride(() => resolve);
      setIsAlertFileOverrideOpen(true);
    });
  };

  const [alertCloseAppointmentOpen, setAlertCloseAppointmentOpen] =
    useState(false);

  const onConfirmCloseAppointment = async () => {
    await updateAppointmentStatusApi(id || "", { status: "DONE" });
    setAlertCloseAppointmentOpen(false);
    navigate("/my-appointments");
  };

  const onCancelCloseAppointment = () => {
    setAlertCloseAppointmentOpen(false);
  };

  const [patient, setPatient] = useState<Patient | null>(null);
  const [evaluations, setEvaluations] = useState<AppointmentEvaluations[]>([]);
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<string>("");
  const [clinicalHistorySections, setClinicalHistorySections] = useState<any[]>([]);

  // Dynamic form state
  const [isFormFillerOpen, setIsFormFillerOpen] = useState(false);
  const [activeFormFillerData, setActiveFormFillerData] = useState<{
    patientTestId: string;
    templateTestId: string;
    formTemplateId: string;
    formTemplateName: string;
    fieldsSchema: any[];
    existingSubmission: any;
    prefilledResponseData?: any;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const patient = await queryClient.fetchQuery<Patient>({
          queryKey: ["appointmentPatientInformation", id],
          queryFn: () => getPatientByAppointmentIdApi(id),
        });
        setPatient(patient);

        const evaluations = await queryClient.fetchQuery<
          AppointmentEvaluations[]
        >({
          queryKey: ["appointmentPatientTests", id],
          queryFn: () => getPatientTestsByAppointmentIdApi(id),
        });
        setEvaluations(evaluations);

        if (patient?.clinicalHistoryId) {
          const historySections = await getAllEvaluationsByClinicalHistoryIdSortedBySectionApi(
            patient.clinicalHistoryId
          );
          setClinicalHistorySections(historySections);
        }
      } catch (err) {
        console.error("Error al obtener datos del paciente o cita:", err);
      }
    };

    fetchData();
  }, [id]);

  const handleAddEvaluation = (
    evaluationId: string,
    evaluationName: string
  ) => {
    const newEvaluation: AppointmentEvaluations = {
      id: evaluationId,
      name: evaluationName,
      tests: [],
    };

    setEvaluations((prev) => [...prev, newEvaluation]);
  };

  const handleAddTest = (evaluationId: string, newTest: AppointmentTest) => {
    setEvaluations((prev) =>
      prev.map((evaluation) =>
        evaluation.id === evaluationId
          ? { ...evaluation, tests: [...evaluation.tests, newTest] }
          : evaluation
      )
    );
  };

  const handleCreatePatientTest = async ({
    patientTestId,
    templateTestId,
    file,
  }: {
    patientTestId: string;
    templateTestId: string;
    file: File;
  }) => {
    const evaluation = evaluations.find((evaluation) =>
      evaluation.tests.some((test) => test.testId === templateTestId)
    );
    const evaluationId = evaluation ? evaluation.id : "";

    const test = evaluation?.tests.find(
      (test) => test.testId === templateTestId
    );
    const testName = test?.name || "test";

    console.log(evaluations);

    if (patientTestId && test?.documentId) {
      const filePath = await uploadFileToCloudStorage(
        file,
        patient?.dni ?? "Unknown",
        test.name
      );

      if (!filePath) {
        showAlert("Error subiendo el archivo", "error");
        return;
      }

      const updatedDocument = await updatePatientTestDocumentFileNameApi(
        test.documentId,
        {
          name: file.name,
        }
      );

      if (!updatedDocument) {
        showAlert("Error actualizando el archivo", "error");
        return;
      }

      setEvaluations((prev) =>
        prev.map((evaluation) =>
          evaluation.id === evaluationId
            ? {
                ...evaluation,
                tests: evaluation.tests.map((test) =>
                  test.testId === templateTestId
                    ? {
                        ...test,
                        uploadedFileName: file.name,
                        uploadedFile: file,
                      }
                    : test
                ),
              }
            : evaluation
        )
      );
      showAlert("Archivo actualizado correctamente", "success");
      return;
    }
    const filePath = await uploadFileToCloudStorage(
      file,
      patient?.dni ?? "Unknown",
      testName
    );

    if (!filePath) {
      showAlert("Error subiendo el archivo", "error");
      return;
    }

    const document = await createPatientTestDocumentApi({
      name: file.name,
      type: "EVALUATION_TEST",
      filePath,
      userId: user?.id || "",
    });

    if (!document) {
      showAlert("Error creando el documento de la prueba", "error");
      return;
    }

    const newPatientTest = await createPatientTestApi({
      testId: templateTestId,
      clinicalHistoryId: patient?.clinicalHistoryId || "",
      completedById: user?.id || "",
      isGeneralDoc: false,
      appointmentId: id || "",
      documentId: document.id,
    });

    if (!newPatientTest) {
      showAlert("Error creando la prueba para el paciente", "error");
      return;
    }

    setEvaluations((prev) =>
      prev.map((evaluation) =>
        evaluation.id === evaluationId
          ? {
              ...evaluation,
              tests: evaluation.tests.map((test) =>
                test.testId === templateTestId
                  ? {
                      ...test,
                      id: newPatientTest.id,
                      documentId: document.id,
                      uploadedFileName: file.name,
                      uploadedFile: file,
                    }
                  : test
              ),
            }
          : evaluation
      )
    );
    showAlert("Prueba agregada correctamente", "success");
  };

  const onFillForm = async (params: {
    patientTestId: string;
    templateTestId: string;
    formTemplateId: string;
    formTemplateName: string;
    fieldsSchema: any[];
    existingSubmission: any;
  }) => {
    let fieldsSchema = params.fieldsSchema;
    let formTemplateId = params.formTemplateId;
    let formTemplateName = params.formTemplateName;

    if (!formTemplateId) {
      try {
        const template = await getFormTemplateByTestIdApi(params.templateTestId);
        if (template) {
          formTemplateId = template.id;
          formTemplateName = template.name;
          fieldsSchema = template.fieldsSchema;
        }
      } catch (err) {
        console.error("Error al obtener la plantilla del formulario:", err);
        showAlert("Esta prueba no tiene un formulario digital configurado.", "error");
        return;
      }
    }

    // Buscar respuestas previas en el historial de la historia clínica
    let prefilledResponseData = undefined;
    if (!params.existingSubmission && patient?.clinicalHistoryId) {
      let foundPreviousSubmission: any = null;

      for (const section of clinicalHistorySections) {
        for (const evaluation of section.evaluations || []) {
          for (const test of evaluation.tests || []) {
            if (test.id === params.templateTestId) {
              // Los patientTests ya vienen ordenados por completedAt desc (más reciente primero)
              const lastSubmissionTest = test.patientTests?.find(
                (pt: any) => pt.submissionMode === "FORM" && pt.formSubmission?.responseData
              );
              if (lastSubmissionTest) {
                foundPreviousSubmission = lastSubmissionTest.formSubmission;
                break;
              }
            }
          }
          if (foundPreviousSubmission) break;
        }
        if (foundPreviousSubmission) break;
      }

      if (foundPreviousSubmission) {
        prefilledResponseData = foundPreviousSubmission.responseData;
      }
    }

    setActiveFormFillerData({
      patientTestId: params.patientTestId,
      templateTestId: params.templateTestId,
      formTemplateId,
      formTemplateName,
      fieldsSchema,
      existingSubmission: params.existingSubmission,
      prefilledResponseData,
    });
    setIsFormFillerOpen(true);
  };

  const handleSaveFormAnswers = async (answers: Record<string, any>) => {
    if (!activeFormFillerData) return;
    const { patientTestId, templateTestId, formTemplateId } = activeFormFillerData;

    const evaluation = evaluations.find((evaluation) =>
      evaluation.tests.some((test) => test.testId === templateTestId)
    );
    const evaluationId = evaluation ? evaluation.id : "";

    try {
      let currentPatientTestId = patientTestId;

      if (!currentPatientTestId) {
        const newPatientTest = await createPatientTestApi({
          testId: templateTestId,
          clinicalHistoryId: patient?.clinicalHistoryId || "",
          completedById: user?.id || "",
          isGeneralDoc: false,
          appointmentId: id || "",
          submissionMode: "FORM" as any,
        });

        if (!newPatientTest) {
          showAlert("Error al iniciar el registro de la prueba.", "error");
          return;
        }
        currentPatientTestId = newPatientTest.id;
      }

      let savedSubmission: any;
      if (activeFormFillerData.existingSubmission) {
        savedSubmission = await updateFormSubmissionApi(
          activeFormFillerData.existingSubmission.id,
          {
            responseData: answers,
            patientTestId: currentPatientTestId,
          }
        );
        showAlert("Respuestas del formulario actualizadas correctamente", "success");
      } else {
        savedSubmission = await createFormSubmissionApi({
          formTemplateId,
          responseData: answers,
          completedById: user?.id || "",
          patientTestId: currentPatientTestId,
        });
        showAlert("Formulario guardado correctamente", "success");
      }

      setEvaluations((prev) =>
        prev.map((ev) => {
          if (ev.id === evaluationId) {
            return {
              ...ev,
              tests: ev.tests.map((t) => {
                if (t.testId === templateTestId) {
                  return {
                    ...t,
                    id: currentPatientTestId,
                    submissionMode: "FORM",
                    formSubmission: {
                      id: savedSubmission.id,
                      responseData: savedSubmission.responseData || answers,
                    },
                    formTemplate: t.formTemplate || {
                      id: formTemplateId,
                      name: activeFormFillerData.formTemplateName,
                      fieldsSchema: activeFormFillerData.fieldsSchema,
                    },
                  };
                }
                return t;
              }),
            };
          }
          return ev;
        })
      );
    } catch (err) {
      console.error("Error al guardar respuestas:", err);
      showAlert("Error al guardar el formulario.", "error");
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 flex flex-col">
        <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
          <SidebarTrigger className="-ml-1 cursor-pointer mt-4" />
        </div>
        <div className="flex flex-col w-full items-center px-4 mb-4">
          <h1 className="scroll-m-20 text-center text-3xl font-extrabold tracking-tight text-balance text-senses-primary lg:text-4xl">
            {patient?.firstName} {patient?.lastName}
          </h1>
          <div className="flex flex-col mt-3 w-fit mb-4">
            <TextWithLabel
              label="DNI"
              text={patient?.dni || "DNI no especificado"}
            />
            <TextWithLabel
              label="Fecha de nacimiento"
              text={
                patient
                  ? getBirthdateString(new Date(patient.birthdate))
                  : "Fecha no especificada"
              }
            />
            <TextWithLabel
              label="Edad"
              text={
                patient
                  ? calculateAgeString(new Date(patient.birthdate))
                  : "Edad no especificada"
              }
            />
            <TextWithLabel
              label="Religión"
              text={
                patient?.religion
                  ? patient.religion
                  : "Religión no especificada"
              }
            />
            <TextWithLabel
              label="Teléfono"
              text={
                patient?.phoneNumber
                  ? patient.phoneNumber
                  : "Número no especificado"
              }
            />
            {patient?.parentFullName && (
              <TextWithLabel
                label="Padre o madre"
                text={patient.parentFullName}
              />
            )}
            {patient?.parentDni && (
              <TextWithLabel
                label="DNI del padre o madre"
                text={patient.parentDni}
              />
            )}
            {patient?.parentPhoneNumber && (
              <TextWithLabel
                label="Número de contacto"
                text={patient.parentPhoneNumber}
              />
            )}
          </div>
          <div className="flex flex-col w-full items-center px-2 gap-3">
            <div className="w-full lg:w-8/10">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => {
                    setIsAddEvaluationModalOpen(true);
                  }}
                  className="cursor-pointer bg-senses-primary text-white hover:bg-senses-primary hover:text-white"
                >
                  <PlusIcon />
                  <span className="hidden lg:inline">Agregar evaluación</span>
                </Button>
              </div>
              <div className="w-full mt-6">
                <div className="flex border-b mb-4 gap-2">
                  <button
                    onClick={() => setActiveTab("session")}
                    className={`px-4 py-2 font-medium text-sm transition-colors outline-none cursor-pointer ${
                      activeTab === "session"
                        ? "border-b-2 border-senses-primary text-senses-primary"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Evaluaciones de la sesión
                  </button>
                  {patient?.clinicalHistoryId && (
                    <button
                      onClick={() => setActiveTab("history")}
                      className={`px-4 py-2 font-medium text-sm transition-colors outline-none cursor-pointer ${
                        activeTab === "history"
                          ? "border-b-2 border-senses-primary text-senses-primary"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Historial completo
                    </button>
                  )}
                </div>

                {activeTab === "session" && (
                  <div className="w-full flex gap-3 flex-col">
                    {evaluations.length > 0 ? (
                      evaluations.map((evaluation) => (
                        <EvaluationSection
                          key={evaluation.id}
                          {...evaluation}
                          openAddTestModal={() => {
                            setIsAddTestModalOpen(true);
                          }}
                          onOverrideFile={onOverrideFile}
                          setSelectedEvaluationId={setSelectedEvaluationId}
                          handleCreatePatientTest={handleCreatePatientTest}
                          onFillForm={onFillForm}
                          onRemoveEvaluation={(id) => {
                            setEvaluations((prev) => prev.filter((e) => e.id !== id));
                          }}
                        />
                      ))
                    ) : (
                      <EmptyState title="Aún no se han agregado evaluaciones" />
                    )}
                  </div>
                )}

                {activeTab === "history" && patient?.clinicalHistoryId && (
                  <div className="w-full flex gap-3 flex-col mt-2">
                    <ClinicalHistorySections
                      sections={clinicalHistorySections}
                      isLoading={false}
                      clinicalHistory={{ id: patient.clinicalHistoryId, patient } as any}
                      appointmentId={id}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col p-2 gap-3 pt-4 border-t w-full md:flex-row md:justify-end mt-auto">
          <Button
            variant={"destructive"}
            onClick={() => {
              setAlertCloseAppointmentOpen(true);
            }}
            className="flex items-center gap-2 cursor-pointer"
            type="button"
          >
            Cerrar cita
          </Button>
          <Button
            onClick={() => {
              navigate("/my-appointments");
            }}
            className="flex items-center gap-2 cursor-pointer"
            type="button"
          >
            Salir y guardar
          </Button>
        </div>
      </div>
      <AddEvaluationModal
        isOpen={isAddEvaluationModalOpen}
        handleClose={() => {
          setIsAddEvaluationModalOpen(false);
        }}
        existingEvaluations={evaluations}
        onAddEvaluation={handleAddEvaluation}
      />
      {selectedEvaluationId && (
        <AddTestModal
          isOpen={isAddTestModalOpen}
          handleClose={() => {
            setIsAddTestModalOpen(false);
          }}
          evaluationId={selectedEvaluationId}
          existingTests={
            evaluations.find(
              (evaluation) => evaluation.id === selectedEvaluationId
            )?.tests || []
          }
          onAddTest={handleAddTest}
        />
      )}

      <AlertConfirmAction
        title="Cargar nuevo archivo"
        description="Al subir un nuevo archivo, el archivo previamente cargado será reemplazado. ¿Desea continuar?"
        isOpen={isAlertFileOverrideOpen}
        onConfirm={onConfirmFileOverride}
        onCancel={onCancelFileOverride}
      />
      <AlertConfirmAction
        title="Cerrar cita"
        description="¿Está seguro que desea cerrar esta cita? Esta acción no se puede deshacer."
        isOpen={alertCloseAppointmentOpen}
        onConfirm={onConfirmCloseAppointment}
        onCancel={onCancelCloseAppointment}
      />

      {isFormFillerOpen && activeFormFillerData && (
        <FormFillerModal
          isOpen={isFormFillerOpen}
          handleClose={() => {
            setIsFormFillerOpen(false);
            setActiveFormFillerData(null);
          }}
          formTemplateName={activeFormFillerData.formTemplateName}
          fieldsSchema={activeFormFillerData.fieldsSchema}
          existingResponseData={
            activeFormFillerData.existingSubmission?.responseData ||
            activeFormFillerData.prefilledResponseData
          }
          patientDni={patient?.dni}
          onSave={handleSaveFormAnswers}
        />
      )}
    </div>
  );
};
