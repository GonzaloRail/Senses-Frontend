import { useState, useEffect } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { getMockAssets, deleteMockAsset } from "../api/mockAssetApi";
import type { Asset } from "../api/mockAssetApi";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AssetDetailsSheet } from "../components/AssetDetailsSheet";

export const InventoryPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [originFilter, setOriginFilter] = useState<string>("all");

  const loadData = async () => {
    setLoading(true);
    const mockData = await getMockAssets();
    setData(mockData);
    setLoading(false);
  };

  const handleDarDeBaja = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas dar de baja este activo?")) {
      await deleteMockAsset(id);
      loadData(); // Reload table
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredData = data.filter((asset) => {
    if (categoryFilter !== "all" && asset.categoria !== categoryFilter) return false;
    if (statusFilter !== "all" && asset.situacion !== statusFilter) return false;
    if (originFilter !== "all" && asset.origenAdquisicion !== originFilter) return false;
    return true;
  });

  const columns: ColumnDef<Asset>[] = [
    {
      accessorKey: "denominacion",
      header: "Denominación",
      cell: ({ row }) => <div className="font-medium">{row.original.denominacion}</div>,
    },
    {
      accessorKey: "categoria",
      header: "Categoría",
    },
    {
      accessorKey: "origenAdquisicion",
      header: "Origen",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span>{row.original.origenAdquisicion}</span>
          <span className="text-xs text-muted-foreground">{row.original.detalleOrigen}</span>
        </div>
      ),
    },
    {
      accessorKey: "cantidad",
      header: "Cant.",
    },
    {
      accessorKey: "situacion",
      header: "Situación",
      cell: ({ row }) => {
        const isOperativo = row.original.situacion === "Operativo";
        const isMantenimiento = row.original.situacion === "Mantenimiento";
        return (
          <Badge
            variant="default"
            className={`px-1.5 text-white ${
              isOperativo ? "bg-green-600 hover:bg-green-700" : 
              isMantenimiento ? "bg-amber-500 hover:bg-amber-600" : 
              "bg-red-600 hover:bg-red-700"
            }`}
          >
            {row.original.situacion}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const asset = row.original;
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
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600 focus:text-red-600"
                onClick={() => handleDarDeBaja(asset.id)}
              >
                Dar de Baja
              </DropdownMenuItem>
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
                  <SelectItem value="Equipos">Equipos</SelectItem>
                  <SelectItem value="Muebles">Muebles</SelectItem>
                  <SelectItem value="Electrónicos">Electrónicos</SelectItem>
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
                  <SelectItem value="Operativo">Operativo</SelectItem>
                  <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Origen</span>
              <Select value={originFilter} onValueChange={setOriginFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Compra Factura">Compra Factura</SelectItem>
                  <SelectItem value="Aporte Socio">Aporte Socio</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex gap-2">
              <FileSpreadsheet className="h-4 w-4 text-green-600" />
              Excel
            </Button>
            <Button variant="outline" className="flex gap-2">
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
      />
    </>
  );
};
