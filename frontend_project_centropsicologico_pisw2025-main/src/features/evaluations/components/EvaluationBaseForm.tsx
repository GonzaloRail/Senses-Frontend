import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Edit, PlusIcon, Save, X, LayoutGrid, Trash2, Plus } from "lucide-react";
import { UploadedTest } from "./UploadedTest";
import { type UseFormReturn } from "react-hook-form";
import { type EvaluationFormSchema } from "@/shared/interfaces/forms/EvaluationFormSchema";
import { SiteHeader } from "@/shared/components/SiteHeader";
import { EmptyState } from "@/shared/components/EmptyState";
import { Loading } from "@/shared/components/Loading";
import { useState } from "react";
import { useAlert } from "@/shared/hooks/useAlert";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface EvaluationBaseFormProps {
  onSubmit: (data: any) => void;
  onOpenTestModal?: () => void;
  onRemoveTest?: (index: number) => void;
  form: UseFormReturn<EvaluationFormSchema>;
  mode: "view" | "create" | "edit";
  handleCancel: () => void;
  handleEdit?: () => void;
  onStatusChange?: (isActive: boolean) => void;
  loading: boolean;
}

// PROTOTIPO HÍBRIDO: Interfaz para preguntas dinámicas con soporte para opción múltiple
import type { FormSectionPayload, FormFieldPayload } from "../api/formTemplatesApi";

