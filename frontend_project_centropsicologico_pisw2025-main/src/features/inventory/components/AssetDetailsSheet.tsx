import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Asset } from "../api/mockAssetApi";
import { Separator } from "@/components/ui/separator";

interface AssetDetailsSheetProps {
  asset: Asset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssetDetailsSheet({ asset, open, onOpenChange }: AssetDetailsSheetProps) {
  if (!asset) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-xl">{asset.denominacion}</SheetTitle>
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
                <p className="font-medium">{asset.categoria}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Situación</p>
                <p className="font-medium">{asset.situacion}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Origen</p>
                <p className="font-medium">{asset.origenAdquisicion}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Detalle Origen</p>
                <p className="font-medium">{asset.detalleOrigen || "-"}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase text-muted-foreground">Características</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Marca</p>
                <p className="font-medium">{asset.marca || "No especifica"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Modelo</p>
                <p className="font-medium">{asset.modelo || "No especifica"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Color</p>
                <p className="font-medium">{asset.color || "No especifica"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Serie</p>
                <p className="font-medium">{asset.serie || "No especifica"}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase text-muted-foreground">Valorización</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Cantidad</p>
                <p className="font-medium">{asset.cantidad}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Precio Uni.</p>
                <p className="font-medium">S/ {asset.precioUnitario.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="font-semibold text-primary">S/ {asset.total.toFixed(2)}</p>
              </div>
            </div>
          </div>
          
          {asset.imagenUrl && (
            <>
              <Separator />
              <div className="space-y-4">
                <h4 className="text-sm font-semibold uppercase text-muted-foreground">Imagen</h4>
                <div className="rounded-md border p-2 bg-muted/20">
                  <img src={asset.imagenUrl} alt={asset.denominacion} className="w-full h-auto object-contain rounded" />
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
