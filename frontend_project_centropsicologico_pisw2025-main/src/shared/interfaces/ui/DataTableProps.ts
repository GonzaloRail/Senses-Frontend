import type { ColumnDef } from "@tanstack/react-table";

export type DataTableProps<T> = {
  fetchData: (pagination: { pageIndex: number; pageSize: number }) => Promise<{
    data: T[];
    pageCount: number;
  }>;
  searchItem?: {
    fetchDataSearch: (pagination: {
      pageIndex: number;
      pageSize: number;
      search: string;
    }) => Promise<{
      data: T[];
      pageCount: number;
    }>;
    searchLabel: string;
    typeSearch?: string;
    lenghtMax?: number;
  };
  addItem?: {
    addItemLabel: string;
    onClickAddItem: () => void;
  };
  optionalExtraButton?: {
    optionalExtraButtonLabel: string;
    onClickOptionalExtraButton: () => void;
  };
  filter?: {
    filterLabel: string;
    filterLabelMobile: string;
    filterOptions: string[];
    filterColumn: string; // The accessorKey of the column to filter
  };
  dateFilter?: {
    dateFilterLabel: string;
    dateFilterLabelMobile: string;
    fetchDataOnDateChange: (pagination: {
      pageIndex: number;
      pageSize: number;
      date: Date | null;
    }) => Promise<{
      data: T[];
      pageCount: number;
    }>;
  };
  columns: ColumnDef<T, any>[];
  className?: string;
};
