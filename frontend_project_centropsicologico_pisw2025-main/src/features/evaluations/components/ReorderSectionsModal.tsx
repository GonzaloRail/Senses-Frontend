import { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GripVertical, Package } from "lucide-react";
import { useGetSectionsOrders } from "../hooks/useEvaluationsQueries";
import type { SectionToDoSort } from "@/shared/interfaces/models";
import { useUpdateSectionsOrders } from "../hooks/useEvaluationsMutations";
import { useAlert } from "@/shared/hooks/useAlert";

interface ReorderSectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// Componente individual de sección sorteable
function SortableSection({ section }: { section: SectionToDoSort }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const useGetLabel = (count: number, isDefault: boolean) =>
    useCallback(() => {
      const singular = isDefault ? "evaluación" : "prueba";
      const plural = isDefault ? "evaluaciones" : "pruebas";

      return count === 1 ? singular : plural;
    }, [count, isDefault]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center gap-3 p-4 bg-white border rounded-lg
        ${isDragging ? "shadow-lg opacity-50 z-50" : "shadow-sm"}
        hover:shadow-md transition-shadow
      `}
    >
      {/* Handle para arrastrar */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="w-5 h-5 text-gray-400" />
      </div>

      {/* Icono */}
      <div className="flex-shrink-0">
        <Package className="w-5 h-5 text-gray-500" />
      </div>

      {/* Contenido */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{section.name}</span>
          {section.isDefault && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
              Predeterminada
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5">
          {section.evaluationCount}{" "}
          {useGetLabel(section.evaluationCount, section.isDefault)()}
        </p>
      </div>

      {/* Número de orden */}
      <div className="text-sm text-gray-400 font-mono">
        #{section.order + 1}
      </div>
    </div>
  );
}

export function ReorderSectionsModal({
  isOpen,
  onClose,
}: ReorderSectionsModalProps) {
  const [sections, setSections] = useState<SectionToDoSort[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { data: sectionsData, isLoading: isSectionsLoading } =
    useGetSectionsOrders();
  const { mutate } = useUpdateSectionsOrders();
  const { showAlert } = useAlert();
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Cargar secciones al abrir el modal
  useEffect(() => {
    if (isOpen) {
      loadSections();
    }
  }, [isOpen]);

  const loadSections = async () => {
    setLoading(true);
    try {
      setSections(sectionsData || []);
    } catch (error) {
      console.error("Error al cargar secciones:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newOrder = arrayMove(items, oldIndex, newIndex);

        // Actualizar los números de orden
        return newOrder.map((item, index) => ({
          ...item,
          order: index,
        }));
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const sectionOrders = sections.map((section) => ({
      id: section.id,
      sectionOrder: section.order,
    }));

    mutate(
      { evaluations: sectionOrders },
      {
        onSuccess() {
          showAlert("Orden de secciones actualizado correctamente", "success");
        },
        onError() {
          showAlert("Error al guardar el orden de las secciones", "error");
        },
      }
    );

    onClose();
    setSaving(false);
  };

  const handleClose = () => {
    if (!saving) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ordenar Secciones</DialogTitle>
          <p className="text-sm text-gray-500 mt-1">
            Arrastra las secciones para cambiar el orden en que aparecen
          </p>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : sections.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay secciones para ordenar
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sections.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {sections.map((section) => (
                    <SortableSection key={section.id} section={section} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        <DialogFooter className="justify-end gap-2">
          <Button
            variant="outline"
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="bg-senses-danger text-white hover:bg-senses-danger/80 hover:text-white"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={
              loading || saving || sections.length === 0 || isSectionsLoading
            }
            className="bg-senses-primary text-white hover:bg-senses-primary/80 hover:text-white"
          >
            {saving ? "Guardando..." : "Guardar Orden"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
