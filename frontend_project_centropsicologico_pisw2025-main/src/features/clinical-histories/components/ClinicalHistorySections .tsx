import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  createPatientTestDocumentApi,
  createPatientTestApi,
} from "@/features/my-appointments/api/myAppointmentsApi";
import {
  useCreatePatientTest,
} from "@/features/my-appointments/hooks/usePatientTestMutations";
import { useAlert } from "@/shared/hooks/useAlert";
import { useSpinner } from "@/shared/hooks/useSpinner";
import type {
  ClinicalHistory,
  Evaluation,
  Section,
  Test,
} from "@/shared/interfaces/models";
import type { PatientTest } from "@/shared/interfaces/models/PatientTest";
import { uploadFileToCloudStorage } from "@/shared/utils/uploadFileToCloudStorage";
import { useAuth } from "@/store/auth/auth.store";
import { formatDateTime } from "@/shared/utils/formatters";
import {
  Download,
  FileText,
  Upload,
  ClipboardList,
  Clock,
  User,
  ChevronDown,
  ChevronRight,
  PlusCircle,
} from "lucide-react";
import { useRef, useState } from "react";
import { queryClient } from "@/lib/queryClient";
import { getFormTemplateByTestIdApi } from "@/features/evaluations/api/formTemplatesApi";
import { PDFDownloadButton } from "./PDFDownloadButton";
import {
  createFormSubmissionApi,
} from "@/features/evaluations/api/formSubmissionsApi";
import { FormFillerModal } from "../../my-appointments/components/FormFillerModal";

// ─── Subcomponente: historial de una aplicación individual ────────────────────

interface TestApplicationRowProps {
  patientTest: PatientTest;
  clinicalHistory: ClinicalHistory;
  onViewForm: (patientTest: PatientTest) => void;
  index: number;
  total: number;
  test: Test;
}

const TestApplicationRow = ({
  patientTest,
  clinicalHistory,
  onViewForm,
  index,
  total,
  test,
}: TestApplicationRowProps) => {
  const isForm = patientTest.submissionMode === "FORM";
  const hasDocument = !!patientTest.document?.fileUrl;

  // Fecha a mostrar: primero la de la cita, si no, la de completedAt
  const displayDate = patientTest.appointment?.startDate
    ? formatDateTime(patientTest.appointment.startDate)
    : patientTest.completedAt
    ? formatDateTime(patientTest.completedAt)
    : "Fecha desconocida";

  const psychologistName = patientTest.completedBy
    ? `Psic. ${patientTest.completedBy.firstName} ${patientTest.completedBy.lastName}`
    : null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.6rem 0.75rem",
        borderRadius: "0.5rem",
        backgroundColor: index % 2 === 0 ? "#f8fafc" : "#ffffff",
        border: "1px solid #e2e8f0",
        gap: "0.75rem",
      }}
    >
      {/* Línea vertical de historial */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "2px",
          minWidth: "20px",
        }}
      >
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: index === 0 ? "#4f46e5" : "#94a3b8",
            flexShrink: 0,
          }}
        />
        {index < total - 1 && (
          <div
            style={{
              width: "2px",
              height: "12px",
              backgroundColor: "#e2e8f0",
            }}
          />
        )}
      </div>

      {/* Info: fecha y psicólogo */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            fontSize: "0.85rem",
            fontWeight: 600,
            color: index === 0 ? "#4f46e5" : "#475569",
          }}
        >
          <Clock size={13} />
          <span>{displayDate}</span>
          {index === 0 && (
            <span
              style={{
                fontSize: "0.65rem",
                backgroundColor: "#eef2ff",
                color: "#4f46e5",
                padding: "1px 6px",
                borderRadius: "9999px",
                fontWeight: 700,
                border: "1px solid #c7d2fe",
              }}
            >
              Más reciente
            </span>
          )}
        </div>
        {psychologistName && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              fontSize: "0.75rem",
              color: "#64748b",
              marginTop: "2px",
            }}
          >
            <User size={11} />
            <span>{psychologistName}</span>
          </div>
        )}
      </div>

      {/* Botón de acción */}
      <div style={{ flexShrink: 0, display: "flex", gap: "0.5rem" }}>
        {isForm && patientTest.formSubmission ? (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onViewForm(patientTest)}
              style={{ fontSize: "0.75rem", height: "30px" }}
            >
              <ClipboardList size={13} style={{ marginRight: "4px" }} />
              Ver respuestas
            </Button>
            <PDFDownloadButton
              testName={test.name}
              patientTests={[patientTest]}
              testId={test.id}
              fieldsSchema={test.formTemplate?.fieldsSchema}
              clinicalHistory={clinicalHistory}
              label="Generar PDF"
            />
          </>
        ) : hasDocument ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              window.open(patientTest.document?.fileUrl, "_blank")
            }
            style={{ fontSize: "0.75rem", height: "30px" }}
          >
            <Download size={13} style={{ marginRight: "4px" }} />
            Descargar
          </Button>
        ) : (
          <span
            style={{
              fontSize: "0.7rem",
              color: "#94a3b8",
              fontStyle: "italic",
            }}
          >
            Sin archivo
          </span>
        )}
      </div>
    </div>
  );
};

