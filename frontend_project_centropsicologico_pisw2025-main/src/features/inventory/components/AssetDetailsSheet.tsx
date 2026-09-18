import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getInventoryItemHistory } from "../api/inventoryApi";
import type { InventoryItem, InventoryCategory, InventoryItemHistory } from "../api/inventoryApi";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";

interface AssetDetailsSheetProps {
  asset: InventoryItem | null;
  categories: InventoryCategory[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssetDetailsSheet({ asset, categories, open, onOpenChange }: AssetDetailsSheetProps) {
  const navigate = useNavigate();
  const [history, setHistory] = useState<InventoryItemHistory[]>([]);

  useEffect(() => {
    if (open && asset?.id) {
      getInventoryItemHistory(asset.id)
        .then(setHistory)
        .catch(console.error);
    }
  }, [open, asset?.id]);

  if (!asset) return null;

  const categoryName = categories.find(c => c.id === asset.categoryId)?.name || "Desconocida";

  const situationMap = {
    OPERATIVE: "Operativo",
    MAINTENANCE: "En Mantenimiento",
    DECOMMISSIONED: "Dado de Baja"
  };

  const getImageUrl = (url: string | undefined) => {
    if (!url) return "/placeholder.png";
    if (url.includes("drive.google.com/file/d/")) {
      const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
      }
    }

    if (url.includes("googleusercontent.com")) {
      if (url.includes("=s")) {
        return url.replace(/=s\d+/, "=s0");
      }
      return `${url}=s0`;
    }

    return url;
  };


  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg w-[95vw] overflow-y-auto p-4">
        <div className="max-w-xl mx-auto">
          <SheetHeader className="pb-6 flex flex-row justify-between items-start">
            <div>
              <SheetTitle className="text-2xl text-center sm:text-left">{asset.name}</SheetTitle>
              <SheetDescription className="text-center sm:text-left mt-1">
                Detalles completos del activo registrado.
              </SheetDescription>
            </div>
            <Button variant="outline" size="sm" className="gap-2 mt-0 shrink-0" onClick={() => {
              onOpenChange(false);
              navigate(`/inventory/${asset.id}/edit`);
            }}>
              <Edit className="h-4 w-4" />
              Editar
            </Button>
          </SheetHeader>

          <div className="flex flex-col gap-8 py-2">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase text-muted-foreground">Información Principal</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Categoría</p>
                <p className="font-medium">{categoryName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Situación</p>
                <p className="font-medium">{situationMap[asset.situation]}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Nro. Factura / Origen</p>
                <p className="font-medium">{asset.invoiceNumber || "-"}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase text-muted-foreground">Características</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Marca</p>
                <p className="font-medium">{asset.brand || "No especifica"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Modelo</p>
                <p className="font-medium">{asset.model || "No especifica"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Color</p>
                <p className="font-medium">{asset.color || "No especifica"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Serie</p>
                <p className="font-medium">{asset.serialNumber || "No especifica"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Dimensiones</p>
                <p className="font-medium">{asset.dimensions || "No especifica"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Detalles / Descripción</p>
                <p className="font-medium">{asset.description || "No especifica"}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase text-muted-foreground">Valorización</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Cantidad</p>
                <p className="font-medium">{asset.quantity}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Precio Uni.</p>
                <p className="font-medium">S/ {asset.unitPrice ? Number(asset.unitPrice).toFixed(2) : "0.00"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="font-semibold text-primary">
                  S/ {asset.totalPrice ? Number(asset.totalPrice).toFixed(2) : (Number(asset.unitPrice || 0) * asset.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {asset.imageUrl && (
            <>
              <Separator />
              <div className="space-y-4">
                <h4 className="text-sm font-semibold uppercase text-muted-foreground">Imagen</h4>
                <div className="rounded-md border p-4 bg-muted/20 flex justify-center items-center">
                  <img
                    src={getImageUrl(asset.imageUrl)}
                    alt={asset.name}
                    className="max-w-full max-h-64 object-contain rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x400?text=Error+Cargando+Imagen";
                    }}
                  />
                </div>
              </div>
            </>
          )}

          <Separator />

          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase text-muted-foreground">Auditoría e Historial</h4>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Fecha de Registro Inicial</p>
                <p className="font-medium">{new Date(asset.createdAt).toLocaleString()}</p>
              </div>

              {history.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-3 font-medium">Últimos movimientos</p>
                  <div className="space-y-4 border-l-2 border-muted pl-4 ml-1">
                    {history.map((record) => (
                      <div key={record.id} className="relative">
                        <div className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-primary" />
                        <p className="text-sm font-medium text-foreground">
                          {record.action === "CREATION" && "Creación del Activo"}
                          {record.action === "UPDATE" && `Actualización de: ${record.field || "General"}`}
                          {record.action === "STATUS_CHANGE" && "Cambio de Estado"}
                          {record.action === "DELETION" && "Activo dado de baja"}
                        </p>
                        {record.oldValue && record.newValue && (
                          <p className="text-xs text-muted-foreground mt-1">
                            De <span className="line-through">{record.oldValue}</span> a <span className="font-semibold text-foreground">{record.newValue}</span>
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(record.createdAt).toLocaleString()} • {record.user ? `${record.user.firstName} ${record.user.lastName}` : "Usuario del sistema"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
