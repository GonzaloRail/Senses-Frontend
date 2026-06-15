import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/shared/components/SearchableSelect";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { useItemsSearchQuery } from "@/features/inventory/hooks";
import { useUpdateItemInstances } from "@/features/inventory/hooks/useItemInstancesMutations";
import type { ItemInstance } from "@/shared/interfaces/models";
import { InputWithHelper } from "@/shared/components/InputWithHelper";
import { queryClient } from "@/lib/queryClient";
import { useAlert } from "@/shared/hooks/useAlert";

// Schema para el formulario del modal
const assignItemSchema = z.object({
  items: z.array(
    z.object({
      itemId: z.string().optional(),
      quantity: z.number().optional(),
    })
  ),
});

interface InputRow {
  id: string;
  itemId: string;
  quantity: number;
}

type AssignItemSchema = z.infer<typeof assignItemSchema>;

interface AssignItemsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  officeId: string;
  officeItems: {
    itemId: string;
    quantity: number;
    instances: ItemInstance[];
    name: string;
  }[];
}

export const AssignItemsModal = ({
  open,
  onOpenChange,
  officeId,
  officeItems,
}: AssignItemsModalProps) => {
  const [loading, setLoading] = useState(false);
  const [inputRows, setInputRows] = useState<InputRow[]>([
    { id: "1", itemId: "", quantity: 0 },
  ]);

  const {
    handleSubmit,
    register,
    reset,
    setValue,
    formState: { errors },
  } = useForm<AssignItemSchema>({
    resolver: zodResolver(assignItemSchema),
    defaultValues: {
      items: [{ itemId: "", quantity: 0 }],
    },
  });

  const itemsSearch = useItemsSearchQuery();
  const updateInstances = useUpdateItemInstances();

  useEffect(() => {
    if (open) {
      console.log("officeitems: ", officeItems);
      // Asegurarnos que officeItems existe y es un array
      if (Array.isArray(officeItems) && officeItems.length > 0) {
        console.log("Office items:", officeItems);

        // Convertir los items existentes al formato que necesitamos
        const existingRows = officeItems.map((item, index) => ({
          id: (index + 1).toString(),
          itemId: item.itemId,
          quantity: item.quantity,
        }));

        console.log("er:", existingRows);

        // Agregar una fila vacía al final
        const initialRows = [
          ...existingRows,
          {
            id: (existingRows.length + 1).toString(),
            itemId: "",
            quantity: 0,
          },
        ];

        // Actualizar tanto inputRows como el formulario
        setInputRows(initialRows);

        // Actualizar el formulario con los valores iniciales
        const formValues = initialRows.map((row) => ({
          itemId: row.itemId,
          quantity: row.quantity,
        }));

        reset({ items: formValues!! });

        console.log("ir: ", initialRows);
      }

      // Cargar la lista de items disponibles
      //itemsSearch.setNameQuery("");
    }
  }, [open]);

  const handleQuantityChange = (rowId: string, quantity: number) => {
    setInputRows((prev) => {
      const newRows = prev.map((row) =>
        row.id === rowId ? { ...row, quantity } : row
      );

      // Verificar si la fila actual está completa
      const currentRow = newRows.find((r) => r.id === rowId);
      if (currentRow?.itemId && quantity > 0) {
        // Verificar si es la última fila
        const isLastRow = rowId === newRows[newRows.length - 1].id;

        if (isLastRow) {
          console.log("Adding new row"); // Para debug
          // Agregar nueva fila
          return [
            ...newRows,
            {
              id: (newRows.length + 1).toString(),
              itemId: "",
              quantity: 0,
            },
          ];
        }
      }
      return newRows;
    });
  };

  const handleItemChange = (rowId: string, itemId: string) => {
    setInputRows((prev) => {
      const index = prev.findIndex((row) => row.id === rowId);
      if (index === -1) return prev;

      setValue(`items.${index}.itemId`, itemId);
      return prev.map((row) => (row.id === rowId ? { ...row, itemId } : row));
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Filtrar solo las filas completas (con item y cantidad)
      const validItems = inputRows
        .filter((row) => row.itemId && row.quantity >= 0)
        .map((row) => ({
          itemId: row.itemId,
          quantity: row.quantity,
        }));

      console.log("Valid items:", validItems);

      if (validItems.length === 0) {
        throw new Error("Debe agregar al menos un artículo");
      }

      for (const item of validItems) {
        console.log(
          `Updating item ${item.itemId} with quantity ${item.quantity}`
        );
        await updateInstances.mutateAsync({
          id: item.itemId,
          itemInstancesToUpdate: {
            itemId: item.itemId,
            officeId: officeId,
            quantity: item.quantity,
          },
        });
      }

      queryClient.invalidateQueries({ queryKey: ["office", officeId] });
      useAlert().showAlert(
        "Los artículos han sido asignados correctamente",
        "success"
      );

      onOpenChange(false);
      reset();
    } catch (error) {
      console.error("Error al asignar items:", error);
    } finally {
      setLoading(false);
    }
  };

  console.log("errors: ", errors);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-center">
            Asignar artículos al consultorio
          </DialogTitle>
          <form
            onSubmit={handleSubmit(handleSave)}
            className="max-h-[35vh] overflow-y-auto"
          >
            {inputRows.map((row, index) => (
              <div
                key={row.id}
                className="flex items-center gap-2 justify-center"
              >
                <div className="flex-1 max-w-60">
                  <SearchableSelect
                    id={`item-${row.id}`}
                    helper="Buscar artículo"
                    value={row.itemId}
                    options={
                      itemsSearch.items.map((item) => ({
                        value: item.id,
                        label: item.name,
                      })) ?? []
                    }
                    onValueChange={(value) => handleItemChange(row.id, value)}
                    onSearch={itemsSearch.setNameQuery}
                  />
                </div>
                <div>
                  <InputWithHelper
                    id={`quantity-${row.id}`}
                    helper="Cantidad"
                    type="number"
                    className="max-w-16"
                    value={row.quantity.toString()}
                    disabled={!row.itemId}
                    {...register(`items.${index}.quantity`, {
                      valueAsNumber: true,
                    })}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const value = parseInt(e.target.value);
                      handleQuantityChange(row.id, value);
                    }}
                    errors={
                      row.itemId ? errors.items?.[index]?.quantity : undefined
                    }
                  />
                </div>
              </div>
            ))}

            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="destructive"
                onClick={() => onOpenChange(false)}
                type="button"
                disabled={loading}
              >
                Volver
              </Button>
              <Button
                type="submit"
                disabled={
                  loading ||
                  !inputRows.some((row) => row.itemId && row.quantity >= 0)
                }
              >
                Guardar
              </Button>
            </div>
          </form>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
