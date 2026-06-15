import React, { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { ClinicalReportPDF } from "./ClinicalReportPDF";
import { FileDown, Loader2 } from "lucide-react";
import { getFormTemplateByTestIdApi } from "@/features/evaluations/api/formTemplatesApi";
import type { PatientTest } from "@/shared/interfaces/models/PatientTest";
import type { ClinicalHistory } from "@/shared/interfaces/models/ClinicalHistory";
import logoUrl from "@/assets/logo-dark-cut.jpeg"; // asumiendo que vite permite importar jpeg

interface PDFDownloadButtonProps {
  testName: string;
  patientTests: PatientTest[];
  testId: string;
  clinicalHistory: ClinicalHistory;
  fieldsSchema?: any;
  label: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  style?: React.CSSProperties;
}

export const PDFDownloadButton: React.FC<PDFDownloadButtonProps> = ({
  testName,
  patientTests,
  testId,
  clinicalHistory,
  fieldsSchema,
  label,
  variant = "outline",
  size = "sm",
  className,
  style,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateAndDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (patientTests.length === 0) return;
    
    setIsGenerating(true);
    try {
      let resolvedSchema = fieldsSchema;
      
      // Intentar extraer el esquema directamente de la historia clínica en memoria
      // Utilizamos EXACTAMENTE la misma lógica del botón 'Ver respuestas' para buscar por pt.id
      if (!resolvedSchema && clinicalHistory) {
        (clinicalHistory as any).evaluations?.forEach((ev: any) => {
          ev.tests?.forEach((t: any) => {
            // Coincidencia estricta por testId o buscar en los patientTests si el test es el mismo
            if (t.id === testId || patientTests.some(pt => t.patientTests?.some((p: any) => p.id === pt.id))) {
              if (t.formTemplate?.fieldsSchema) {
                resolvedSchema = t.formTemplate.fieldsSchema;
              }
            }
          });
        });
      }

      // Si no existe localmente, consultarlo de la API (fallback)
      if (!resolvedSchema && testId) {
        try {
          const template = await getFormTemplateByTestIdApi(testId);
          resolvedSchema = template?.data?.fieldsSchema || template?.fieldsSchema;
        } catch (err) {
          console.error("Error fetching schema API:", err);
        }
      }

      console.log("PDFDownloadButton - resolvedSchema for", testName, ":", resolvedSchema);

      const doc = (
        <ClinicalReportPDF
          testName={testName}
          patientTests={patientTests}
          clinicalHistory={clinicalHistory}
          fieldsSchema={resolvedSchema}
          logoUrl={logoUrl}
        />
      );
      
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Reporte_${testName.replace(/\s+/g, "_")}_${new Date().getTime()}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      style={style}
      onClick={handleGenerateAndDownload}
      disabled={isGenerating || patientTests.length === 0}
    >
      {isGenerating ? (
        <Loader2 size={13} className="mr-1 animate-spin" />
      ) : (
        <FileDown size={13} className="mr-1" />
      )}
      {isGenerating ? "Generando..." : label}
    </Button>
  );
};
