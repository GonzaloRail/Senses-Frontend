import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";
import { DataTable } from "@/shared/components/DataTable";
import { SiteHeader } from "@/shared/components/SiteHeader";
import type { EvaluationsPaginatedResponse } from "@/shared/interfaces/apiResponses/getAllEvaluationsPaginatedResponse";
import type { EvaluationsListSchema } from "@/shared/interfaces/tables/EvaluationsListSchema";
import type { ColumnDef } from "@tanstack/react-table";
import { useNavigate } from "react-router";
import { getAllEvaluationsApi } from "../api/evaluationsApi";
import { ReorderSectionsModal } from "../components/ReorderSectionsModal";
import { useState } from "react";

export const EvaluationsList = () => {
  const navigate = useNavigate();
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);

  const columns: ColumnDef<EvaluationsListSchema>[] = [
    {
      accessorKey: "name",
      header: "Evaluación",
      cell: ({ row }) => <div>{row.original.name}</div>,
    },
    {
      accessorKey: "testCount",
      header: "Cantidad de pruebas",
      cell: ({ row }) => <div>{row.original.testCount}</div>,
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => (
        <Badge
          variant="default"
          className={`flex gap-1 px-1.5 text-white [&_svg]:size-3 ${
            row.original.status ? "bg-senses-success" : "bg-senses-danger"
          }`}
        >
          {row.original.status ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
    {
      accessorKey: "adminButton",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button
            variant="outline"
            className="flex px-1.5 text-muted-foreground cursor-pointer"
            onClick={() => {
              navigate(`/evaluations/${row.original.id}`);
            }}
          >
            {row.original.adminButton}
          </Button>
        </div>
      ),
    },
  ];

  const fetchData = async ({ pageIndex = 0, pageSize = 10 }) => {
    const page = pageIndex + 1;
    const take = pageSize;

    const dataResponse =
      await queryClient.fetchQuery<EvaluationsPaginatedResponse>({
        queryKey: ["evaluations", page, take],
        queryFn: () => getAllEvaluationsApi({ page, take }),
      });

    const data = dataResponse.evaluations.map((evaluation) => ({
      id: evaluation.id,
      name: evaluation.name,
      testCount: evaluation.testCount,
      status: evaluation.isActive,
      adminButton: "Administrar",
    }));

    return {
      data: data,
      pageCount: dataResponse.totalPages,
    };
  };

  return (
    <>
      <SiteHeader title="Evaluaciones" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <DataTable
              fetchData={fetchData}
              optionalExtraButton={{
                optionalExtraButtonLabel: "Ordenar secciones",
                onClickOptionalExtraButton: () => {
                  setIsReorderModalOpen(true);
                },
              }}
              addItem={{
                addItemLabel: "Agregar nueva evaluación",
                onClickAddItem: () => {
                  navigate("/evaluations/create");
                },
              }}
              columns={columns}
            />
          </div>
        </div>
      </div>
      <ReorderSectionsModal
        isOpen={isReorderModalOpen}
        onClose={() => setIsReorderModalOpen(false)}
      />
    </>
  );
};
