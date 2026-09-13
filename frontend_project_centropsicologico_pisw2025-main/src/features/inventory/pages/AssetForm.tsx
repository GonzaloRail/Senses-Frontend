import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { useForm } from "react-hook-form";
import { SiteHeader } from "@/shared/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { createInventoryItem, getCategories, createCategory, uploadInventoryImage, getInventoryItemById, updateInventoryItem } from "../api/inventoryApi";
import type { InventoryCategory, CreateInventoryItemPayload, InventorySituation } from "../api/inventoryApi";
import { Save, ArrowLeft, Plus } from "lucide-react";

export const AssetForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [total, setTotal] = useState(0);
  
  // Create Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDesc, setNewCategoryDesc] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  // Image Upload State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, reset } = useForm<CreateInventoryItemPayload>({
    defaultValues: {
      categoryId: "",
      situation: "OPERATIVE",
      quantity: 1,
      unitPrice: 0,
      invoiceNumber: "",
      name: "",
      brand: "",
      model: "",
      color: "",
      serialNumber: "",
      dimensions: "",
      description: "",
      imageUrl: ""
    }
  });

  const loadCategories = async () => {
    try {
      const cats = await getCategories();
      setCategories(cats);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const loadItem = async (itemId: string) => {
    try {
      const item = await getInventoryItemById(itemId);
      reset({
        categoryId: item.categoryId,
        situation: item.situation,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice || 0),
        invoiceNumber: item.invoiceNumber || "",
        name: item.name,
        brand: item.brand || "",
        model: item.model || "",
        color: item.color || "",
        serialNumber: item.serialNumber || "",
        dimensions: item.dimensions || "",
        description: item.description || "",
        imageUrl: item.imageUrl || ""
      });
      if (item.imageUrl) {
        setImagePreview(item.imageUrl);
      }
    } catch (error) {
      console.error("Error loading item:", error);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
    if (isEditMode && id) {
      loadItem(id);
    }
  }, [id, isEditMode]);

  const cantidad = watch("quantity");
  const precioUnitario = watch("unitPrice");
  const categoryId = watch("categoryId");
  const situation = watch("situation");

  useEffect(() => {
    const qty = Number(cantidad) || 0;
    const price = Number(precioUnitario) || 0;
    setTotal(qty * price);
  }, [cantidad, precioUnitario]);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    setCreatingCategory(true);
    try {
      const newCat = await createCategory({ name: newCategoryName, description: newCategoryDesc });
      setCategories([...categories, newCat]);
      setValue("categoryId", newCat.id);
      setIsCategoryModalOpen(false);
      setNewCategoryName("");
      setNewCategoryDesc("");
    } catch (error) {
      console.error("Error creating category:", error);
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: CreateInventoryItemPayload) => {
    setLoading(true);
    try {
      let finalImageUrl = data.imageUrl;

      // If user selected a local file, upload it first
      if (imageFile) {
        const uploadResult = await uploadInventoryImage(imageFile);
        finalImageUrl = uploadResult.url;
      }

      if (isEditMode && id) {
        await updateInventoryItem(id, {
          ...data,
          quantity: Number(data.quantity),
          unitPrice: Number(data.unitPrice),
          imageUrl: finalImageUrl,
        });
      } else {
        await createInventoryItem({
          ...data,
          quantity: Number(data.quantity),
          unitPrice: Number(data.unitPrice),
          imageUrl: finalImageUrl,
        });
      }
      navigate("/inventory");
    } catch (error) {
      console.error("Error saving item:", error);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex flex-1 items-center justify-center h-full">
        <p className="text-muted-foreground">Cargando datos del activo...</p>
      </div>
    );
  }

  return (
    <>
      <SiteHeader title={isEditMode ? "Editar Activo" : "Registrar Nuevo Activo"} />
      <div className="flex flex-1 flex-col p-4 md:p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl mx-auto w-full space-y-6">
          
          <div className="flex items-center justify-between">
            <Button type="button" variant="ghost" onClick={() => navigate("/inventory")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver al inventario
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary text-primary-foreground">
              {loading ? "Guardando..." : <><Save className="mr-2 h-4 w-4" /> {isEditMode ? "Actualizar Activo" : "Guardar Activo"}</>}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>1. Información Principal</CardTitle>
              <CardDescription>Datos descriptivos y de origen del activo.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <Label>Denominación del Activo *</Label>
                <Input {...register("name", { required: true })} placeholder="Ej: Escritorio de Melamina, Silla Ergonómica..." />
              </div>

              <div className="space-y-2">
                <Label>Categoría / Tipo *</Label>
                <div className="flex gap-2">
                  <Select 
                    value={categoryId} 
                    onValueChange={(val) => setValue("categoryId", val)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Seleccione categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Add Category Dialog */}
                  <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" size="icon">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Añadir Nueva Categoría</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Nombre de la Categoría</Label>
                          <Input value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="Ej: Herramientas" />
                        </div>
                        <div className="space-y-2">
                          <Label>Descripción (Opcional)</Label>
                          <Input value={newCategoryDesc} onChange={e => setNewCategoryDesc(e.target.value)} placeholder="Breve descripción" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsCategoryModalOpen(false)}>Cancelar</Button>
                        <Button type="button" onClick={handleCreateCategory} disabled={!newCategoryName || creatingCategory}>
                          {creatingCategory ? "Guardando..." : "Guardar Categoría"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Situación / Estado *</Label>
                <Select 
                  value={situation} 
                  onValueChange={(val) => setValue("situation", val as InventorySituation)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPERATIVE">Operativo (En condición óptima)</SelectItem>
                    <SelectItem value="MAINTENANCE">Mantenimiento</SelectItem>
                    <SelectItem value="DECOMMISSIONED">Dado de Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Factura / Comprobante de Origen</Label>
                <Input {...register("invoiceNumber")} placeholder="Ej: F001-00123" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Características Adicionales</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Marca</Label>
                <Input {...register("brand")} placeholder="Opcional" />
              </div>
              <div className="space-y-2">
                <Label>Modelo</Label>
                <Input {...register("model")} placeholder="Opcional" />
              </div>
              <div className="space-y-2">
                <Label>Dimensiones</Label>
                <Input {...register("dimensions")} placeholder="Ej: 120x60x75 cm" />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <Input {...register("color")} placeholder="Opcional" />
              </div>
              <div className="space-y-2">
                <Label>Número de Serie</Label>
                <Input {...register("serialNumber")} placeholder="Opcional" />
              </div>
              <div className="space-y-2">
                <Label>Detalles / Descripción</Label>
                <Input {...register("description")} placeholder="Ej: Con 4 patas, madera caoba" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Imagen del Activo</Label>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <Input type="file" accept="image/*" onChange={handleImageChange} className="max-w-sm" />
                    <span className="text-sm text-muted-foreground">O ingrese una URL directamente:</span>
                    <Input {...register("imageUrl")} placeholder="https://..." className="flex-1" />
                  </div>
                  {imagePreview && (
                    <div className="mt-2 relative w-32 h-32 border rounded-md overflow-hidden bg-muted flex items-center justify-center">
                      <img src={imagePreview} alt="Vista previa" className="object-cover w-full h-full" />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Valorización</CardTitle>
              <CardDescription>Cálculo automático según cantidad y precio.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Cantidad *</Label>
                <Input type="number" min="1" {...register("quantity", { required: true, min: 1 })} />
              </div>
              <div className="space-y-2">
                <Label>Precio Unitario (S/) *</Label>
                <Input type="number" step="0.01" min="0" {...register("unitPrice", { min: 0 })} />
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
