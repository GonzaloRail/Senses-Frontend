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

interface PsychologistCommissionSettingsProps {
  psychologistId: string;
}

export const PsychologistCommissionSettings = ({ psychologistId }: PsychologistCommissionSettingsProps) => {
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
    onError: () => {
      toast.error("Ocurrió un error al actualizar los honorarios");
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
      validFrom: validFrom ? new Date(validFrom).toISOString() : undefined,
    });
  };

  if (isLoading) return <Loading message="Cargando configuración de honorarios..." />;

  const currentRate = rates?.find((r) => r.isActive);

  return (
    <Card className="mt-8 border-t-4 border-t-blue-500 shadow-md">
      <CardHeader className="bg-gray-50/50 pb-4">
        <CardTitle className="text-xl text-blue-900">Honorarios y Comisiones</CardTitle>
        <CardDescription>
          Configura el porcentaje de comisión que recibe este psicólogo por sus atenciones.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Formulario de actualización */}
          <div className="space-y-4 bg-white p-6 rounded-lg border shadow-sm">
            <h3 className="font-semibold text-gray-700">Tasa Actual</h3>
            <div className="flex items-center space-x-2">
              <span className="text-3xl font-bold text-blue-600">
                {currentRate ? `${currentRate.percentage}%` : "No configurado"}
              </span>
              {currentRate && <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Activa</Badge>}
            </div>

            <div className="space-y-4 pt-4 border-t mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="percentage">Nuevo Porcentaje (%)</Label>
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
                onClick={handleSave} 
                disabled={setRateMutation.isPending || !percentage}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {setRateMutation.isPending ? "Guardando..." : "Aplicar"}
              </Button>
              <p className="text-xs text-gray-500">
                Si dejas la fecha en blanco, la nueva tasa se aplicará a partir de hoy.
              </p>
            </div>
          </div>

          {/* Historial */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-700">Historial de Honorarios</h3>
            {rates && rates.length > 0 ? (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-50">
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
                        <TableCell>{new Date(rate.validFrom).toLocaleDateString()}</TableCell>
                        <TableCell>{rate.validTo ? new Date(rate.validTo).toLocaleDateString() : "-"}</TableCell>
                        <TableCell>
                          {rate.isActive ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Activo</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">Vencido</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded border text-center">
                No hay historial de honorarios registrado para este psicólogo.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