// ─── Subcomponente: acciones del test (lista de aplicaciones + nueva) ─────────

const TestHistoryCard = ({
  test,
  clinicalHistory,
  setIsDataLoading,
  appointmentId,
}: {
  test: Test;
  clinicalHistory: ClinicalHistory;
  setIsDataLoading: (v: boolean) => void;
  appointmentId?: string;
}) => {
  const { user, roleSelected } = useAuth();
  const { showAlert } = useAlert();
  const { mutate: createPatientTest } = useCreatePatientTest();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isExpanded, setIsExpanded] = useState(
    test.patientTests.length > 0
  );

  // Modal de formulario
  const [isFormFillerOpen, setIsFormFillerOpen] = useState(false);
  const [activeFormData, setActiveFormData] = useState<{
    fieldsSchema: any[];
    formTemplateName: string;
    responseData?: any;
    isReadOnly: boolean;
    patientTestId?: string;
    formTemplateId?: string;
  } | null>(null);

  const isForm = !!test.formTemplate || test.patientTests[0]?.submissionMode === "FORM";
  const applicationsCount = test.patientTests.length;

  // Ver respuestas de un intento específico (modo lectura)
  const handleViewForm = async (patientTest: PatientTest) => {
    let template = test.formTemplate;
    if (!template) {
      setIsDataLoading(true);
      try {
        const fetched = await getFormTemplateByTestIdApi(test.id);
        if (fetched) template = fetched;
      } catch {
        showAlert("Esta prueba no tiene formulario digital configurado.", "error");
        setIsDataLoading(false);
        return;
      }
      setIsDataLoading(false);
    }
    if (template) {
      setActiveFormData({
        fieldsSchema: template.fieldsSchema,
        formTemplateName: template.name,
        responseData: patientTest.formSubmission?.responseData,
        isReadOnly: true,
      });
      setIsFormFillerOpen(true);
    }
  };

  // Nueva aplicación: formulario vacío para psicólogo
  const handleNewFormApplication = async () => {
    let template = test.formTemplate;
    if (!template) {
      setIsDataLoading(true);
      try {
        const fetched = await getFormTemplateByTestIdApi(test.id);
        if (fetched) template = fetched;
      } catch {
        showAlert("Esta prueba no tiene formulario digital configurado.", "error");
        setIsDataLoading(false);
        return;
      }
      setIsDataLoading(false);
    }
    if (template) {
      const lastSubmissionTest = test.patientTests?.find(
        (pt: any) => pt.submissionMode === "FORM" && pt.formSubmission?.responseData
      );
      const prefilledData = lastSubmissionTest ? lastSubmissionTest.formSubmission?.responseData : undefined;

      setActiveFormData({
        fieldsSchema: template.fieldsSchema,
        formTemplateName: template.name,
        responseData: prefilledData,
        isReadOnly: false,
        formTemplateId: template.id,
      });
      setIsFormFillerOpen(true);
    }
  };

  // Guardar nueva aplicación de formulario
  const handleSaveNewFormApplication = async (answers: Record<string, any>) => {
    if (!activeFormData?.formTemplateId) return;
    setIsDataLoading(true);
    try {
      const newPatientTest = await createPatientTestApi({
        testId: test.id,
        clinicalHistoryId: clinicalHistory.id,
        completedById: user?.id || "",
        isGeneralDoc: false,
        submissionMode: "FORM" as any,
        appointmentId,
      });
      if (!newPatientTest) {
        showAlert("Error al iniciar el registro de la prueba.", "error");
        return;
      }
      await createFormSubmissionApi({
        formTemplateId: activeFormData.formTemplateId,
        responseData: answers,
        completedById: user?.id || "",
        patientTestId: newPatientTest.id,
      });
      showAlert("Nueva aplicación del formulario guardada correctamente", "success");
      queryClient.invalidateQueries({ queryKey: ["clinical-history-sorted"] });
      queryClient.invalidateQueries({ queryKey: ["clinical-history"] });
    } catch (err) {
      console.error("Error al guardar nueva aplicación:", err);
      showAlert("Error al guardar el formulario.", "error");
    } finally {
      setIsDataLoading(false);
    }
  };

  // Subir nuevo archivo (nueva aplicación de documento)
  const handleNewFileApplication = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setIsDataLoading(true);
    const file = event.target.files?.[0];
    if (!file) { setIsDataLoading(false); return; }

    const filePath = await uploadFileToCloudStorage(
      file,
      clinicalHistory.patient?.dni ?? "Unknown",
      test.name
    );
    if (!filePath) {
      showAlert("Error al subir el archivo", "error");
      setIsDataLoading(false);
      return;
    }
    const document = await createPatientTestDocumentApi({
      name: file.name,
      type: "EVALUATION_TEST",
      filePath,
      userId: user?.id || "",
    });
    createPatientTest(
      {
        clinicalHistoryId: clinicalHistory.id,
        testId: test.id,
        documentId: document.id,
        completedById: user?.id || "",
        isGeneralDoc: false,
        appointmentId,
      },
      {
        onSuccess: () => {
          showAlert("Archivo subido correctamente", "success");
        },
      }
    );
    event.target.value = "";
    setIsDataLoading(false);
  };

  return (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: "0.625rem",
        overflow: "hidden",
        backgroundColor: "#ffffff",
      }}
    >
      {/* Header del test */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.75rem 1rem",
          cursor: "pointer",
          backgroundColor: "#f8fafc",
          borderBottom: isExpanded && applicationsCount > 0 ? "1px solid #e2e8f0" : "none",
        }}
        onClick={() => applicationsCount > 0 && setIsExpanded(!isExpanded)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          {applicationsCount > 0 ? (
            isExpanded ? (
              <ChevronDown size={16} color="#64748b" />
            ) : (
              <ChevronRight size={16} color="#64748b" />
            )
          ) : (
            <FileText size={16} color="#94a3b8" />
          )}
          <div>
            <p style={{ fontWeight: 600, fontSize: "0.9rem", margin: 0, color: "#1e293b" }}>
              {test.name}
            </p>
            <p style={{ fontSize: "0.72rem", color: "#64748b", margin: 0, marginTop: "1px" }}>
              {applicationsCount === 0
                ? "Sin aplicaciones registradas"
                : applicationsCount === 1
                ? "1 aplicación registrada"
                : `${applicationsCount} aplicaciones registradas`}
            </p>
          </div>
        </div>

        {/* Botones de acción en el header */}
        <div
          style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Botón de plantilla descargable */}
          {test.document?.fileUrl && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(test.document?.fileUrl, "_blank")}
              style={{ fontSize: "0.75rem", height: "30px" }}
            >
              <FileText size={13} style={{ marginRight: "4px" }} />
              Plantilla
            </Button>
          )}

          {/* Botones de reporte PDF */}
          {isForm && applicationsCount > 0 && (
            <>
              <PDFDownloadButton
                testName={test.name}
                patientTests={test.patientTests.filter(pt => pt.formSubmission)}
                testId={test.id}
                fieldsSchema={test.formTemplate?.fieldsSchema}
                clinicalHistory={clinicalHistory}
                label="Reporte completo"
                variant="outline"
              />
              <PDFDownloadButton
                testName={test.name}
                patientTests={[test.patientTests.find(pt => pt.formSubmission)!].filter(Boolean)}
                testId={test.id}
                fieldsSchema={test.formTemplate?.fieldsSchema}
                clinicalHistory={clinicalHistory}
                label="Generar último reporte"
                variant="outline"
              />
            </>
          )}

          {/* Botón para nueva aplicación (solo psicólogo y en cita) */}
          {roleSelected === "PSYCHOLOGIST" && appointmentId && (
            <>
              {isForm ? (
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleNewFormApplication}
                  style={{
                    fontSize: "0.75rem",
                    height: "30px",
                    backgroundColor: "#4f46e5",
                    color: "white",
                  }}
                >
                  <PlusCircle size={13} style={{ marginRight: "4px" }} />
                  {appointmentId ? "Actualizar datos" : "Nueva aplicación"}
                </Button>
              ) : (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleNewFileApplication}
                    className="hidden"
                  />
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      fontSize: "0.75rem",
                      height: "30px",
                      backgroundColor: "#4f46e5",
                      color: "white",
                    }}
                  >
                    <Upload size={13} style={{ marginRight: "4px" }} />
                    Subir archivo
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Lista cronológica de aplicaciones */}
      {isExpanded && applicationsCount > 0 && (
        <div
          style={{
            padding: "0.75rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.4rem",
          }}
        >
          {(appointmentId ? test.patientTests.slice(0, 1) : test.patientTests).map((pt, idx) => (
            <TestApplicationRow
              key={pt.id}
              patientTest={pt}
              clinicalHistory={clinicalHistory}
              onViewForm={handleViewForm}
              index={idx}
              total={applicationsCount}
              test={test}
            />
          ))}
        </div>
      )}

      {/* Modal de formulario */}
      {isFormFillerOpen && activeFormData && (
        <FormFillerModal
          isOpen={isFormFillerOpen}
          handleClose={() => {
            setIsFormFillerOpen(false);
            setActiveFormData(null);
          }}
          formTemplateName={activeFormData.formTemplateName}
          fieldsSchema={activeFormData.fieldsSchema}
          existingResponseData={activeFormData.responseData}
          isReadOnly={activeFormData.isReadOnly}
          patientDni={clinicalHistory.patient?.dni}
          onSave={handleSaveNewFormApplication}
        />
      )}
    </div>
  );
};

