import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
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
import { Checkbox } from "@/components/ui/checkbox";
import { uploadFileToCloudStorage } from "@/shared/utils/uploadFileToCloudStorage";
import { useAuth } from "@/store/auth/auth.store";
import { formatDateTime } from "@/shared/utils/formatters";
import {
  Download,
  FileText,
  Upload,
  Clock,
  User,
  ChevronDown,
  ChevronRight,
  PlusCircle,
  MoreHorizontal,
  FileDown,
  Eye,
  ArrowUpDown,
  CheckSquare,
} from "lucide-react";
import { useRef, useState } from "react";
import { queryClient } from "@/lib/queryClient";
import { getFormTemplateByTestIdApi } from "@/features/evaluations/api/formTemplatesApi";
import { getEvaluationByIdApi } from "@/features/evaluations/api/evaluationsApi";
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
  testTemplateMap?: Map<string, any>;
  isSelected?: boolean;
  onSelectToggle?: (patientTestId: string) => void;
  isExportMode?: boolean;
}

const TestApplicationRow = ({
  patientTest,
  clinicalHistory,
  onViewForm,
  index,
  total,
  test,
  testTemplateMap,
  isSelected,
  onSelectToggle,
  isExportMode,
}: TestApplicationRowProps) => {
  const isForm = patientTest.submissionMode === "FORM";
  const hasDocument = !!patientTest.document?.fileUrl;

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
        padding: "0.6rem 0.8rem",
        backgroundColor: "#fff",
        borderRadius: "0.5rem",
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
        {isExportMode && onSelectToggle && patientTest.formSubmission && (
          <Checkbox 
            checked={isSelected}
            onCheckedChange={() => onSelectToggle(patientTest.id)}
            className="data-[state=checked]:bg-senses-primary data-[state=checked]:border-senses-primary border-slate-300"
          />
        )}
        
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
      </div>

      <div style={{ flexShrink: 0, display: "flex", gap: "0.5rem" }}>
        {isForm && patientTest.formSubmission ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 border border-slate-200 hover:bg-slate-100">
                <span className="sr-only">Abrir opciones</span>
                <MoreHorizontal className="h-4 w-4 text-slate-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              <DropdownMenuItem onClick={() => onViewForm(patientTest)} className="cursor-pointer">
                <Eye className="mr-2 h-4 w-4 text-slate-500" />
                <span>Ver respuestas</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5" onClick={(e) => e.stopPropagation()}>
                <PDFDownloadButton
                  testName={test.name}
                  patientTests={[patientTest]}
                  testId={patientTest.testId || test.id}
                  fieldsSchema={testTemplateMap?.get(patientTest.testId || test.id)?.fieldsSchema || test.formTemplate?.fieldsSchema}
                  clinicalHistory={clinicalHistory}
                  label="Descargar PDF"
                  className="w-full justify-start px-2 h-8 font-normal text-sm hover:bg-slate-100 border-none shadow-none"
                  variant="ghost"
                />
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : hasDocument ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 border border-slate-200 hover:bg-slate-100">
                <span className="sr-only">Abrir opciones</span>
                <MoreHorizontal className="h-4 w-4 text-slate-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              <DropdownMenuItem onClick={() => window.open(patientTest.document?.fileUrl, "_blank")} className="cursor-pointer">
                <Download className="mr-2 h-4 w-4 text-slate-500" />
                <span>Descargar archivo</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
  testTemplateMap,
  evaluationId,
}: {
  test: Test;
  clinicalHistory: ClinicalHistory;
  setIsDataLoading: (v: boolean) => void;
  appointmentId?: string;
  testTemplateMap?: Map<string, any>;
  evaluationId: string;
}) => {
  const { user, roleSelected } = useAuth();
  const { showAlert } = useAlert();
  const { mutate: createPatientTest } = useCreatePatientTest();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isExpanded, setIsExpanded] = useState(
    test.patientTests.length > 0
  );

  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [isExportMode, setIsExportMode] = useState(false);
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());

  const [isFormFillerOpen, setIsFormFillerOpen] = useState(false);
  const [activeFormData, setActiveFormData] = useState<{
    fieldsSchema: any[];
    formTemplateName: string;
    responseData?: any;
    isReadOnly?: boolean;
    formTemplateId?: string;
    activeTestId?: string;
  } | null>(null);

  const applicationsCount = test.patientTests.length;
  const isForm = test.formTemplate !== undefined && test.formTemplate !== null;

  const sortedPatientTests = [...test.patientTests].sort((a, b) => {
    const dateA = new Date(a.appointment?.startDate || a.completedAt).getTime();
    const dateB = new Date(b.appointment?.startDate || b.completedAt).getTime();
    return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
  });

  const toggleSortOrder = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSortOrder(prev => prev === "desc" ? "asc" : "desc");
  };

  const handleToggleExportMode = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExportMode(!isExportMode);
    if (isExportMode) {
      setSelectedTests(new Set()); 
    }
  };

  const formSubmissionsOnly = sortedPatientTests.filter(pt => pt.formSubmission);
  const handleSelectAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedTests.size === formSubmissionsOnly.length && formSubmissionsOnly.length > 0) {
      setSelectedTests(new Set());
    } else {
      setSelectedTests(new Set(formSubmissionsOnly.map(pt => pt.id)));
    }
  };

  const handleSelectToggle = (patientTestId: string) => {
    setSelectedTests(prev => {
      const newSet = new Set(prev);
      if (newSet.has(patientTestId)) {
        newSet.delete(patientTestId);
      } else {
        newSet.add(patientTestId);
      }
      return newSet;
    });
  };

  const handleViewForm = async (patientTest: PatientTest) => {
    let template = testTemplateMap?.get(patientTest.testId || test.id) || test.formTemplate;
    if (!template) {
      setIsDataLoading(true);
      try {
        const fetched = await getFormTemplateByTestIdApi(patientTest.testId || test.id);
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
        activeTestId: patientTest.testId || test.id,
      });
      setIsFormFillerOpen(true);
    }
  };

  const handleNewFormApplication = async () => {
    setIsDataLoading(true);
    try {
      const fullEvaluation = await getEvaluationByIdApi(evaluationId);
      
      const testGroupKey = test.testGroupId || test.name.trim().toLowerCase();
      const activeTestVersion = fullEvaluation.tests?.find(
        (t: any) => 
          t.isActive && 
          (t.testGroupId ? t.testGroupId === testGroupKey : t.name.trim().toLowerCase() === testGroupKey)
      ) || test;

      let template = activeTestVersion.formTemplate;
      
      if (!template) {
        const fetched = await getFormTemplateByTestIdApi(activeTestVersion.id);
        if (fetched) template = fetched;
      }

      if (!template) {
        showAlert("Esta prueba no tiene formulario digital configurado.", "error");
        setIsDataLoading(false);
        return;
      }

      const lastSubmissionTest = sortedPatientTests.find(
        (pt: any) => pt.submissionMode === "FORM" && pt.formSubmission?.responseData
      );
      const prefilledData = lastSubmissionTest ? lastSubmissionTest.formSubmission?.responseData : undefined;

      if (lastSubmissionTest && lastSubmissionTest.testId !== activeTestVersion.id) {
        showAlert("El administrador ha modificado este formulario. Tus respuestas anteriores se han copiado a la nueva versión.", "info");
      }

      setActiveFormData({
        fieldsSchema: template.fieldsSchema,
        formTemplateName: template.name,
        responseData: prefilledData,
        isReadOnly: false,
        formTemplateId: template.id,
        activeTestId: activeTestVersion.id,
      });
      setIsFormFillerOpen(true);

    } catch (err) {
      console.error(err);
      showAlert("Error al cargar la versión activa de la prueba.", "error");
    } finally {
      setIsDataLoading(false);
    }
  };

  const handleSaveNewFormApplication = async (answers: Record<string, any>) => {
    if (!activeFormData?.formTemplateId || activeFormData.isReadOnly) return;
    setIsDataLoading(true);
    try {
      const newPatientTest = await createPatientTestApi({
        testId: activeFormData.activeTestId || test.id,
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
      setIsFormFillerOpen(false);
      setActiveFormData(null);
    }
  };

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

        <div
          style={{ display: "flex", gap: "0.5rem", flexShrink: 0, alignItems: "center" }}
          onClick={(e) => e.stopPropagation()}
        >
          {applicationsCount > 1 && !isExportMode && (
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-[30px] text-[0.75rem] px-2 text-slate-500 hover:text-slate-700"
              onClick={toggleSortOrder}
              title="Cambiar orden"
            >
              <ArrowUpDown size={14} className="mr-1" />
              {sortOrder === "desc" ? "Más recientes" : "Más antiguos"}
            </Button>
          )}

          {isExportMode ? (
            <>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-[30px] text-[0.75rem] px-2 text-slate-500 hover:text-slate-700"
                onClick={handleSelectAll}
              >
                <CheckSquare size={14} className="mr-1" />
                {selectedTests.size === formSubmissionsOnly.length && formSubmissionsOnly.length > 0 ? "Desmarcar todo" : "Marcar todo"}
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-[30px] text-[0.75rem] px-2 text-senses-danger hover:text-senses-danger hover:bg-red-50"
                onClick={handleToggleExportMode}
              >
                Cancelar
              </Button>
              <PDFDownloadButton
                testName={test.name}
                patientTests={sortedPatientTests.filter(pt => selectedTests.has(pt.id))}
                testId={test.id}
                fieldsSchema={test.formTemplate?.fieldsSchema}
                clinicalHistory={clinicalHistory}
                label={`Descargar (${selectedTests.size})`}
                variant="default"
                className="h-[30px] text-[0.75rem] bg-senses-primary hover:bg-senses-primary/90"
              />
            </>
          ) : (
            <>
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
              {isForm && formSubmissionsOnly.length > 0 && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-[30px] text-[0.75rem]"
                  onClick={handleToggleExportMode}
                >
                  <FileDown size={14} className="mr-1" />
                  Exportar
                </Button>
              )}
            </>
          )}

          {roleSelected === "PSYCHOLOGIST" && appointmentId && !isExportMode && (
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

      {isExpanded && applicationsCount > 0 && (
        <div
          style={{
            padding: "0.75rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem"
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {sortedPatientTests.map((patientTest, idx) => (
            <TestApplicationRow
              key={patientTest.id}
              patientTest={patientTest}
              clinicalHistory={clinicalHistory}
              onViewForm={handleViewForm}
              index={sortOrder === "desc" ? idx : applicationsCount - 1 - idx}
              total={applicationsCount}
              test={test}
              testTemplateMap={testTemplateMap}
              isSelected={selectedTests.has(patientTest.id)}
              onSelectToggle={handleSelectToggle}
              isExportMode={isExportMode}
            />
          ))}
        </div>
      )}

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
  const testTemplateMap = new Map<string, any>();
  const groupedTestsMap = new Map<string, Test>();

  evaluation.tests.forEach((test) => {
    const groupKey = test.testGroupId || test.name.trim().toLowerCase();

    if (test.formTemplate) {
      testTemplateMap.set(test.id, test.formTemplate);
    }

    if (!groupedTestsMap.has(groupKey)) {
      groupedTestsMap.set(groupKey, { ...test, patientTests: [...test.patientTests] });
    } else {
      const existingGroup = groupedTestsMap.get(groupKey)!;
      const combinedPatientTests = [...existingGroup.patientTests, ...test.patientTests];

      const isNewer = () => {
         if (test.isActive === true && existingGroup.isActive !== true) return true;
         if (test.isActive !== false && existingGroup.isActive === false) return true;
         if (test.createdAt && existingGroup.createdAt) {
            return new Date(test.createdAt).getTime() > new Date(existingGroup.createdAt).getTime();
         }
         return true; 
      };

      if (isNewer()) {
        groupedTestsMap.set(groupKey, { ...test, patientTests: combinedPatientTests });
      } else {
        existingGroup.patientTests = combinedPatientTests;
      }
    }
  });

  const groupedTests = Array.from(groupedTestsMap.values()).map(group => {
    group.patientTests.sort((a, b) => {
      const dateA = new Date(a.appointment?.startDate || a.completedAt).getTime();
      const dateB = new Date(b.appointment?.startDate || b.completedAt).getTime();
      return dateB - dateA;
    });
    return group;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {groupedTests.map((test) => (
        <TestHistoryCard
          key={test.id}
          test={test}
          clinicalHistory={clinicalHistory}
          setIsDataLoading={setIsDataLoading}
          appointmentId={appointmentId}
          testTemplateMap={testTemplateMap}
          evaluationId={evaluation.id}
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
