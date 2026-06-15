import type { Evaluation, Section } from "../interfaces/models";
import { EvaluationDefaultID } from "../interfaces/models/Evaluation";
/**
 * Organiza evaluaciones en secciones ordenadas
 * @param evaluations - Array de evaluaciones
 * @param sortDefaultBy - Criterio de ordenamiento dentro de la sección default ('name' | 'createdAt')
 * @returns Array de secciones ordenadas
 */
export function organizeEvaluationsIntoSections(
  evaluations: Evaluation[],
  sortDefaultBy: "name" | "createdAt" = "name"
): Section[] {
  // 1. Filtrar solo evaluaciones activas
  const activeEvaluations = evaluations.filter((e) => e.isActive);

  if (activeEvaluations.length === 0) {
    return [];
  }

  // 2. Particionar evaluaciones
  const [customSectionEvals, defaultSectionEvals] = activeEvaluations.reduce<
    [Evaluation[], Evaluation[]]
  >(
    ([custom, defaults], evaluation) => {
      if (evaluation.openNewSection) {
        custom.push(evaluation);
      } else {
        defaults.push(evaluation);
      }
      return [custom, defaults];
    },
    [[], []]
  );

  const sections: Section[] = [];

  // 3. Crear sección por defecto
  if (defaultSectionEvals.length > 0) {
    // Ordenar según criterio
    const sortedDefaults = [...defaultSectionEvals].sort((a, b) => {
      if (sortDefaultBy === "name") {
        return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    sections.push({
      id: EvaluationDefaultID,
      name: "Evaluaciones",
      order: sortedDefaults[0].sectionOrder,
      isDefault: true,
      evaluations: sortedDefaults,
    });
  }

  // 4. Crear secciones personalizadas
  customSectionEvals.forEach((evaluation) => {
    sections.push({
      id: evaluation.id,
      name: evaluation.name,
      order: evaluation.sectionOrder,
      isDefault: false,
      evaluations: [evaluation],
    });
  });

  // 5. Ordenar secciones por order (ascendente)
  return sections.sort((a, b) => a.order - b.order);
}
