import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getCommissionRatesApi, setCommissionRateApi } from "../../commissions/api/commissionsApi";
import { Loading } from "@/shared/components/Loading";
import type { AxiosError } from "axios";
import { Info, Percent } from "lucide-react";

interface PsychologistCommissionSettingsProps {
  psychologistId: string;
  canEdit: boolean;
}

function formatLimaDate(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export const PsychologistCommissionSettings = ({ psychologistId, canEdit }: PsychologistCommissionSettingsProps) => {
  const queryClient = useQueryClient();
  const [percentage, setPercentage] = useState<string>("");
  const [validFrom, setValidFrom] = useState<string>("");

  const { data: rates, isLoading } = useQuery({
    queryKey: ["commissionRates", psychologistId],
    queryFn: () => getCommissionRatesApi(psychologistId),
    enabled: !!psychologistId,
  });

  const setRateMutation = useMutation({
    mutationFn: (newRate: { psychologistId: string; percentage: number; validFrom?: string }) => setCommissionRateApi(newRate),
    onSuccess: () => {
      toast.success("Honorarios actualizados correctamente");
      setPercentage("");
      setValidFrom("");
      queryClient.invalidateQueries({ queryKey: ["commissionRates", psychologistId] });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message ?? "Ocurrió un error al actualizar los honorarios");
    },
  });

  const handleSave = () => {
    const numericPercentage = parseFloat(percentage);
    if (isNaN(numericPercentage) || numericPercentage < 0 || numericPercentage > 100) {
      toast.error("El porcentaje debe ser un número entre 0 y 100");
      return;
    }

    setRateMutation.mutate({
      psychologistId,
      percentage: numericPercentage,
      validFrom: validFrom ? new Date(`${validFrom}T00:00:00-05:00`).toISOString() : undefined,
    });
  };

  if (isLoading) return <Loading message="Cargando configuración de honorarios..." />;

  const currentRate = rates?.find((r) => r.isActive);

  return (
    <Card className="overflow-hidden shadow-sm">
      <CardHeader className="border-b bg-muted/30">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Percent className="h-5 w-5 text-primary" />
          Honorarios y comisiones
        </CardTitle>
        <CardDescription>
          Define el porcentaje que recibirá el psicólogo por las citas efectivamente cobradas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-5 md:p-6">
        <div className="flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            La tasa se aplica según la fecha del cobro. Una nueva vigencia conserva el historial y no modifica cálculos anteriores.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(300px,0.8fr)_minmax(420px,1.2fr)]">
          
          {/* Formulario de actualización */}
          <div className="space-y-4 rounded-xl border bg-muted/20 p-5">
            <h3 className="font-semibold">Tasa actual</h3>
            <div className="flex items-center space-x-2">
              <span className="text-3xl font-bold text-primary">
                {currentRate ? `${currentRate.percentage}%` : "No configurado"}
              </span>
              {currentRate && <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Activa</Badge>}
            </div>

            {canEdit ? (
            <div className="space-y-4 pt-4 border-t mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="percentage">Nuevo porcentaje (%)</Label>
                  <Input
                    id="percentage"
                    type="number"
                    placeholder="Ej: 50"
                    value={percentage}
                    onChange={(e) => setPercentage(e.target.value)}
                    min="0"
                    max="100"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="validFrom">Vigente a partir de</Label>
                  <Input
                    id="validFrom"
                    type="date"
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                  />
                </div>
              </div>
              <Button 
                type="button"
                onClick={handleSave} 
                disabled={setRateMutation.isPending || !percentage}
                className="w-full"
              >
                {setRateMutation.isPending ? "Guardando..." : "Aplicar"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Si dejas la fecha en blanco, la nueva tasa se aplicará a partir de hoy.
              </p>
            </div>
            ) : (
              <p className="pt-4 border-t text-sm text-muted-foreground">
                Solo Gerencia puede modificar el porcentaje de comisión.
              </p>
            )}
          </div>

          {/* Historial */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Historial de tasas</h3>
              <p className="mt-1 text-sm text-muted-foreground">Cada cambio mantiene su periodo de vigencia.</p>
            </div>
            {rates && rates.length > 0 ? (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead>Porcentaje</TableHead>
                      <TableHead>Desde</TableHead>
                      <TableHead>Hasta</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rates.map((rate) => (
                      <TableRow key={rate.id}>
                        <TableCell className="font-medium">{rate.percentage}%</TableCell>
                        <TableCell>{formatLimaDate(rate.validFrom)}</TableCell>
                        <TableCell>{rate.validTo ? formatLimaDate(rate.validTo) : "-"}</TableCell>
                        <TableCell>
                          {rate.isActive ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Activo</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-muted text-muted-foreground">Vencido</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic p-4 bg-muted/30 rounded border text-center">
                No hay historial de honorarios registrado para este psicólogo.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
