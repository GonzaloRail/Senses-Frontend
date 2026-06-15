import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import type { FormFieldPayload, FormSectionPayload } from "@/features/evaluations/api/formTemplatesApi";

interface FormFillerModalProps {
  isOpen: boolean;
  handleClose: () => void;
  formTemplateName: string;
  fieldsSchema: FormSectionPayload[] | string;
  existingResponseData?: Record<string, any> | string;
  isReadOnly?: boolean;
  patientDni?: string;
  onSave: (answers: Record<string, any>) => Promise<void>;
}

const ensureHierarchicalSchema = (schema: any[]): FormSectionPayload[] => {
  if (schema.length === 0) return [];
  // Si el primer elemento tiene un tipo de campo, es un esquema plano antiguo
  if (schema[0] && (schema[0] as any).type !== undefined) {
    return [
      {
        id: "default_section",
        title: "Información General",
        order: 0,
        fields: schema as FormFieldPayload[],
        subsections: [],
      },
    ];
  }
  return schema as FormSectionPayload[];
};

const EMPTY_OBJECT = {};

export const FormFillerModal = ({
  isOpen,
  handleClose,
  formTemplateName,
  fieldsSchema,
  existingResponseData = EMPTY_OBJECT,
  isReadOnly = false,
  patientDni = "",
  onSave,
}: FormFillerModalProps) => {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Analizar con seguridad el esquema de campos jerárquico
  const parsedSections = useMemo<FormSectionPayload[]>(() => {
    let rawSchema: any[] = [];
    if (Array.isArray(fieldsSchema)) {
      rawSchema = fieldsSchema;
    } else if (typeof fieldsSchema === "string") {
      try {
        rawSchema = JSON.parse(fieldsSchema);
      } catch (e) {
        console.error("Error parsing fieldsSchema in FormFillerModal:", e);
      }
    }
    const normalized = ensureHierarchicalSchema(rawSchema);

    // Inyectar dinámicamente el campo de "Historia Clínica (DNI)" en la primera sección si no existe
    if (normalized.length > 0) {
      const firstSection = normalized[0];
      const hasClinicalHistory = (firstSection.fields || []).some(
        (f) => f.isClinicalHistory || f.id === "clinical_history_dni"
      );
      if (!hasClinicalHistory) {
        const clinicalHistoryField: FormFieldPayload = {
          id: "clinical_history_dni",
          label: "Historia Clínica (DNI)",
          type: "TEXT",
          required: true,
          order: -1, // Se renderiza al inicio
          placeholder: "Ingrese el DNI/Historia Clínica...",
          helpText: "Este campo se autocompleta con el DNI del paciente, pero puede modificarlo si lo requiere.",
          isClinicalHistory: true,
        };
        return [
          {
            ...firstSection,
            fields: [clinicalHistoryField, ...(firstSection.fields || [])],
          },
          ...normalized.slice(1),
        ];
      }
    } else {
      return [
        {
          id: "default_section",
          title: "Información General",
          order: 0,
          subsections: [],
          fields: [
            {
              id: "clinical_history_dni",
              label: "Historia Clínica (DNI)",
              type: "TEXT",
              required: true,
              order: -1,
              placeholder: "Ingrese el DNI/Historia Clínica...",
              helpText: "Este campo se autocompleta con el DNI del paciente, pero puede modificarlo si lo requiere.",
              isClinicalHistory: true,
            }
          ]
        }
      ];
    }
    return normalized;
  }, [fieldsSchema]);

  // Extraer una lista plana de todos los campos para inicialización, validación y guardado
  const allFields = useMemo<FormFieldPayload[]>(() => {
    const fields: FormFieldPayload[] = [];
    parsedSections.forEach((section) => {
      if (section.fields) {
        fields.push(...section.fields);
      }
      if (section.subsections) {
        section.subsections.forEach((sub) => {
          if (sub.fields) {
            fields.push(...sub.fields);
          }
        });
      }
    });
    return fields;
  }, [parsedSections]);

  // Analizar con seguridad los datos de respuestas existentes
  const parsedExistingResponseData = useMemo<Record<string, any>>(() => {
    if (!existingResponseData) return EMPTY_OBJECT;
    if (typeof existingResponseData === "string") {
      try {
        return JSON.parse(existingResponseData);
      } catch (e) {
        console.error("Error parsing existingResponseData in FormFillerModal:", e);
        return EMPTY_OBJECT;
      }
    }
    return existingResponseData as Record<string, any>;
  }, [existingResponseData]);

  // Inicializar respuestas cuando se abre
  useEffect(() => {
    if (!isOpen) {
      setHasInitialized(false);
      return;
    }

    if (isOpen && allFields.length > 0 && !hasInitialized) {
      const initialAnswers: Record<string, any> = {};
      allFields.forEach((field, index) => {
        const fieldKey = field.id || `field_${index}`;
        if (parsedExistingResponseData && parsedExistingResponseData[fieldKey] !== undefined) {
          initialAnswers[fieldKey] = parsedExistingResponseData[fieldKey];
        } else {
          if (field.isClinicalHistory) {
            initialAnswers[fieldKey] = patientDni || "";
          } else if (field.type === "CHECKBOX") {
            initialAnswers[fieldKey] = [];
          } else {
            initialAnswers[fieldKey] = "";
          }
        }
      });
      setAnswers(initialAnswers);
      setErrors({});
      setSaving(false);
      setHasInitialized(true);
    }
  }, [isOpen, allFields, parsedExistingResponseData, patientDni, hasInitialized]);

  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  const handleChange = useCallback((fieldKey: string, value: any) => {
    if (isReadOnly) return;
    setAnswers((prev) => ({ ...prev, [fieldKey]: value }));
    setErrors((prev) => {
      if (!prev[fieldKey]) return prev;
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
  }, [isReadOnly]);

  const handleCheckboxChange = useCallback((fieldKey: string, option: string, checked: boolean) => {
    if (isReadOnly) return;
    setAnswers((prev) => {
      const currentValues = Array.isArray(prev[fieldKey]) ? prev[fieldKey] : [];
      const newValues = checked
        ? [...currentValues, option]
        : currentValues.filter((v: string) => v !== option);
      return { ...prev, [fieldKey]: newValues };
    });
  }, [isReadOnly]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    allFields.forEach((field, index) => {
      const fieldKey = field.id || `field_${index}`;
      const val = answers[fieldKey];
      if (field.required) {
        if (field.type === "CHECKBOX") {
          if (!val || val.length === 0) {
            newErrors[fieldKey] = "Este campo es obligatorio. Seleccione al menos una opción.";
          }
        } else {
          if (val === undefined || val === null || String(val).trim() === "") {
            newErrors[fieldKey] = "Este campo es obligatorio.";
          }
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      handleClose();
      return;
    }
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave(answers);
      handleClose();
    } catch (err) {
      console.error("Error saving form answers:", err);
    } finally {
      setSaving(false);
    }
  };

  // Ordenar las secciones por su propiedad order
  const sortedSections = useMemo(() => {
    return [...parsedSections].sort((a, b) => a.order - b.order);
  }, [parsedSections]);

  const renderField = (field: FormFieldPayload, index: number) => {
    const fieldKey = field.id || `field_${index}`;
    const hasError = !!errors[fieldKey];

    const rawOptions = field.options;
    let optionsList: string[] = [];
    if (rawOptions) {
      if (Array.isArray(rawOptions)) {
        optionsList = rawOptions;
      } else if (typeof rawOptions === "string") {
        try {
          optionsList = JSON.parse(rawOptions);
        } catch {
          optionsList = [rawOptions];
        }
      }
    }

    return (
      <div key={fieldKey} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <Label htmlFor={fieldKey} className="font-semibold text-sm flex items-center gap-1">
          {field.label}
          {field.required && !isReadOnly && <span style={{ color: "#ef4444" }}>*</span>}
        </Label>

        {field.helpText && (
          <span style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "-0.25rem" }}>
            {field.helpText}
          </span>
        )}

        {/* TEXT */}
        {field.type === "TEXT" && (
          <Input
            id={fieldKey}
            placeholder={field.placeholder || ""}
            value={answers[fieldKey] || ""}
            disabled={isReadOnly}
            onChange={(e) => handleChange(fieldKey, e.target.value)}
            className={hasError ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
        )}

        {/* TEXTAREA */}
        {field.type === "TEXTAREA" && (
          <Textarea
            id={fieldKey}
            placeholder={field.placeholder || ""}
            value={answers[fieldKey] || ""}
            disabled={isReadOnly}
            onChange={(e) => handleChange(fieldKey, e.target.value)}
            rows={4}
            className={hasError ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
        )}

        {/* NUMBER */}
        {field.type === "NUMBER" && (
          <Input
            id={fieldKey}
            type="number"
            placeholder={field.placeholder || ""}
            value={answers[fieldKey] !== undefined ? answers[fieldKey] : ""}
            disabled={isReadOnly}
            onChange={(e) =>
              handleChange(fieldKey, e.target.value === "" ? "" : Number(e.target.value))
            }
            className={hasError ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
        )}

        {/* DATE */}
        {field.type === "DATE" && (
          <Input
            id={fieldKey}
            type="date"
            value={answers[fieldKey] || ""}
            disabled={isReadOnly}
            onChange={(e) => handleChange(fieldKey, e.target.value)}
            className={hasError ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
        )}

        {/* SELECT */}
        {field.type === "SELECT" && (
          <select
            id={fieldKey}
            value={answers[fieldKey] || ""}
            disabled={isReadOnly}
            onChange={(e) => handleChange(fieldKey, e.target.value)}
            className={`flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
              hasError ? "border-red-500 ring-red-500" : ""
            }`}
          >
            <option value="">{field.placeholder || "Seleccione una opción..."}</option>
            {optionsList.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        )}

        {/* RADIO */}
        {field.type === "RADIO" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.25rem" }}>
            {optionsList.map((opt) => (
              <label key={opt} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer" }}>
                <input
                  type="radio"
                  name={fieldKey}
                  value={opt}
                  checked={answers[fieldKey] === opt}
                  disabled={isReadOnly}
                  onChange={() => handleChange(fieldKey, opt)}
                  style={{ width: "1rem", height: "1rem" }}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        )}

        {/* CHECKBOX - con opciones: lista de checkboxes; sin opciones: botones Sí/No */}
        {field.type === "CHECKBOX" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.25rem" }}>
            {optionsList.length === 0 ? (
              <div style={{ display: "flex", gap: "0.75rem" }}>
                {(["Sí", "No"] as const).map((opcion) => {
                  const selected = answers[fieldKey] === opcion;
                  return (
                    <button
                      key={opcion}
                      type="button"
                      disabled={isReadOnly}
                      onClick={() => handleChange(fieldKey, selected ? "" : opcion)}
                      style={{
                        padding: "0.375rem 1.5rem",
                        borderRadius: "0.375rem",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        cursor: isReadOnly ? "not-allowed" : "pointer",
                        border: selected ? "none" : "1px solid #d1d5db",
                        background: selected
                          ? opcion === "Sí"
                            ? "#16a34a"
                            : "#dc2626"
                          : "white",
                        color: selected ? "white" : "#374151",
                        transition: "all 0.15s",
                      }}
                    >
                      {opcion}
                    </button>
                  );
                })}
              </div>
            ) : (
              optionsList.map((opt) => {
                const isChecked = Array.isArray(answers[fieldKey]) && answers[fieldKey].includes(opt);
                return (
                  <label key={opt} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={isReadOnly}
                      onChange={(e) => handleCheckboxChange(fieldKey, opt, e.target.checked)}
                      style={{ width: "1rem", height: "1rem" }}
                    />
                    <span>{opt}</span>
                  </label>
                );
              })
            )}
          </div>
        )}

        {/* SCALE */}
        {field.type === "SCALE" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.25rem" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.25rem",
                maxWidth: "28rem",
                background: "#f9fafb",
                padding: "0.75rem",
                borderRadius: "0.5rem",
                border: "1px solid #e5e7eb",
              }}
            >
              {Array.from(
                { length: (field.scaleMax || 5) - (field.scaleMin || 1) + 1 },
                (_, i) => (field.scaleMin || 1) + i
              ).map((val) => {
                const isSelected = Number(answers[fieldKey]) === val;
                return (
                  <button
                    key={val}
                    type="button"
                    disabled={isReadOnly}
                    onClick={() => handleChange(fieldKey, val)}
                    style={{
                      width: "2.5rem",
                      height: "2.5rem",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "0.875rem",
                      cursor: isReadOnly ? "not-allowed" : "pointer",
                      border: isSelected ? "none" : "1px solid #d1d5db",
                      background: isSelected ? "var(--senses-primary, #4f46e5)" : "white",
                      color: isSelected ? "white" : "#374151",
                      transition: "all 0.15s",
                      transform: isSelected ? "scale(1.1)" : "none",
                    }}
                  >
                    {val}
                  </button>
                );
              })}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                maxWidth: "28rem",
                padding: "0 0.25rem",
                fontSize: "0.75rem",
                color: "#6b7280",
              }}
            >
              <span>Mínimo: {field.scaleMin || 1}</span>
              <span>Máximo: {field.scaleMax || 5}</span>
            </div>
          </div>
        )}

        {hasError && (
          <span style={{ fontSize: "0.75rem", color: "#ef4444", fontWeight: 500 }}>
            {errors[fieldKey]}
          </span>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9999 }}
      aria-modal="true"
      role="dialog"
      aria-label={formTemplateName}
    >
      {/* Overlay */}
      <div
        style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.5)" }}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(860px, calc(100vw - 2rem))",
          maxHeight: "96vh",
          backgroundColor: "white",
          borderRadius: "0.5rem",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              fontSize: "1.125rem",
              fontWeight: 700,
              margin: 0,
              color: "var(--senses-primary, #4f46e5)",
            }}
          >
            {formTemplateName}
            {isReadOnly && (
              <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "#6b7280", marginLeft: "0.5rem" }}>
                (Solo lectura)
              </span>
            )}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "0.25rem",
              fontSize: "1.25rem",
              color: "#6b7280",
              lineHeight: 1,
            }}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Cuerpo con scroll */}
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
        >
          <div
            style={{
              flex: 1,
              overflowY: "scroll",
              padding: "1rem 1.5rem",
              minHeight: 0,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              {sortedSections.length === 0 ? (
                <p style={{ textAlign: "center", color: "#6b7280", padding: "2rem 0" }}>
                  Este formulario no contiene secciones ni campos definidos.
                </p>
              ) : (
                sortedSections.map((section, secIdx) => {
                  const sortedFields = [...(section.fields || [])].sort((a, b) => a.order - b.order);
                  const sortedSubsections = [...(section.subsections || [])].sort((a, b) => a.order - b.order);

                  return (
                    <div key={section.id || `sec_${secIdx}`} style={{ display: "flex", flexDirection: "column" }}>
                      {/* Section (Punto) Header */}
                      <div
                        style={{
                          backgroundColor: "#0B2035",
                          color: "white",
                          padding: "0.75rem 1.25rem",
                          borderRadius: "0.375rem",
                          fontSize: "0.875rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          marginBottom: "0.75rem",
                        }}
                      >
                        {section.title}
                      </div>

                      {/* Section Content Wrapper with border */}
                      <div
                        style={{
                          border: "1.5px solid #e2e8f0",
                          borderRadius: "0.5rem",
                          padding: "1.25rem",
                          backgroundColor: "#ffffff",
                          display: "flex",
                          flexDirection: "column",
                          gap: "1.25rem",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                          marginBottom: "0.5rem",
                        }}
                      >
                        {/* Direct fields in Section */}
                        {sortedFields.map((field, fIdx) => renderField(field, fIdx))}

                        {/* Subsections in Section */}
                        {sortedSubsections.map((sub, subIdx) => {
                          const sortedSubFields = [...(sub.fields || [])].sort((a, b) => a.order - b.order);
                          return (
                            <div key={sub.id || `sub_${subIdx}`} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                              {/* Subsection (Subpunto) Title */}
                              <div
                                style={{
                                  fontSize: "0.825rem",
                                  fontWeight: 700,
                                  color: "#475569",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.05em",
                                  borderBottom: "1px solid #f1f5f9",
                                  paddingBottom: "0.375rem",
                                  marginTop: "0.5rem",
                                }}
                              >
                                {sub.title}
                              </div>
                              {/* Subsection Fields */}
                              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", paddingLeft: "0.5rem" }}>
                                {sortedSubFields.map((field, fIdx) => renderField(field, fIdx))}
                              </div>
                            </div>
                          );
                        })}

                        {sortedFields.length === 0 && sortedSubsections.length === 0 && (
                          <p style={{ fontSize: "0.875rem", color: "#9ca3af", fontStyle: "italic", margin: 0 }}>
                            Esta sección no tiene campos.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: "1rem 1.5rem",
              borderTop: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.5rem",
              flexShrink: 0,
            }}
          >
            <Button
              variant="outline"
              type="button"
              className="bg-white text-gray-700 hover:bg-gray-100 cursor-pointer"
              onClick={handleClose}
            >
              {isReadOnly ? "Cerrar" : "Cancelar"}
            </Button>
            {!isReadOnly && (
              <Button
                type="submit"
                disabled={saving}
                className="bg-senses-primary text-white hover:bg-senses-primary/95 cursor-pointer"
              >
                {saving ? "Guardando..." : "Guardar Respuestas"}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
