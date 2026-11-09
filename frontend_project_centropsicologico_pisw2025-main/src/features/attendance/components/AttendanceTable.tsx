import type { ReactNode } from "react";

export function AttendanceTable({ headers, rows }: {
  headers: string[];
  rows: { id: string; cells: ReactNode[] }[];
}) {
  if (!rows.length) return <p className="rounded-lg border p-4 text-sm text-muted-foreground">No hay datos para esta consulta.</p>;
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted">
          <tr>{headers.map((title) => <th key={title} scope="col" className="px-3 py-2">{title}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map(({ id, cells }) => (
            <tr key={id} className="border-t">
              {cells.map((cell, index) => <td key={headers[index]} className="px-3 py-2 align-top">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
