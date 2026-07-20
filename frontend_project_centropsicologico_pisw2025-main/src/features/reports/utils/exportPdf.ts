import type { MockReceipt, MockExpense, CommissionByPsychologist, CashFlowData } from "@/shared/interfaces/models/Financial";

function money(n: number) {
  return `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function dateDisplay(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

export function exportToPdf(
  reportType: string,
  data: MockReceipt[] | MockExpense[] | CommissionByPsychologist[] | CashFlowData,
  dateFrom: string,
  dateTo: string
) {
  const win = window.open("", "_blank");
  if (!win) return;

  let title = "Reporte";
  const typeLabels: Record<string, string> = {
    income: "Ingresos",
    expenses: "Egresos",
    receipts: "Recibos emitidos / anulados",
    commissions: "Comisiones por psicólogo",
    "cash-flow": "Flujo de fondos",
  };
  title = typeLabels[reportType] || "Reporte";

  let bodyHtml = "";

  if (reportType === "cash-flow" && "rows" in data) {
    const d = data as CashFlowData;
    bodyHtml = `
      <table>
        <thead><tr>
          <th>Fecha</th><th class="r">Saldo ant.</th><th class="r">Ingresos</th>
          <th class="r">Egr. fijos</th><th class="r">Egr. var.</th><th class="r">Egr. act.</th><th class="r">Total egr.</th><th class="r">Saldo final</th>
        </tr></thead>
        <tbody>
          ${d.rows.map(r => `<tr><td>${dateDisplay(r.day)}</td><td class="r">${money(r.openingBalance)}</td><td class="r">${money(r.income)}</td><td class="r">${money(r.fixedExpenses)}</td><td class="r">${money(r.variableExpenses)}</td><td class="r">${money(r.assetExpenses)}</td><td class="r">${money(r.totalExpenses)}</td><td class="r"><b>${money(r.closingBalance)}</b></td></tr>`).join("")}
        </tbody>
      </table>
      <div class="summary">Saldo inicial: ${money(d.opening)} | Total ingresos: ${money(d.totalIncome)} | Total egresos: ${money(d.totalExpenses)} | Saldo: <b>${money(d.final)}</b></div>`;
  } else if (reportType === "commissions") {
    const d = data as CommissionByPsychologist[];
    bodyHtml = `
      <table>
        <thead><tr><th>Psicólogo</th><th class="r">%</th><th class="r">Bruto</th><th class="r">Comisión</th><th class="r">Senses 8%</th><th class="r">IGV 18%</th><th class="r">Costos</th></tr></thead>
        <tbody>
          ${d.filter(c => c.grossIncome > 0).map(c => `<tr><td>${c.psychologist}</td><td class="r">${Math.round(c.commissionRate * 100)}%</td><td class="r">${money(c.grossIncome)}</td><td class="r"><b>${money(c.commission)}</b></td><td class="r">${money(c.sensesFee)}</td><td class="r">${money(c.igv)}</td><td class="r">${money(c.costs)}</td></tr>`).join("")}
        </tbody>
      </table>
      <div class="summary">Total comisiones: <b>${money(d.reduce((s, c) => s + c.commission, 0))}</b></div>`;
  } else {
    const d = data as MockReceipt[] | MockExpense[];
    const isExpense = "concept" in (d[0] || {});
    if (isExpense) {
      const exps = d as MockExpense[];
      bodyHtml = `
        <table>
          <thead><tr><th>Fecha</th><th>Tipo</th><th>Concepto</th><th>Proveedor</th><th class="r">Monto</th><th>Estado</th></tr></thead>
          <tbody>
            ${exps.map(e => `<tr><td>${dateDisplay(e.date)}</td><td>${e.type}</td><td>${e.concept}</td><td>${e.provider}</td><td class="r">${money(e.amount)}</td><td>${e.status}</td></tr>`).join("")}
          </tbody>
        </table>
        <div class="summary">Total: <b>${money(exps.reduce((s, e) => s + e.amount, 0))}</b></div>`;
    } else {
      const recs = d as MockReceipt[];
      bodyHtml = `
        <table>
          <thead><tr><th>Fecha</th><th>Paciente</th><th>Servicio</th><th>Psicólogo</th><th>Pago</th><th class="r">Total</th><th>Estado</th></tr></thead>
          <tbody>
            ${recs.map(r => `<tr><td>${dateDisplay(r.date)}</td><td>${r.patient}</td><td>${r.service}</td><td>${r.psychologist}</td><td>${r.payment}</td><td class="r">${money(r.total)}</td><td>${r.status}</td></tr>`).join("")}
          </tbody>
        </table>
        <div class="summary">Total: <b>${money(recs.filter(r => r.status !== "Anulado").reduce((s, r) => s + r.total, 0))}</b></div>`;
    }
  }

  win.document.write(`
    <html><head><meta charset="utf-8"><title>${title}</title>
    <style>
      body { font-family: system-ui, sans-serif; padding: 20px; color: #172033; }
      h1 { font-size: 18px; color: #0B2035; margin-bottom: 5px; }
      .period { font-size: 12px; color: #64748b; margin-bottom: 15px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { border-bottom: 1px solid #dce3ec; padding: 8px 6px; text-align: left; }
      th { background: #f1f5f9; font-size: 11px; text-transform: uppercase; letter-spacing: 0.3px; }
      .r { text-align: right; }
      .summary { margin-top: 12px; padding: 8px; background: #f8fafc; font-size: 13px; font-weight: 600; }
      @media print { body { padding: 0; } }
    </style>
    </head><body>
    <h1>${title}</h1>
    <div class="period">${dateDisplay(dateFrom)} - ${dateDisplay(dateTo)}</div>
    ${bodyHtml}
    <script>window.print();<${""}/script>
    </body></html>
  `);
  win.document.close();
}
