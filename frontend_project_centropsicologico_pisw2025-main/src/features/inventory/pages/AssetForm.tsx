import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { SiteHeader } from "@/shared/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createMockAsset } from "../api/mockAssetApi";
import type { AssetOrigin, AssetCategory, AssetStatus } from "../api/mockAssetApi";
import { Save, ArrowLeft } from "lucide-react";

interface FormData {
  origenAdquisicion: AssetOrigin;
  detalleOrigen: string;
  denominacion: string;
  marca: string;
  modelo: string;
  categoria: AssetCategory;
  color: string;
  serie: string;
  cantidad: number;
  precioUnitario: number;
  situacion: AssetStatus;
  imagenUrl: string;
}

export const AssetForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      origenAdquisicion: "Compra Factura",
      categoria: "Equipos",
      situacion: "Operativo",
      cantidad: 1,
      precioUnitario: 0,
      detalleOrigen: "",
      denominacion: "",
      marca: "",
      modelo: "",
      color: "",
      serie: "",
      imagenUrl: ""
    }
  });

  const cantidad = watch("cantidad");
  const precioUnitario = watch("precioUnitario");
  const origenAdquisicion = watch("origenAdquisicion");

  useEffect(() => {
    const qty = Number(cantidad) || 0;
    const price = Number(precioUnitario) || 0;
    setTotal(qty * price);
  }, [cantidad, precioUnitario]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    await createMockAsset({
      ...data,
      cantidad: Number(data.cantidad),
      precioUnitario: Number(data.precioUnitario),
    });
    setLoading(false);
    navigate("/inventory");
  };

  return (
    <>
      <SiteHeader title="Registrar Nuevo Activo" />
      <div className="flex flex-1 flex-col p-4 md:p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl mx-auto w-full space-y-6">
          
          <div className="flex items-center justify-between">
            <Button type="button" variant="ghost" onClick={() => navigate("/inventory")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver al inventario
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary text-primary-foreground">
              {loading ? "Guardando..." : <><Save className="mr-2 h-4 w-4" /> Guardar Activo</>}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>1. Origen de Adquisición</CardTitle>
              <CardDescription>Indique de dónde proviene el activo fijo.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Origen de Adquisición *</Label>
                <Select 
                  value={origenAdquisicion} 
                  onValueChange={(val) => setValue("origenAdquisicion", val as AssetOrigin)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione el origen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Compra Factura">Compra con Factura</SelectItem>
                    <SelectItem value="Compra Boleta">Compra con Boleta</SelectItem>
                    <SelectItem value="Aporte Socio">Aporte de Socio</SelectItem>
                    <SelectItem value="Otros">Otros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>
                  {origenAdquisicion === "Aporte Socio" ? "Nombre del Socio / Detalle *" : "Nro de Factura / Boleta / Detalle *"}
                </Label>
                <Input {...register("detalleOrigen", { required: true })} placeholder="Ingrese detalle" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Información Principal</CardTitle>
              <CardDescription>Datos descriptivos del activo.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <Label>Denominación del Activo *</Label>
                <Input {...register("denominacion", { required: true })} placeholder="Ej: Escritorio de Melamina, Silla Ergonómica..." />
              </div>

              <div className="space-y-2">
                <Label>Categoría / Tipo *</Label>
                <Select 
                  value={watch("categoria")} 
                  onValueChange={(val) => setValue("categoria", val as AssetCategory)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Equipos">Equipos</SelectItem>
                    <SelectItem value="Muebles">Muebles</SelectItem>
                    <SelectItem value="Electrónicos">Electrónicos</SelectItem>
                    <SelectItem value="Otros">Otros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Situación / Estado *</Label>
                <Select 
                  value={watch("situacion")} 
                  onValueChange={(val) => setValue("situacion", val as AssetStatus)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Operativo">Operativo (En condición óptima)</SelectItem>
                    <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Características Físicas</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Marca</Label>
                <Input {...register("marca")} placeholder="Opcional" />
              </div>
              <div className="space-y-2">
                <Label>Modelo</Label>
                <Input {...register("modelo")} placeholder="Opcional" />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <Input {...register("color")} placeholder="Opcional" />
              </div>
              <div className="space-y-2">
                <Label>Número de Serie</Label>
                <Input {...register("serie")} placeholder="Opcional" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>URL de Imagen</Label>
                <Input {...register("imagenUrl")} placeholder="Opcional - Link de la foto del activo" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Valorización</CardTitle>
              <CardDescription>Cálculo automático según cantidad y precio.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Cantidad *</Label>
                <Input type="number" min="1" {...register("cantidad", { required: true, min: 1 })} />
              </div>
              <div className="space-y-2">
                <Label>Precio Unitario (S/) *</Label>
                <Input type="number" step="0.01" min="0" {...register("precioUnitario", { required: true, min: 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Valor Total (S/)</Label>
                <Input 
                  readOnly 
                  value={total.toFixed(2)} 
                  className="bg-muted font-semibold text-primary" 
                />
              </div>
            </CardContent>
          </Card>

        </form>
      </div>
    </>
  );
};