const ensureHierarchicalSchema = (schema: any[]): FormSectionPayload[] => {
  if (!schema || schema.length === 0) return [];
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

export const EvaluationBaseForm = ({
  onSubmit,
  onOpenTestModal,
  form,
  mode,
  handleCancel,
  onRemoveTest,
  handleEdit,
  onStatusChange,
  loading,
}: EvaluationBaseFormProps) => {
  const isViewMode = mode === "view";
  const { showAlert } = useAlert();

  const {
    handleSubmit,
    watch,
    register,
    getValues,
    setValue,
    formState: { errors },
  } = form;

  const psychologicalTests = watch("psychologicalTests");

  // PROTOTIPO HÍBRIDO: Estados locales del Form Builder Inline
  const [isDesigningForm, setIsDesigningForm] = useState(false);
  const [inlineTestName, setInlineTestName] = useState("");
  const [inlineTestDesc, setInlineTestDesc] = useState("");
  const [sections, setSections] = useState<FormSectionPayload[]>([]);
  const [editingTestIndex, setEditingTestIndex] = useState<number | null>(null);
  const [previewFormQuestions, setPreviewFormQuestions] = useState<any[] | null>(null);
  const [previewFormTitle, setPreviewFormTitle] = useState<string>("");

  const getTitle = () => {
    switch (mode) {
      case "create":
        return "Crear nueva evaluación";
      case "edit":
        return "Editar evaluación";
      default:
        return "Detalle de evaluación";
    }
  };

  // PROTOTIPO HÍBRIDO: Funciones para gestionar Secciones, Subsecciones y Campos en el Form Builder
  const addSection = () => {
    const newSection: FormSectionPayload = {
      id: `seccion_${Date.now()}`,
      title: `Nuevo Punto (Ej: Sección ${sections.length + 1})`,
      order: sections.length,
      fields: [],
      subsections: [],
    };
    setSections((prev) => [...prev, newSection]);
  };

  const updateSectionTitle = (id: string, newTitle: string) => {
    setSections((prev) =>
      prev.map((sec) => (sec.id === id ? { ...sec, title: newTitle } : sec))
    );
  };

  const removeSection = (id: string) => {
    setSections((prev) => prev.filter((sec) => sec.id !== id));
  };

  const addSubsection = (sectionId: string) => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id === sectionId) {
          const subs = sec.subsections || [];
          return {
            ...sec,
            subsections: [
              ...subs,
              {
                id: `subseccion_${Date.now()}`,
                title: `Nuevo Subpunto (Ej: Subsección ${subs.length + 1})`,
                order: subs.length,
                fields: [],
              },
            ],
          };
        }
        return sec;
      })
    );
  };

  const updateSubsectionTitle = (sectionId: string, subsectionId: string, newTitle: string) => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id === sectionId && sec.subsections) {
          return {
            ...sec,
            subsections: sec.subsections.map((sub) =>
              sub.id === subsectionId ? { ...sub, title: newTitle } : sub
            ),
          };
        }
        return sec;
      })
    );
  };

  const removeSubsection = (sectionId: string, subsectionId: string) => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id === sectionId && sec.subsections) {
          return {
            ...sec,
            subsections: sec.subsections.filter((sub) => sub.id !== subsectionId),
          };
        }
        return sec;
      })
    );
  };

  const addFieldToSection = (sectionId: string, type: "number" | "text" | "checkbox" | "select") => {
    const labels = {
      number: "Nueva Medida (Ej: Peso kg)",
      text: "Nueva Pregunta (Ej: Síntomas)",
      checkbox: "Opción Sí/No (Ej: ¿Es alérgico?)",
      select: "Nueva Opción Múltiple (Ej: Frecuencia de síntomas)",
    };

    const newField: FormFieldPayload = {
      id: `campo_${Date.now()}`,
      label: labels[type],
      type: type === "number" ? "NUMBER" : type === "checkbox" ? "CHECKBOX" : type === "select" ? "SELECT" : "TEXT",
      required: false,
      order: 0,
      options: type === "select" ? ["Opción A", "Opción B"] : undefined,
    };

    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id === sectionId) {
          const fields = sec.fields || [];
          return {
            ...sec,
            fields: [...fields, newField],
          };
        }
        return sec;
      })
    );
  };

  const addFieldToSubsection = (
    sectionId: string,
    subsectionId: string,
    type: "number" | "text" | "checkbox" | "select"
  ) => {
    const labels = {
      number: "Nueva Medida (Ej: Peso kg)",
      text: "Nueva Pregunta (Ej: Síntomas)",
      checkbox: "Opción Sí/No (Ej: ¿Es alérgico?)",
      select: "Nueva Opción Múltiple (Ej: Frecuencia de síntomas)",
    };

    const newField: FormFieldPayload = {
      id: `campo_${Date.now()}`,
      label: labels[type],
      type: type === "number" ? "NUMBER" : type === "checkbox" ? "CHECKBOX" : type === "select" ? "SELECT" : "TEXT",
      required: false,
      order: 0,
      options: type === "select" ? ["Opción A", "Opción B"] : undefined,
    };

    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id === sectionId && sec.subsections) {
          return {
            ...sec,
            subsections: sec.subsections.map((sub) => {
              if (sub.id === subsectionId) {
                return {
                  ...sub,
                  fields: [...sub.fields, newField],
                };
              }
              return sub;
            }),
          };
        }
        return sec;
      })
    );
  };


  const updateField = (fieldId: string, updater: (field: FormFieldPayload) => FormFieldPayload) => {
    setSections((prev) =>
      prev.map((sec) => {
        const updatedFields = sec.fields ? sec.fields.map((f) => (f.id === fieldId ? updater(f) : f)) : [];
        const updatedSubsections = sec.subsections
          ? sec.subsections.map((sub) => ({
              ...sub,
              fields: sub.fields.map((f) => (f.id === fieldId ? updater(f) : f)),
            }))
          : [];
        return {
          ...sec,
          fields: updatedFields,
          subsections: updatedSubsections,
        };
      })
    );
  };

  const updateFieldLabel = (fieldId: string, newLabel: string) => {
    updateField(fieldId, (f) => ({ ...f, label: newLabel }));
  };

  const updateFieldRequired = (fieldId: string, required: boolean) => {
    updateField(fieldId, (f) => ({ ...f, required }));
  };

  const removeField = (fieldId: string) => {
    setSections((prev) =>
      prev.map((sec) => ({
        ...sec,
        fields: sec.fields ? sec.fields.filter((f) => f.id !== fieldId) : [],
        subsections: sec.subsections
          ? sec.subsections.map((sub) => ({
              ...sub,
              fields: sub.fields.filter((f) => f.id !== fieldId),
            }))
          : [],
      }))
    );
  };

  // PROTOTIPO HÍBRIDO: Funciones especiales para Opción Múltiple
  const addOptionToQuestion = (fieldId: string) => {
    updateField(fieldId, (f) => {
      const opts = f.options || [];
      return { ...f, options: [...opts, `Opción ${opts.length + 1}`] };
    });
  };

  const updateOptionValue = (fieldId: string, optionIndex: number, newValue: string) => {
    updateField(fieldId, (f) => {
      if (!f.options) return f;
      const newOpts = [...f.options];
      newOpts[optionIndex] = newValue;
      return { ...f, options: newOpts };
    });
  };

  const removeOptionFromQuestion = (fieldId: string, optionIndex: number) => {
    updateField(fieldId, (f) => {
      if (!f.options) return f;
      return {
        ...f,
        options: f.options.filter((_, idx) => idx !== optionIndex),
      };
    });
  };

  const handleSaveInlineForm = () => {
    if (!inlineTestName.trim()) {
      showAlert("El nombre de la prueba es requerido", "error");
      return;
    }

    if (sections.length === 0) {
      showAlert("Debe agregar al menos un Punto / Sección a su Formulario Digital", "error");
      return;
    }

    // Extraer campos para validar que haya preguntas y que las de opción múltiple tengan opciones
    const allFields: FormFieldPayload[] = [];
    sections.forEach((sec) => {
      if (sec.fields) allFields.push(...sec.fields);
      if (sec.subsections) {
        sec.subsections.forEach((sub) => {
          if (sub.fields) allFields.push(...sub.fields);
        });
      }
    });

    if (allFields.length === 0) {
      showAlert("Debe agregar al menos una pregunta clínica en alguna sección", "error");
      return;
    }

    const hasInvalidSelect = allFields.some(q => q.type === 'SELECT' && (!q.options || q.options.length === 0));
    if (hasInvalidSelect) {
      showAlert("Las preguntas de opción múltiple deben tener al menos una opción", "error");
      return;
    }

    // Normalizar las propiedades "order" en todo el árbol antes de guardar
    const orderedSections = sections.map((sec, secIdx) => {
      const orderedFields = sec.fields
        ? sec.fields.map((f, fIdx) => ({ ...f, order: fIdx }))
        : [];
      const orderedSubsections = sec.subsections
        ? sec.subsections.map((sub, subIdx) => {
            const orderedSubFields = sub.fields.map((f, fIdx) => ({ ...f, order: fIdx }));
            return { ...sub, order: subIdx, fields: orderedSubFields };
          })
        : [];

      return {
        ...sec,
        order: secIdx,
        fields: orderedFields,
        subsections: orderedSubsections,
      };
    });

    // Si estábamos editando, eliminamos temporalmente el test original de la lista
    if (editingTestIndex !== null && onRemoveTest) {
      onRemoveTest(editingTestIndex);
    }

    const originalTest = editingTestIndex !== null ? getValues("psychologicalTests")[editingTestIndex] : null;

    const newTest = {
      name: inlineTestName,
      description: inlineTestDesc,
      filename: `${inlineTestName.toLowerCase().replace(/\s+/g, "_")}_form.pdf`,
      isNew: true,
      templateContent: JSON.stringify(orderedSections), // Serializamos el esquema jerárquico completo
      testGroupId: originalTest ? ((originalTest as any).testGroupId || (originalTest as any).id) : undefined,
    };

    // Obtenemos la lista después del remove
    const listWithoutEdited = getValues("psychologicalTests") || [];
    setValue("psychologicalTests", [...listWithoutEdited, newTest]);

    // Limpiar estados locales
    setInlineTestName("");
    setInlineTestDesc("");
    setSections([]);
    setIsDesigningForm(false);
    setEditingTestIndex(null);
    showAlert("Formulario digital guardado con éxito. Guarda la evaluación general para confirmar.", "success");
  };

  const handleCancelInlineForm = () => {
    setInlineTestName("");
    setInlineTestDesc("");
    setSections([]);
    setIsDesigningForm(false);
    setEditingTestIndex(null);
  };

  if (loading) {
    return <Loading message="Cargando evaluación..." />;
  }

  return (
    <div className="h-screen flex flex-col">
      <SiteHeader title={getTitle()} />
      <form onSubmit={handleSubmit(onSubmit)} className="h-full">
        <div className="h-full flex flex-col p-2 gap-5 flex-1 overflow-y-auto custom-scroll pb-16">
          <div className="flex flex-col p-2 md:px-6 items-center ">
            <div className="grid gap-2 my-2 w-full max-w-md">
              <Label className="font-normal" htmlFor="name">
                Nombre de la evaluación
              </Label>
              <Input
                id="name"
                placeholder="Ingresa el nombre de la evaluación..."
                value={watch("name")}
                {...register("name")}
                readOnly={isViewMode}
              />
              {errors.name && (
                <Label
                  className={`font-light ${errors ? "text-red-500" : "text-slate-400"}`}
                  htmlFor="name"
                >
                  {errors.name.message}
                </Label>
              )}
            </div>
            <div className="w-full max-w-md">
              <Label className="font-normal" htmlFor="description">
                Descripción
              </Label>
              <Textarea
                id="description"
                className="overflow-y-auto h-25 resize-none mt-3 max-w-md"
                value={watch("description")}
                placeholder="Ingresa una descripción..."
                {...register("description")}
                readOnly={isViewMode}
              />
            </div>
          </div>

          <div className="flex flex-col w-full items-center px-2 gap-3">
            {/* Botones de creación: Visibles solo si no estamos diseñando inline */}
            {!isViewMode && onOpenTestModal && !isDesigningForm && (
              <>
                <div className="w-full md:w-8/10 flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => {
                      onOpenTestModal();
                    }}
                    className="cursor-pointer bg-senses-primary text-white hover:bg-senses-primary hover:text-white"
                  >
                    <PlusIcon className="w-4 h-4 mr-1.5" />
                    <span>Agregar Plantilla Word</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => {
                      setIsDesigningForm(true);
                    }}
                    className="cursor-pointer bg-green-600 text-white hover:bg-green-700 hover:text-white border-green-600"
                  >
                    <LayoutGrid className="w-4 h-4 mr-1.5" />
                    <span>Crear Formulario Digital</span>
                  </Button>
                </div>
              </>
            )}

            {/* PROTOTIPO HÍBRIDO: Área de Trabajo de Diseño de Formulario Inline (Ampliado en página) */}
            {isDesigningForm && (
              <div className="w-full md:w-8/10 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center pb-3 border-b">
                  <h3 className="font-bold text-senses-primary text-base flex items-center gap-2 font-outfit">
                    <LayoutGrid className="text-senses-secondary w-5 h-5" />
                    Diseñador de Formulario Clínico Digital (Área de Trabajo Ampliada)
                  </h3>
                  <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Modo Inline Completo
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="font-semibold text-xs text-slate-500 uppercase tracking-wider">
                      Nombre de la Prueba / Formulario
                    </Label>
                    <Input
                      placeholder="Ej: Ficha de Triaje"
                      value={inlineTestName}
                      onChange={(e) => setInlineTestName(e.target.value)}
                      className="rounded-lg"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="font-semibold text-xs text-slate-500 uppercase tracking-wider">
                      Descripción de la Prueba
                    </Label>
                    <Input
                      placeholder="Ej: Medidas antropométricas iniciales"
                      value={inlineTestDesc}
                      onChange={(e) => setInlineTestDesc(e.target.value)}
                      className="rounded-lg"
                    />
                  </div>
                </div>

                {/* Preguntas dynamic builder con Secciones y Subsecciones */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 mt-2 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-2 border-b border-slate-200">
                    <Label className="font-bold text-xs text-slate-500 uppercase tracking-wider">
                      Secciones y Puntos del Formulario ({sections.length})
                    </Label>
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addSection}
                      className="h-8 text-xs font-bold px-3 cursor-pointer bg-senses-primary text-white hover:bg-senses-primary/95 hover:text-white"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1.5" /> Añadir Punto (Sección)
                    </Button>
                  </div>

                  {/* RenderBuilderField Helper */}
                  {(() => {
                    const renderBuilderField = (q: FormFieldPayload) => (
                      <div key={q.id} className="flex flex-col gap-2.5 bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-sm">
                        <div className="flex items-center gap-2">
                          <Input
                            value={q.label}
                            onChange={(e) => updateFieldLabel(q.id || "", e.target.value)}
                            className="h-8 text-xs flex-1 rounded font-semibold text-slate-700 bg-white"
                            placeholder="Pregunta del Formulario (Ej: Edad actual)"
                          />

                          <span className={`text-[9px] px-2.5 py-1 rounded font-bold uppercase tracking-wider shrink-0 ${
                            q.isClinicalHistory ? "bg-red-50 text-red-600 border border-red-200" :
                            q.type === "NUMBER" ? "bg-blue-50 text-blue-600" :
                            q.type === "CHECKBOX" ? "bg-amber-50 text-amber-600" : 
                            q.type === "SELECT" ? "bg-purple-50 text-purple-600" : "bg-slate-100 text-slate-500"
                          }`}>
                            {q.isClinicalHistory ? "Hist. Clínica" : q.type === "NUMBER" ? "Num" : q.type === "CHECKBOX" ? "Sí/No" : q.type === "SELECT" ? "Opc. Múltiple" : "Txt"}
                          </span>

                          <div className="flex items-center gap-1 shrink-0">
                            <input
                              type="checkbox"
                              checked={q.required}
                              disabled={q.isClinicalHistory}
                              onChange={(e) => updateFieldRequired(q.id || "", e.target.checked)}
                              className="w-3.5 h-3.5 text-senses-secondary rounded cursor-pointer"
                            />
                            <span className="text-[9px] text-slate-400 font-bold uppercase select-none">Oblig</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeField(q.id || "")}
                            className="text-slate-400 hover:text-senses-danger transition-all p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Panel de Opciones para Opción Múltiple (select) */}
                        {q.type === "SELECT" && q.options && (
                          <div className="pl-6 border-l-2 border-purple-100 space-y-2 mt-1">
                            <div className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Opciones de Respuesta:</div>
                            <div className="flex flex-wrap gap-2">
                              {q.options.map((opt, optIdx) => (
                                <div key={optIdx} className="flex items-center gap-1 bg-purple-50/50 border border-purple-100 rounded-lg px-2 py-1">
                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => updateOptionValue(q.id || "", optIdx, e.target.value)}
                                    className="bg-transparent text-xs text-purple-900 focus:outline-none w-24 font-medium"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeOptionFromQuestion(q.id || "", optIdx)}
                                    className="text-purple-400 hover:text-senses-danger transition-all"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => addOptionToQuestion(q.id || "")}
                                className="text-[10px] text-purple-600 hover:text-purple-800 font-bold flex items-center gap-0.5 border border-dashed border-purple-200 rounded-lg px-2.5 py-1 bg-white hover:bg-purple-50 transition-all cursor-pointer"
                              >
                                + Opción
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );

                    return (
                      <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scroll pr-1">
                        {sections.length === 0 ? (
                          <div className="text-center py-12 text-slate-400 text-xs italic bg-white rounded-xl border border-dashed">
                            Aún no has agregado Puntos o Secciones. Haz clic en "Añadir Punto (Sección)" para estructurar tu formulario.
                          </div>
                        ) : (
                          sections.map((section, index) => (
                            <div key={section.id} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
                              
                              {/* Sección (Punto) Header */}
                              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                                <span className="bg-slate-900 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                                  {index + 1}
                                </span>
                                <Input
                                  value={section.title}
                                  onChange={(e) => updateSectionTitle(section.id || "", e.target.value)}
                                  className="h-9 text-sm flex-1 rounded font-bold text-slate-800 border-none bg-slate-50 focus-visible:ring-1"
                                  placeholder="Título de la Sección / Punto (Ej: DATOS PERSONALES)"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeSection(section.id || "")}
                                  className="text-slate-400 hover:text-senses-danger transition-all p-1.5 hover:bg-slate-50 rounded-lg shrink-0"
                                  title="Eliminar Sección Completa"
                                >
                                  <Trash2 className="w-4.5 h-4.5" />
                                </button>
                              </div>

                              {/* Barra de Acciones de la Sección */}
                              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-xl border">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Añadir a esta Sección:</span>
                                <div className="flex flex-wrap gap-1">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addFieldToSection(section.id || "", "text")}
                                    className="h-7 text-[9px] font-bold px-2 cursor-pointer bg-white"
                                  >
                                    + Texto
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addFieldToSection(section.id || "", "number")}
                                    className="h-7 text-[9px] font-bold px-2 cursor-pointer bg-white"
                                  >
                                    + Número
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addFieldToSection(section.id || "", "checkbox")}
                                    className="h-7 text-[9px] font-bold px-2 cursor-pointer bg-white"
                                  >
                                    + Sí/No
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addFieldToSection(section.id || "", "select")}
                                    className="h-7 text-[9px] font-bold px-2 cursor-pointer bg-white"
                                  >
                                    + Opc. Múltiple
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addSubsection(section.id || "")}
                                    className="h-7 text-[9px] font-bold px-2 cursor-pointer bg-white text-senses-secondary border-senses-secondary/50 hover:bg-slate-50"
                                  >
                                    + Subpunto (Subsección)
                                  </Button>
                                </div>
                              </div>

                              {/* Campos Directos de la Sección */}
                              <div className="space-y-3">
                                {section.fields && section.fields.map(renderBuilderField)}
                              </div>

                              {/* Subsecciones (Subpuntos) */}
                              <div className="space-y-4 pl-4 border-l-2 border-slate-100">
                                {section.subsections && section.subsections.map((sub, subIdx) => (
                                  <div key={sub.id} className="bg-slate-50/50 p-4 rounded-xl border border-dashed border-slate-200 space-y-3">
                                    
                                    {/* Subsección Header */}
                                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                      <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0">Subpunto {index+1}.{subIdx+1}</span>
                                      <Input
                                        value={sub.title}
                                        onChange={(e) => updateSubsectionTitle(section.id || "", sub.id || "", e.target.value)}
                                        className="h-7 text-xs flex-1 rounded font-semibold text-slate-700 bg-white"
                                        placeholder="Título de la Subsección / Subpunto (Ej: Información Familiar)"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => removeSubsection(section.id || "", sub.id || "")}
                                        className="text-slate-400 hover:text-senses-danger transition-all p-1 rounded hover:bg-slate-100"
                                        title="Eliminar Subsección"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>

                                    {/* Botones de Campos para Subsección */}
                                    <div className="flex flex-wrap items-center gap-1">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => addFieldToSubsection(section.id || "", sub.id || "", "text")}
                                        className="h-6 text-[8px] px-1.5 cursor-pointer bg-white"
                                      >
                                        + Texto
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => addFieldToSubsection(section.id || "", sub.id || "", "number")}
                                        className="h-6 text-[8px] px-1.5 cursor-pointer bg-white"
                                      >
                                        + Número
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => addFieldToSubsection(section.id || "", sub.id || "", "checkbox")}
                                        className="h-6 text-[8px] px-1.5 cursor-pointer bg-white"
                                      >
                                        + Sí/No
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => addFieldToSubsection(section.id || "", sub.id || "", "select")}
                                        className="h-6 text-[8px] px-1.5 cursor-pointer bg-white"
                                      >
                                        + Opc. Múltiple
                                      </Button>
                                    </div>

                                    {/* Campos de la Subsección */}
                                    <div className="space-y-2.5">
                                      {sub.fields && sub.fields.map(renderBuilderField)}
                                    </div>

                                  </div>
                                ))}
                              </div>

                              {(!section.fields || section.fields.length === 0) && (!section.subsections || section.subsections.length === 0) && (
                                <p className="text-[11px] text-slate-400 italic text-center py-2">
                                  Sección vacía. Agrega campos o subpuntos arriba.
                                </p>
                              )}

                            </div>
                          ))
                        )}
                      </div>
                    );
                  })()}
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={handleCancelInlineForm}
                    className="bg-senses-danger text-white hover:bg-senses-danger/80 hover:text-white"
                  >
                    Cancelar Diseño
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSaveInlineForm}
                    className="bg-senses-primary text-white hover:bg-senses-primary/80 hover:text-white"
                  >
                    Guardar Formulario
                  </Button>
                </div>
              </div>
            )}

            {/* Listado de Pruebas agregadas (Word o Formulario) */}
            {!isDesigningForm && (
              <div className="w-full md:w-8/10 grid gap-3 xl:grid-cols-2 mt-2">
                {psychologicalTests.length === 0 ? (
                  <div className="w-full col-span-2 justify-center items-center">
                    <EmptyState title="No se han agregado pruebas psicológicas" />
                  </div>
                ) : (
                  <>
                    {getValues().psychologicalTests?.map((test, index) => (
                      <UploadedTest
                        key={test.fileurl || index}
                        {...test}
                        isViewMode={isViewMode}
                        onEdit={
                          (test as any).templateContent
                            ? () => {
                                if (isViewMode) {
                                  try {
                                    setPreviewFormQuestions(JSON.parse((test as any).templateContent));
                                    setPreviewFormTitle(test.name);
                                  } catch (e) {
                                    console.error("Error parsing form questions on preview", e);
                                  }
                                } else {
                                  setEditingTestIndex(index);
                                  setInlineTestName(test.name);
                                  setInlineTestDesc(test.description || "");
                                  try {
                                    const parsed = JSON.parse((test as any).templateContent || "[]");
                                    setSections(ensureHierarchicalSchema(parsed));
                                  } catch (e) {
                                    console.error("Error parsing form questions on edit", e);
                                    setSections([]);
                                  }
                                  setIsDesigningForm(true);
                                }
                              }
                            : undefined
                        }
                        onRemove={
                          !isViewMode && onRemoveTest
                            ? () => onRemoveTest(index)
                            : undefined
                        }
                      />
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Botones de acción general de la Evaluación */}
          {!isDesigningForm && (
            <div className="flex flex-col p-2 gap-3 pt-4 border-t w-full md:flex-row md:justify-end mt-auto">
              {isViewMode && (
                <>
                  <Button
                    variant="destructive"
                    onClick={handleCancel}
                    className="flex items-center gap-2"
                    disabled={loading}
                    type="button"
                  >
                    Volver
                  </Button>

                  {onStatusChange && (
                    <Button
                      variant={getValues().isActive ? "destructive" : "default"}
                      onClick={() => onStatusChange(!getValues().isActive)}
                      className="flex items-center gap-2"
                      disabled={loading}
                      type="button"
                    >
                      {getValues().isActive ? "Deshabilitar" : "Habilitar"}
                    </Button>
                  )}

                  {handleEdit && (
                    <Button
                      onClick={handleEdit}
                      className="flex items-center gap-2"
                      disabled={loading}
                      type="button"
                    >
                      <Edit className="h-4 w-4" />
                      Editar
                    </Button>
                  )}
                </>
              )}

              {(mode === "edit" || mode === "create") && (
                <>
                  <Button
                    variant="destructive"
                    onClick={handleCancel}
                    className="flex items-center gap-2"
                    disabled={loading}
                    type="button"
                  >
                    <X className="h-4 w-4" />
                    Cancelar
                  </Button>
                  <Button
                    className="flex items-center gap-2"
                    disabled={loading}
                    type="submit"
                  >
                    <Save className="h-4 w-4" />
                    {mode === "create" ? "Crear evaluación" : "Guardar cambios"}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </form>

      {/* Modal de Vista Previa del Formulario Digital */}
      <Dialog open={previewFormQuestions !== null} onOpenChange={() => setPreviewFormQuestions(null)}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto custom-scroll">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-outfit text-senses-primary flex items-center gap-2">
              <LayoutGrid className="text-senses-secondary w-5 h-5" />
              Vista Previa: {previewFormTitle}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {previewFormQuestions && previewFormQuestions.length === 0 ? (
              <p className="text-sm text-slate-500 italic">Este formulario no tiene preguntas.</p>
            ) : (
              <div className="space-y-4">
                {(() => {
                  const rawNormalized = ensureHierarchicalSchema(previewFormQuestions || []);
                  let normalized = rawNormalized;
                  if (rawNormalized.length > 0) {
                    const firstSection = rawNormalized[0];
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
                      normalized = [
                        {
                          ...firstSection,
                          fields: [clinicalHistoryField, ...(firstSection.fields || [])],
                        },
                        ...rawNormalized.slice(1),
                      ];
                    }
                  } else {
                    normalized = [
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
                  const sorted = [...normalized].sort((a, b) => a.order - b.order);

                  const renderPreviewField = (q: FormFieldPayload, fIdx: number) => {
                    const fieldType = (q.type || "").toUpperCase();
                    return (
                      <div key={q.id || fIdx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-700">
                            {q.label}
                          </span>
                          <span className={`text-[8px] px-2 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 ${
                            q.isClinicalHistory ? "bg-red-50 text-red-600 border border-red-200" :
                            fieldType === "NUMBER" ? "bg-blue-50 text-blue-600" :
                            fieldType === "CHECKBOX" ? "bg-amber-50 text-amber-600" :
                            fieldType === "SELECT" ? "bg-purple-50 text-purple-600" : "bg-slate-100 text-slate-500"
                          }`}>
                            {q.isClinicalHistory ? "Hist. Clínica" : fieldType === "NUMBER" ? "Número" : fieldType === "CHECKBOX" ? "Sí/No" : fieldType === "SELECT" ? "Opc. Múltiple" : "Texto"}
                          </span>
                        </div>

                        {fieldType === "SELECT" && q.options && (
                          <div className="pl-3 border-l-2 border-purple-100 flex flex-wrap gap-1 mt-1">
                            {q.options.map((opt: string, optIdx: number) => (
                              <span key={optIdx} className="bg-white border border-purple-100 text-[9px] px-2 py-0.5 rounded text-purple-700 font-medium">
                                {opt}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {q.helpText && (
                          <p className="text-[10px] text-slate-400 italic margin-0">{q.helpText}</p>
                        )}
                        
                        <div className="text-[9px] text-slate-400 font-bold uppercase">
                          {q.required ? "Campo Obligatorio" : "Campo Opcional"}
                        </div>
                      </div>
                    );
                  };

                  return sorted.map((sec, secIdx) => {
                    const sortedFields = [...(sec.fields || [])].sort((a, b) => a.order - b.order);
                    const sortedSubsections = [...(sec.subsections || [])].sort((a, b) => a.order - b.order);

                    return (
                      <div key={sec.id || secIdx} className="space-y-2">
                        {/* Section Header */}
                        <div className="bg-senses-primary text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-2">
                          <span className="bg-white/20 text-white w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                            {secIdx + 1}
                          </span>
                          <span className="truncate uppercase tracking-wider">{sec.title}</span>
                        </div>

                        {/* Section Body */}
                        <div className="border border-slate-200 rounded-xl p-3.5 space-y-3 bg-white shadow-xs">
                          {/* Direct Fields */}
                          {sortedFields.map((field, fIdx) => renderPreviewField(field, fIdx))}

                          {/* Subsections */}
                          {sortedSubsections.map((sub, subIdx) => {
                            const sortedSubFields = [...(sub.fields || [])].sort((a, b) => a.order - b.order);
                            return (
                              <div key={sub.id || subIdx} className="space-y-2 mt-2">
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b pb-1">
                                  {secIdx + 1}.{subIdx + 1} {sub.title}
                                </div>
                                <div className="space-y-2 pl-2 border-l border-slate-100">
                                  {sortedSubFields.map((field, fIdx) => renderPreviewField(field, fIdx))}
                                </div>
                              </div>
                            );
                          })}

                          {sortedFields.length === 0 && sortedSubsections.length === 0 && (
                            <p className="text-[10px] text-slate-400 italic text-center py-1">Sección vacía</p>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>

          <DialogFooter className="border-t pt-3">
            <Button
              type="button"
              className="bg-senses-primary text-white hover:bg-senses-primary/80"
              onClick={() => setPreviewFormQuestions(null)}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