// ─── Subcomponente: documentos generales (sección default) ───────────────────

const DocumentLink = ({ name, url }: { name: string; url: string }) => (
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-2 p-3 rounded-md hover:bg-accent transition-colors"
  >
    <FileText className="w-4 h-4 text-muted-foreground" />
    <span className="text-sm">{name}</span>
  </a>
);

const DefaultSectionContent = ({ evaluation }: { evaluation: Evaluation }) => {
  const testsWithDocuments = evaluation.tests.filter(
    (test) => test.patientTests.length > 0
  );

  if (testsWithDocuments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground p-4">
        No hay documentos subidos para esta evaluación
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {testsWithDocuments.map((test) =>
        test.patientTests.map((patientTest) => {
          if (!patientTest.document) return null;
          return (
            <DocumentLink
              key={patientTest.id}
              name={test.name}
              url={patientTest.document.fileUrl!}
            />
          );
        })
      )}
    </div>
  );
};

// ─── Subcomponente: contenido de sección custom con historial ────────────────

const CustomSectionContent = ({
  evaluation,
  clinicalHistory,
  setIsDataLoading,
  appointmentId,
}: {
  evaluation: Evaluation;
  clinicalHistory: ClinicalHistory;
  setIsDataLoading: (v: boolean) => void;
  appointmentId?: string;
}) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {evaluation.tests.map((test) => (
        <TestHistoryCard
          key={test.id}
          test={test}
          clinicalHistory={clinicalHistory}
          setIsDataLoading={setIsDataLoading}
          appointmentId={appointmentId}
        />
      ))}
    </div>
  );
};

