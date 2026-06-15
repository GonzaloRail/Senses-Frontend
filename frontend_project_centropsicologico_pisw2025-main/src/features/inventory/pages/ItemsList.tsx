import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/shared/components/SiteHeader";
import { DataTable } from "@/shared/components/DataTable";
import { useNavigate } from "react-router";
import type { InventoryListSchema } from "@/shared/interfaces/tables/InventoryListSchema";
import { getAllItemsPaginatedApi } from "../api/itemsApi";
import { queryClient } from "@/lib/queryClient";
import type { ItemsPaginatedResponse } from "@/shared/interfaces/apiResponses/getAllItemsPaginatedResponse";

export const ItemsList = () => {
  const navigate = useNavigate();

  const columns: ColumnDef<InventoryListSchema>[] = [
    {
      accessorKey: "name",
      header: "Artículo",
      cell: ({ row }) => <div className="">{row.original.name}</div>,
    },
    {
      accessorKey: "quantity",
      header: "Cantidad",
      cell: ({ row }) => <div className="">{row.original.quantity}</div>,
    },
    {
      accessorKey: "isActive",
      header: "Estado",
      cell: ({ row }) => (
        <div>
          <Badge
            variant="default"
            className={`flex gap-1 px-1.5 text-white [&_svg]:size-3 ${row.original.isActive ? "bg-senses-success" : "bg-senses-danger"
              }`}
          >
            {row.original.isActive ? "Activo" : "Inactivo"}
          </Badge>
        </div>
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
              navigate(`/inventory/${row.original.id}`);
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
      await queryClient.fetchQuery<ItemsPaginatedResponse>({
        queryKey: ["items", page, take],
        queryFn: () => getAllItemsPaginatedApi({ page, take }),
      });

    const data = dataResponse.items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      isActive: item.isActive,
      adminButton: "Administrar",
    }));
    console.log(dataResponse);
    return {
      data,
      pageCount: dataResponse.totalPages,
    };
  };

  return (
    <>
      <SiteHeader title="Inventario" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <DataTable
              fetchData={fetchData}
              addItem={{
                addItemLabel: "Agregar nuevo artículo",
                onClickAddItem: () => {
                  navigate("/inventory/create");
                  console.log("se va agregar un nuevo artículo");
                },
              }}
              columns={columns}
            />
          </div>
        </div>
      </div>
    </>
  );
};