import { EvaluationBaseForm } from "../components/EvaluationBaseForm";
import { Loading } from "@/shared/components/Loading";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  evaluationFormSchema,
  type EvaluationFormSchema,
} from "@/shared/interfaces/forms/EvaluationFormSchema";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getEvaluationByIdApi } from "../api/evaluationsApi";
import { queryClient } from "@/lib/queryClient";
import type { Evaluation } from "@/shared/interfaces/models";
import { useUpdateEvaluationStatus } from "../hooks/useEvaluationsMutations";
import { useAlert } from "@/shared/hooks/useAlert";

const mapFieldsSchemaToFormQuestions = (fieldsSchema: any): string => {
  if (!fieldsSchema) return "[]";
  try {
    const list = Array.isArray(fieldsSchema) ? fieldsSchema : JSON.parse(fieldsSchema);
    return JSON.stringify(list);
  } catch (e) {
    console.error("Error parsing fieldsSchema", e);
    return "[]";
  }
};

export const ViewEvaluation = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showAlert } = useAlert();

  const form = useForm<EvaluationFormSchema>({
    resolver: zodResolver(evaluationFormSchema),
    defaultValues: {
      name: "",
      description: "",
      isActive: true,
      psychologicalTests: [],
    },
  });

  const [evaluationData, setEvaluationData] = useState<Evaluation>(
    {} as Evaluation
  );

  const { mutate: updateEvaluationStatus } = useUpdateEvaluationStatus();

  const onSubmit: SubmitHandler<EvaluationFormSchema> = () => {
    // No-op since this is view mode
  };

  const handleCancel = () => {
    navigate("/evaluations");
  };

  const handleEdit = () => {
    navigate(`/evaluations/${id}/edit`);
  };

  const handleStatus = async (isActive: boolean) => {
    if (!evaluationData) return;
    try {
      await updateEvaluationStatus({
        id: evaluationData.id,
        isActive: isActive,
      });

      showAlert(
        isActive ? "Evaluación habilitada" : "Evaluación inhabilitada",
        "success"
      );
    } catch (error) {
      console.error("Error updating evaluation status:", error);
      showAlert("Error al actualizar el estado de la evaluación", "error");
    }
    setEvaluationData({ ...evaluationData, isActive });
  };

  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      try {
        if (!id) return;
        const response = await queryClient.fetchQuery<Evaluation>({
          queryKey: ["evaluation", id],
          queryFn: () => getEvaluationByIdApi(id),
        });
        setEvaluationData(response);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!evaluationData || !evaluationData.tests) return;

    form.reset({
      name: evaluationData.name,
      description: evaluationData.description,
      isActive: evaluationData.isActive,
      openNewSection: evaluationData.openNewSection,
      psychologicalTests: evaluationData.tests?.map((test: any) => ({
        id: test.id,
        name: test.name,
        description: test.description,
        filename: test.document?.name || (test.formTemplate ? "Formulario digital" : "Documento sin nombre"),
        fileurl: test.document?.fileUrl,
        templateContent: test.formTemplate ? mapFieldsSchemaToFormQuestions(test.formTemplate.fieldsSchema) : undefined,
      })),
    });
  }, [form, evaluationData]);

  if (loading) {
    return <Loading message="Cargando evaluación..." />;
  }

  return (
    <>
      <EvaluationBaseForm
        form={form}
        onSubmit={onSubmit}
        mode="view"
        handleCancel={handleCancel}
        loading={loading}
        onStatusChange={handleStatus}
        handleEdit={handleEdit}
      />
    </>
  );
};