// ─── EvaluationAccordion ─────────────────────────────────────────────────────

const EvaluationAccordion = ({
  evaluation,
  isCustomSection,
  clinicalHistory,
  setIsDataLoading,
  appointmentId,
}: {
  evaluation: Evaluation;
  isCustomSection: boolean;
  clinicalHistory: ClinicalHistory;
  setIsDataLoading: (v: boolean) => void;
  appointmentId?: string;
}) => {
  return (
    <AccordionItem value={evaluation.id}>
      <AccordionTrigger className="hover:no-underline">
        <div className="flex flex-col items-start">
          <span className="font-semibold">{evaluation.name}</span>
          {evaluation.description && (
            <span className="text-xs text-muted-foreground">
              {evaluation.description}
            </span>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent>
        {isCustomSection ? (
          <CustomSectionContent
            evaluation={evaluation}
            clinicalHistory={clinicalHistory}
            setIsDataLoading={setIsDataLoading}
            appointmentId={appointmentId}
          />
        ) : (
          <DefaultSectionContent evaluation={evaluation} />
        )}
      </AccordionContent>
    </AccordionItem>
  );
};

// ─── SectionCard ─────────────────────────────────────────────────────────────

const SectionCard = ({
  section,
  clinicalHistory,
  setIsDataLoading,
  appointmentId,
}: {
  section: Section;
  clinicalHistory: ClinicalHistory;
  setIsDataLoading: (v: boolean) => void;
  appointmentId?: string;
}) => {
  const isCustomSection = !section.isDefault;

  return (
    <Accordion type="multiple" className="w-full mb-4">
      <AccordionItem value={section.id} className="border rounded-lg bg-white overflow-hidden">
        <AccordionTrigger className="px-4 py-3 hover:no-underline border-b">
          <h3 className="text-lg font-semibold m-0">{section.name}</h3>
        </AccordionTrigger>
        <AccordionContent className="p-4 bg-slate-50/50">
          <Accordion type="multiple" className="w-full">
            {section.evaluations.map((evaluation) => (
              <EvaluationAccordion
                key={evaluation.id}
                evaluation={evaluation}
                isCustomSection={isCustomSection}
                clinicalHistory={clinicalHistory}
                setIsDataLoading={setIsDataLoading}
                appointmentId={appointmentId}
              />
            ))}
          </Accordion>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const ClinicalHistorySections = ({
  sections,
  isLoading,
  clinicalHistory,
  appointmentId,
}: {
  sections: Section[] | undefined;
  isLoading: boolean;
  clinicalHistory: ClinicalHistory;
  appointmentId?: string;
}) => {
  const { Spinner, loading, setLoading } = useSpinner({
    initialLoading: isLoading,
  });
  if (loading) {
    return <Spinner />;
  }

  if (!sections || sections.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">
            No hay secciones disponibles
          </h2>
          <p className="text-sm text-muted-foreground">
            No se encontraron secciones para esta historia clínica
          </p>
        </div>
      </div>
    );
  }

  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  return (
    <div className="w-full">
      <div className="space-y-4">
        {sortedSections.map((section) => (
          <SectionCard
            key={section.id}
            section={section}
            clinicalHistory={clinicalHistory}
            setIsDataLoading={setLoading}
            appointmentId={appointmentId}
          />
        ))}
      </div>
    </div>
  );
};
