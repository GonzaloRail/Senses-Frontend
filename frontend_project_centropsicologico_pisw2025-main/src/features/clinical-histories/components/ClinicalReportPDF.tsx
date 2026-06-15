import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import type { FormSectionPayload } from "@/features/evaluations/api/formTemplatesApi";
import type { PatientTest } from "@/shared/interfaces/models/PatientTest";
import type { ClinicalHistory } from "@/shared/interfaces/models/ClinicalHistory";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Buffer } from "buffer";

if (typeof window !== "undefined") {
  window.Buffer = window.Buffer || Buffer;
}

const ensureHierarchicalSchema = (schema: any[]): FormSectionPayload[] => {
  if (!schema || schema.length === 0) return [];
  // Si el primer elemento tiene un tipo de campo, es un esquema plano antiguo
  if (schema[0] && (schema[0] as any).type !== undefined) {
    return [
      {
        id: "default_section",
        title: "Información General",
        order: 0,
        fields: schema as any[],
        subsections: [],
      },
    ];
  }
  return schema as FormSectionPayload[];
};

// Definición de estilos para el PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
    paddingBottom: 10,
  },
  logo: {
    width: 100,
  },
  headerInfo: {
    alignItems: "flex-end",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 2,
  },
  patientInfoBox: {
    backgroundColor: "#f8fafc",
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    border: "1px solid #e2e8f0",
  },
  patientInfoCol: {
    width: "50%",
    marginBottom: 5,
  },
  infoLabel: {
    fontSize: 9,
    color: "#64748b",
    fontWeight: "bold",
  },
  infoValue: {
    fontSize: 10,
    color: "#0f172a",
    marginTop: 1,
  },
  testDateHeader: {
    backgroundColor: "#e0e7ff",
    padding: 8,
    marginTop: 15,
    marginBottom: 10,
    borderRadius: 4,
  },
  testDateText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#3730a3",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1e293b",
    marginTop: 15,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    paddingBottom: 3,
  },
  subsectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#334155",
    marginTop: 10,
    marginBottom: 6,
  },
  fieldRow: {
    marginBottom: 8,
    flexDirection: "column",
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#475569",
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 10,
    color: "#0f172a",
    lineHeight: 1.4,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 8,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 10,
  },
});

interface ClinicalReportPDFProps {
  testName: string;
  patientTests: PatientTest[];
  clinicalHistory: ClinicalHistory;
  fieldsSchema: any;
  logoUrl?: string; // Lo pasaremos como string o base64
}

const renderValue = (value: any) => {
  if (value === null || value === undefined || value === "") return "-";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Sí" : "No";
  return String(value);
};

export const ClinicalReportPDF: React.FC<ClinicalReportPDFProps> = ({
  testName,
  patientTests,
  clinicalHistory,
  fieldsSchema,
  logoUrl,
}) => {
  const patient = clinicalHistory.patient;

  // Resolvemos el schema de forma global para todo este test
  let rawSchema: any[] = [];
  try {
    rawSchema =
      typeof fieldsSchema === "string"
        ? JSON.parse(fieldsSchema)
        : fieldsSchema || [];
  } catch (e) {
    console.error("Error parsing schema in PDF", e);
  }

  const schema: FormSectionPayload[] = ensureHierarchicalSchema(rawSchema);

  return (
    <Document>
      {/* Iteramos sobre cada aplicación (útil para historial completo). Cada test puede tomar su página. */}
      {patientTests.map((pt) => {
        const answers = pt.formSubmission?.responseData || {};

        return (
          <Page key={pt.id} size="A4" style={styles.page}>
            {/* Cabecera */}
            <View style={styles.header}>
              <View>
                {logoUrl ? (
                  <Image style={styles.logo} src={logoUrl} />
                ) : (
                  <Text style={styles.title}>Senses Psicólogos</Text>
                )}
              </View>
              <View style={styles.headerInfo}>
                <Text style={styles.title}>Reporte Clínico</Text>
                <Text style={styles.subtitle}>{testName}</Text>
              </View>
            </View>

            {/* Datos del Paciente (Solo en la primera página o al inicio de cada reporte) */}
            <View style={styles.patientInfoBox}>
              <View style={styles.patientInfoCol}>
                <Text style={styles.infoLabel}>Paciente:</Text>
                <Text style={styles.infoValue}>
                  {patient?.firstName} {patient?.lastName}
                </Text>
              </View>
              <View style={styles.patientInfoCol}>
                <Text style={styles.infoLabel}>DNI:</Text>
                <Text style={styles.infoValue}>{patient?.dni || "-"}</Text>
              </View>
              <View style={styles.patientInfoCol}>
                <Text style={styles.infoLabel}>Psicólogo Responsable:</Text>
                <Text style={styles.infoValue}>
                  {pt.completedBy?.firstName} {pt.completedBy?.lastName}
                </Text>
              </View>
              <View style={styles.patientInfoCol}>
                <Text style={styles.infoLabel}>Fecha de Aplicación:</Text>
                <Text style={styles.infoValue}>
                  {pt.completedAt
                    ? format(new Date(pt.completedAt), "dd 'de' MMMM, yyyy - hh:mm a", {
                        locale: es,
                      })
                    : "-"}
                </Text>
              </View>
            </View>

            {/* Iterador de Esquema */}
            <View>
              {schema.length === 0 && (
                <Text style={styles.infoLabel}>No se pudieron procesar las preguntas de este formulario.</Text>
              )}
              {schema.map((section, sIdx) => (
                <View key={`sec-${sIdx}`} wrap={true}>
                  {section.title && section.title !== "Información General" && (
                    <Text style={styles.sectionTitle}>{section.title}</Text>
                  )}

                  {/* Campos directos en la sección */}
                  {section.fields?.map((field) => (
                    <View key={field.id} style={styles.fieldRow}>
                      <Text style={styles.fieldLabel}>{field.label}</Text>
                      <Text style={styles.fieldValue}>
                        {renderValue(answers[field.id!])}
                      </Text>
                    </View>
                  ))}

                  {/* Subsecciones */}
                  {section.subsections?.map((sub, subIdx) => (
                    <View key={`subsec-${subIdx}`} style={{ marginLeft: 10 }}>
                      <Text style={styles.subsectionTitle}>{sub.title}</Text>
                      {sub.fields?.map((field) => (
                        <View key={field.id} style={styles.fieldRow}>
                          <Text style={styles.fieldLabel}>{field.label}</Text>
                          <Text style={styles.fieldValue}>
                            {renderValue(answers[field.id!])}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              ))}
            </View>

            {/* Pie de página */}
            <View style={styles.footer} fixed>
              <Text>
                Documento generado automáticamente por el Sistema Senses
              </Text>
              <Text
                render={({ pageNumber, totalPages }) =>
                  `Página ${pageNumber} de ${totalPages}`
                }
              />
            </View>
          </Page>
        );
      })}
    </Document>
  );
};
