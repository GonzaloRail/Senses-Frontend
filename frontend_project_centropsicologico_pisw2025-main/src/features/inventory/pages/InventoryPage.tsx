import { useState, useEffect } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/shared/components/SiteHeader";
import { DataTable } from "@/shared/components/DataTable";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, FileSpreadsheet, FileText } from "lucide-react";
import { getInventoryItems, deleteInventoryItem, getCategories } from "../api/inventoryApi";
import type { InventoryItem, InventoryCategory } from "../api/inventoryApi";
import { exportInventoryExcel, exportInventoryPdf } from "../utils/exportInventory";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AssetDetailsSheet } from "../components/AssetDetailsSheet";

export const InventoryPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<InventoryItem | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const loadData = async () => {
    setLoading(true);
    try {
      const [itemsData, categoriesData] = await Promise.all([
        getInventoryItems(),
        getCategories()
      ]);
      setData(itemsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error loading inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDarDeBaja = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas dar de baja este activo?")) {
      try {
        await deleteInventoryItem(id);
        loadData(); // Reload table
      } catch (error) {
        console.error("Error deleting asset:", error);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredData = data.filter((asset) => {
    if (categoryFilter !== "all" && asset.categoryId !== categoryFilter) return false;
    if (statusFilter !== "all" && asset.situation !== statusFilter) return false;
    // Don't show DECOMMISSIONED by default unless specifically asked for? 
    // The requirement says "mantener el registro visible". So we show it.
    return true;
  });

  const columns: ColumnDef<InventoryItem>[] = [
    {
      accessorKey: "name",
      header: "Denominación",
      cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
    },
    {
      accessorKey: "categoryId",
      header: "Categoría",
      cell: ({ row }) => {
        const cat = categories.find(c => c.id === row.original.categoryId);
        return <span>{cat ? cat.name : "Desconocida"}</span>;
      }
    },
    {
      accessorKey: "invoiceNumber",
      header: "Factura",
      cell: ({ row }) => <span>{row.original.invoiceNumber || "N/A"}</span>,
    },
    {
      accessorKey: "quantity",
      header: "Cant.",
    },
    {
      accessorKey: "situation",
      header: "Situación",
      cell: ({ row }) => {
        const isOperativo = row.original.situation === "OPERATIVE";
        const isMantenimiento = row.original.situation === "MAINTENANCE";
        
        let label = "Dado de Baja";
        if (isOperativo) label = "Operativo";
        if (isMantenimiento) label = "Mantenimiento";

        return (
          <Badge
            variant="default"
            className={`px-1.5 text-white ${
              isOperativo ? "bg-green-600 hover:bg-green-700" : 
              isMantenimiento ? "bg-amber-500 hover:bg-amber-600" : 
              "bg-red-600 hover:bg-red-700"
            }`}
          >
            {label}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const asset = row.original;
        const isDadoDeBaja = asset.situation === "DECOMMISSIONED";
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => {
                setSelectedAsset(asset);
                setIsDetailsOpen(true);
              }}>
                Ver Detalles
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/inventory/${asset.id}/edit`)}>
                Editar
              </DropdownMenuItem>
              {!isDadoDeBaja && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-red-600 focus:text-red-600"
                    onClick={() => handleDarDeBaja(asset.id)}
                  >
                    Dar de Baja
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const fetchTableData = async () => {
    return {
      data: filteredData,
      pageCount: 1,
    };
  };

  return (
    <>
      <SiteHeader title="Inventario de Activos" />
      <div className="flex flex-1 flex-col p-4 md:p-6 gap-6">
        
        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-end justify-between bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex flex-wrap gap-4 flex-1">
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Categoría</span>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Situación</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="OPERATIVE">Operativo</SelectItem>
                  <SelectItem value="MAINTENANCE">Mantenimiento</SelectItem>
                  <SelectItem value="DECOMMISSIONED">Dado de Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex gap-2" onClick={() => exportInventoryExcel(filteredData, categories, "Inventario_Activos")}>
              <FileSpreadsheet className="h-4 w-4 text-green-600" />
              Excel
            </Button>
            <Button variant="outline" className="flex gap-2" onClick={() => exportInventoryPdf(filteredData, categories, "Inventario_Activos")}>
              <FileText className="h-4 w-4 text-red-600" />
              PDF
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Cargando activos...</div>
          ) : (
            <DataTable
              fetchData={fetchTableData}
              addItem={{
                addItemLabel: "Registrar Nuevo Activo",
                onClickAddItem: () => navigate("/inventory/create"),
              }}
              columns={columns as any}
            />
          )}
        </div>
      </div>

      <AssetDetailsSheet 
        asset={selectedAsset} 
        open={isDetailsOpen} 
        onOpenChange={setIsDetailsOpen} 
        categories={categories}
      />
    </>
  );
};
