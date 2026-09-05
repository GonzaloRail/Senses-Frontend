import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { InventoryItem, InventoryCategory } from "../api/inventoryApi";
import { Separator } from "@/components/ui/separator";

interface AssetDetailsSheetProps {
  asset: InventoryItem | null;
  categories: InventoryCategory[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssetDetailsSheet({ asset, categories, open, onOpenChange }: AssetDetailsSheetProps) {
  if (!asset) return null;

  const categoryName = categories.find(c => c.id === asset.categoryId)?.name || "Desconocida";
  
  const situationMap = {
    OPERATIVE: "Operativo",
    MAINTENANCE: "En Mantenimiento",
    DECOMMISSIONED: "Dado de Baja"
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-xl">{asset.name}</SheetTitle>
          <SheetDescription>
            Detalles completos del activo registrado.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 py-4">
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
                <p className="font-medium">S/ {asset.unitPrice ? asset.unitPrice.toFixed(2) : "0.00"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="font-semibold text-primary">
                  S/ {asset.totalPrice ? asset.totalPrice.toFixed(2) : ((asset.unitPrice || 0) * asset.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
          
          {asset.imageUrl && (
            <>
              <Separator />
              <div className="space-y-4">
                <h4 className="text-sm font-semibold uppercase text-muted-foreground">Imagen</h4>
                <div className="rounded-md border p-2 bg-muted/20">
                  <img src={asset.imageUrl} alt={asset.name} className="w-full h-auto object-contain rounded" />
                </div>
              </div>
            </>
          )}

          <Separator />
          
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase text-muted-foreground">Auditoría</h4>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Fecha de Registro</p>
                <p className="font-medium">{new Date(asset.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
