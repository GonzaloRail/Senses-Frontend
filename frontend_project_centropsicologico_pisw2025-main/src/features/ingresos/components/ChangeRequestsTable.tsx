import { useState } from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReviewChangeRequestModal } from "./ReviewChangeRequestModal";
import { CHANGE_TYPE_LABELS, CHANGE_STATUS_LABELS, dateDisplay } from "../utils/ingresosUtils";
import type { ChangeRequest } from "@/shared/interfaces/models/IncomeReceipt";

interface Props {
  requests: ChangeRequest[];
  loading?: boolean;
  isAdmin?: boolean;
  onRefresh?: () => void;
}

const statusBadge = (status: string) => {
  const colors: Record<string, string> = {
    PENDING: "bg-senses-secondary/15 text-senses-secondary",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  };
  return <Badge className={colors[status] || ""} variant="outline">{CHANGE_STATUS_LABELS[status] || status}</Badge>;
};

export const ChangeRequestsTable = ({ requests, loading, isAdmin, onRefresh }: Props) => {
  const [reviewTarget, setReviewTarget] = useState<ChangeRequest | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 15;
  const totalPages = Math.max(1, Math.ceil(requests.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const pageRequests = requests.slice(safePage * pageSize, (safePage + 1) * pageSize);

  if (loading) {
    return <div className="text-center text-muted-foreground py-12">Cargando solicitudes...</div>;
  }

  if (!requests.length) {
    return <div className="text-center text-muted-foreground py-12">No hay solicitudes de cambio.</div>;
  }

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Comprobante</TableHead>
              <TableHead>Solicitante</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Estado</TableHead>
              {isAdmin && <TableHead></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRequests.map((r) => (
              <TableRow key={r.id} className="hover:bg-muted/50">
                <TableCell>{CHANGE_TYPE_LABELS[r.type] || r.type}</TableCell>
                <TableCell className="font-mono">{r.receiptCode}</TableCell>
                <TableCell>
                  {r.requestedBy ? `${r.requestedBy.firstName} ${r.requestedBy.lastName}` : "-"}
                </TableCell>
                <TableCell className="max-w-xs truncate">{r.reason}</TableCell>
                <TableCell>{dateDisplay(r.createdAt)}</TableCell>
                <TableCell>{statusBadge(r.status)}</TableCell>
                {isAdmin && (
                  <TableCell>
                    {r.status === "PENDING" && (
                      <Button variant="outline" size="sm" onClick={() => setReviewTarget(r)}>
                        Revisar
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-4">
          <p className="text-sm text-muted-foreground">
            {requests.length} resultado(s) — Página {safePage + 1} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={safePage === 0} onClick={() => setPage(p => p - 1)}>
              Anterior
            </Button>
            <Button size="sm" variant="outline" disabled={safePage >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {reviewTarget && (
        <ReviewChangeRequestModal
          request={reviewTarget}
          open={true}
          onClose={() => setReviewTarget(null)}
          onReviewed={onRefresh}
        />
      )}
    </>
  );
};
