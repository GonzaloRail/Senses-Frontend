import { useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { money, pad } from "../utils/ingresosUtils";
import type { IncomeReceipt } from "@/shared/interfaces/models/IncomeReceipt";

interface Props {
  receipt: IncomeReceipt | null;
  serviceDescription?: string;
  open: boolean;
  onClose: () => void;
}

export const ReceiptPreviewModal = ({ receipt, serviceDescription, open, onClose }: Props) => {
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!receipt || !open) return null;

  const R = {
    ...receipt,
    serviceText: serviceDescription || receipt.service,
    formattedDate: receipt.date,
    formattedNumber: pad(receipt.number),
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-100">
      <style>{`
        @page { size: A4; margin: 8mm; }
        @media print {
          html, body { height: 100vh; margin: 0 !important; padding: 0 !important; }
          body * { visibility: hidden; }
          .receipt-print-area, .receipt-print-area * { visibility: visible; }
          .receipt-print-area { position: absolute; left: 0; top: 0; width: 100%; max-width: none !important; padding: 0; box-sizing: border-box; }
          .receipt-print-area > div { max-width: 680px; margin: 0 auto; }
          .receipt-no-print { display: none !important; }
        }
      `}</style>

      <div className="h-full flex flex-col">
        <div className="receipt-no-print flex items-center justify-between px-6 py-3 bg-white border-b shadow-sm">
          <h2 className="text-lg font-semibold">Recibo de pago</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cerrar</Button>
            <Button onClick={handlePrint}>Imprimir / PDF</Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 md:p-6 flex justify-center">
          <div
            className="receipt-print-area"
            style={{
              maxWidth: "680px",
              width: "100%",
              textTransform: "uppercase",
              margin: "0 auto",
              background: "#fff",
              padding: "18px 22px",
              fontFamily: "Arial, 'Segoe UI', Tahoma, sans-serif",
              color: "#000",
              printColorAdjust: "exact",
              WebkitPrintColorAdjust: "exact",
            }}
          >
            {/* CABECERA */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
              <div>
                <div style={{ fontFamily: "'Arial Black', Arial, sans-serif", fontSize: "17px", fontWeight: 900, letterSpacing: "0.5px", marginBottom: "4px", color: "#000" }}>
                  SENSES PSICÓLOGOS S.A.C.
                </div>
                <p style={{ fontSize: "8.5px", lineHeight: 1.35, fontWeight: 500, color: "#111", margin: 0 }}>
                  CALLE YAPURÁ 212, ZAMÁCOLA<br />
                  CERRO COLORADO - AREQUIPA<br />
                  CONTÁCTANOS: 054-685 6611 / 935 667 390
                </p>
              </div>

              {/* CUADRO RUC */}
              <div style={{ width: "190px", border: "1.5px solid #000", flexShrink: 0 }}>
                <div style={{ textAlign: "center", borderBottom: "1.5px solid #000", fontSize: "9.5px", fontWeight: 700, padding: "3px 0" }}>
                  RUC 20609694671
                </div>
                <div style={{ background: "#000", color: "#fff", fontSize: "10.5px", fontWeight: 700, textAlign: "center", padding: "4px 0", letterSpacing: "0.5px", printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}>
                  RECIBO DE PAGO
                </div>
                <div style={{ display: "flex", height: "17px", lineHeight: "17px", fontSize: "8.5px", borderBottom: "1.5px solid #000" }}>
                  <span style={{ flex: 1, textAlign: "center", borderRight: "1.5px solid #000", fontWeight: 700 }}>SERIE DE RECIBO</span>
                  <span style={{ width: "75px", textAlign: "center", fontWeight: 700 }}>{R.series}</span>
                </div>
                <div style={{ display: "flex", height: "17px", lineHeight: "17px", fontSize: "8.5px" }}>
                  <span style={{ flex: 1, textAlign: "center", borderRight: "1.5px solid #000", fontWeight: 700 }}>N° DE RECIBO</span>
                  <span style={{ width: "75px", textAlign: "center", fontWeight: 700 }}>{R.formattedNumber}</span>
                </div>
              </div>
            </div>

            <div style={{ borderTop: "1.5px solid #000", margin: "8px 0" }} />

            {/* SECCIÓN CLIENTE */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <label style={{ width: "92px", paddingTop: "3px", fontSize: "8px", fontWeight: 700, whiteSpace: "nowrap" }}>
                Recibí de CLIENTE:
              </label>

              <div style={{ flex: 1, marginRight: "10px", display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ border: "1px solid #000", height: "16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", fontWeight: 500, background: "#fff", padding: "0 5px" }}>
                  {R.client}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <label style={{ fontSize: "8px", fontWeight: 700, marginRight: "4px", whiteSpace: "nowrap" }}>CELULAR:</label>
                    <div style={{ border: "1px solid #000", height: "16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", fontWeight: 500, background: "#fff", padding: "0 5px", width: "62px" }}>
                      {R.phone}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <label style={{ fontSize: "8px", fontWeight: 700, marginRight: "4px", whiteSpace: "nowrap" }}>Forma de atención:</label>
                    <div style={{ border: "1px solid #000", height: "16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", fontWeight: 500, background: "#fff", padding: "0 5px", width: "140px" }}>
                      {R.attention}
                    </div>
                  </div>
                </div>
              </div>

              {/* DNI CLIENTE */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", width: "190px", flexShrink: 0 }}>
                <div style={{ fontWeight: 700, borderRight: "none", background: "#fff", padding: "0 6px", border: "1px solid #000", height: "16px", display: "flex", alignItems: "center", fontSize: "8px" }}>
                  DNI CLIENTE:
                </div>
                <div style={{ border: "1px solid #000", height: "16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", fontWeight: 500, background: "#fff", padding: "0 5px", width: "102px" }}>
                  {R.clientDni}
                </div>
              </div>
            </div>

            <div style={{ borderTop: "1.5px solid #000", margin: "8px 0" }} />

            {/* SECCIÓN PACIENTE */}
            <div>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}>
                <label style={{ width: "92px", fontSize: "8px", fontWeight: 700, whiteSpace: "nowrap" }}>PACIENTE:</label>
                <div style={{ flex: 1, marginRight: "10px", border: "1px solid #000", height: "16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", fontWeight: 500, background: "#fff", padding: "0 5px" }}>
                  {R.patient}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", width: "190px", flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, borderRight: "none", background: "#fff", padding: "0 6px", border: "1px solid #000", height: "16px", display: "flex", alignItems: "center", fontSize: "7.5px" }}>
                    DNI DE PACIENTE:
                  </div>
                  <div style={{ border: "1px solid #000", height: "16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", fontWeight: 500, background: "#fff", padding: "0 5px", width: "102px" }}>
                    {R.patientDoc}
                  </div>
                </div>
              </div>

              {/* CUERPO INFERIOR */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "stretch", marginTop: "1px" }}>
                {/* Columna Izquierda */}
                <div style={{ flex: 1, marginRight: "10px", display: "flex", flexDirection: "column" }}>
                  <div style={{ fontSize: "8px", fontWeight: 500, marginBottom: "1px" }}>Descripción del servicio:</div>
                  <div style={{ border: "1px solid #000", height: "85px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: 700, marginBottom: "3px" }}>
                    {R.serviceText}
                  </div>
                  <div style={{ fontSize: "6.5px", fontWeight: 700, marginBottom: "7px", letterSpacing: "-0.1px" }}>
                    Este recibo no es una boleta de venta, es provisional. Su boleta de venta o factura se hará llegar al correo electrónico / celular en formato PDF.
                  </div>

                  {/* Fecha + Forma de pago */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <label style={{ fontSize: "8px", fontWeight: 700, marginRight: "4px", whiteSpace: "nowrap" }}>FECHA DE REGISTRO:</label>
                      <div style={{ border: "1px solid #000", height: "16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", fontWeight: 500, background: "#fff", padding: "0 5px", width: "80px" }}>
                        {R.formattedDate}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <label style={{ fontSize: "8px", fontWeight: 700, marginRight: "4px", whiteSpace: "nowrap" }}>Forma de pago:</label>
                      <div style={{ border: "1px solid #000", height: "16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", fontWeight: 500, background: "#fff", padding: "0 5px", width: "140px" }}>
                        {R.payment}
                      </div>
                    </div>
                  </div>

                  {/* Psicólogo */}
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <label style={{ width: "92px", textAlign: "right", marginRight: "4px", fontSize: "8px", fontWeight: 700, whiteSpace: "nowrap" }}>Psicólogo (a):</label>
                    <div style={{ flex: 1, border: "1px solid #000", height: "16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", fontWeight: 500, background: "#fff", padding: "0 5px" }}>
                      {R.psychologist}
                    </div>
                  </div>
                </div>

                {/* Columna Derecha (Logo + Totales) */}
                <div style={{ width: "190px", display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "flex-end", flexShrink: 0 }}>
                  {/* Logo */}
                  <div style={{ alignSelf: "center", textAlign: "center", marginTop: "3px" }}>
                    <svg style={{ width: "46px", height: "30px", marginBottom: "-3px" }} viewBox="0 0 100 60">
                      <rect x="25" y="8" width="12" height="20" rx="5" fill="#111" />
                      <path d="M 58 18 Q 70 12 82 20" stroke="#111" strokeWidth="9" strokeLinecap="round" fill="none" />
                      <path d="M 32 44 Q 55 58 78 40" stroke="#111" strokeWidth="9" strokeLinecap="round" fill="none" />
                    </svg>
                    <div style={{ fontFamily: "'Arial Black', Impact, sans-serif", fontSize: "15px", letterSpacing: "-0.5px", lineHeight: 1, color: "#111" }}>Senses</div>
                    <div style={{ fontSize: "7.5px", fontWeight: 900, letterSpacing: "0.5px", color: "#111", marginTop: "1px" }}>PSICÓLOGOS</div>
                  </div>

                  {/* Totales */}
                  <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                    {[
                      { label: "Sub. Total", value: money(R.subtotal) },
                      { label: "IGV 18%", value: money(R.igv) },
                      { label: "IMPORTE TOTAL", value: money(R.total), bold: true },
                    ].map((row, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", width: "100%", marginTop: i > 0 ? "-1px" : 0 }}>
                        <label style={{ marginRight: "6px", fontSize: "8px", fontWeight: row.bold ? 700 : 500 }}>{row.label}</label>
                        <div style={{ border: "1px solid #000", width: "102px", height: "16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", fontWeight: row.bold ? 700 : 500, background: "#fff", padding: "0 5px" }}>
                          {row.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
