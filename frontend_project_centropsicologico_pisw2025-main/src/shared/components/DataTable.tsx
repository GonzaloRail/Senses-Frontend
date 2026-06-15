import React, { useState } from "react";

import {
  type ColumnFiltersState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ColumnsIcon,
  LucideMousePointerClick,
  PlusIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import type { DataTableProps } from "../interfaces/ui/DataTableProps";
import { Loading } from "./Loading";

type RowWithId = {
  id: string | number;
};

export const DataTable = <T extends RowWithId>({
  fetchData,
  addItem,
  filter,
  searchItem,
  columns,
  dateFilter,
  className = "",
  optionalExtraButton,
}: DataTableProps<T>) => {
  const [data, setData] = React.useState<T[]>([]);
  const [pageCount, setPageCount] = React.useState(0);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const runSearch = () => {
    if (!searchItem?.fetchDataSearch) return;

    searchItem.fetchDataSearch({ ...pagination, search: search.trim() }).then((res) => {
      setData(res.data);
      setPageCount(res.pageCount);
    });
  };

  const getLocalDate = (date: Date) => {
    const tzoffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzoffset);
  };
  const [dateSearch, setDateSearch] = useState<Date | null>(
    getLocalDate(new Date())
  );

  React.useEffect(() => {
    setIsLoading(true);
    fetchData(pagination).then((res) => {
      setData(res.data);
      setPageCount(res.pageCount);
      setIsLoading(false);
    });
  }, [pagination, fetchData]);

  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      pagination,
      columnVisibility,
      columnFilters,
    },
    manualPagination: true,
    pageCount,
    getRowId: (row) => row.id.toString(),
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    filterFns: {
      arrayIncludesAll: (row, columnId, filterValue) => {
        const rowValue = row.getValue(columnId);

        // compatible con arreglos y valores simples
        if (Array.isArray(rowValue)) {
          return filterValue.every((val: string) => rowValue.includes(val));
        }

        return filterValue.includes(rowValue);
        /*         const rowRoles = row.getValue(columnId) as string[];
                return filterValue.every((val: string) => rowRoles.includes(val)); */
      },
    },
  });

  if (isLoading) {
    return <Loading message="Cargando información..." />;
  }

  return (
    <div
      defaultValue="outline"
      className={`flex w-full flex-col justify-start gap-3 ${className}`}
    >
      <div className="flex flex-col lg:flex-row justify-between gap-2 px-4 lg:px-6">
        <div className="flex lg:flex-col gap-2">
          <div>
            {addItem && (
              <Button
                variant="outline"
                size="sm"
                onClick={addItem.onClickAddItem}
                className="cursor-pointer bg-senses-primary text-white hover:bg-senses-primary hover:text-white"
              >
                <PlusIcon />
                <span className="hidden lg:inline">{addItem.addItemLabel}</span>
              </Button>
            )}
            {optionalExtraButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={optionalExtraButton.onClickOptionalExtraButton}
                className="cursor-pointer bg-senses-primary text-white hover:bg-senses-primary hover:text-white ml-4"
              >
                <LucideMousePointerClick />
                <span className="hidden lg:inline">
                  {optionalExtraButton.optionalExtraButtonLabel}
                </span>
              </Button>
            )}
          </div>
          {filter && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="cursor-pointer">
                <Button variant="outline" size="sm" className="w-auto">
                  <ColumnsIcon />
                  <span className="hidden lg:inline">{filter.filterLabel}</span>
                  <span className="lg:hidden">{filter.filterLabelMobile}</span>
                  <ChevronDownIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-auto">
                {filter.filterOptions.map((role) => {
                  const column = table.getColumn(filter.filterColumn);
                  const selectedRoles = column?.getFilterValue() as
                    | string[]
                    | undefined;
                  const isChecked = selectedRoles?.includes(role as string);
                  return (
                    <DropdownMenuCheckboxItem
                      key={role as string}
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        if (!column) return;
                        let newValues = selectedRoles ?? [];

                        if (checked) {
                          newValues = [...newValues, role as string];
                        } else {
                          newValues = newValues.filter((r) => r !== role);
                        }

                        column.setFilterValue(
                          newValues.length ? newValues : undefined
                        );
                      }}
                      className="capitalize"
                    >
                      {role as string}
                    </DropdownMenuCheckboxItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {dateFilter && (
            <div className="flex max-w-sm items-center space-x-2">
              <Input
                type="date"
                className="max-w-xs"
                value={dateSearch ? dateSearch.toISOString().split("T")[0] : ""}
                onChange={(e) => {
                  const newDate = e.target.valueAsDate;
                  setDateSearch(newDate);
                }}
              />
              <Button
                type="button"
                className="hover:cursor-pointer"
                onClick={() => {
                  dateFilter
                    .fetchDataOnDateChange({ ...pagination, date: dateSearch })
                    .then((res) => {
                      setData(res.data);
                      setPageCount(res.pageCount);
                    });
                }}
              >
                Buscar
              </Button>
              <Button
                type="button"
                onClick={() => {
                  fetchData({ ...pagination }).then((res) => {
                    setData(res.data);
                    setPageCount(res.pageCount);
                  });
                }}
                className="bg-white text-senses-primary hover:cursor-pointer hover:bg-gray-100 border border-senses-primary"
              >
                Resetear
              </Button>
            </div>
          )}
        </div>
        {searchItem && (
          <div className="flex w-full max-w-sm items-center space-x-2">
            <Input
              type={searchItem.typeSearch ? searchItem.typeSearch : "number"}
              maxLength={searchItem.lenghtMax ? searchItem.lenghtMax : 8}
              value={search}
              onChange={({ target }) => {
                if (search.length >= 8 && searchItem.lenghtMax === 8) {
                  setSearch(target.value.slice(0, 8));
                  return;
                }
                setSearch(target.value);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  runSearch();
                }
              }}
              placeholder={searchItem.searchLabel}
            />
            <Button
              type="submit"
              onClick={runSearch}
            >
              Buscar
            </Button>
          </div>
        )}
      </div>
      <div className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-senses-primary ">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="hover:bg-senses-primary"
                >
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        colSpan={header.colSpan}
                        className="text-white"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No hay resultados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="flex w-full items-center lg:justify-end gap-8">
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Página {table.getState().pagination.pageIndex + 1} de{" "}
              {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Ir a la primera página</span>
                <ChevronsLeftIcon />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Ir a la página anterior</span>
                <ChevronLeftIcon />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Ir a la siguiente página</span>
                <ChevronRightIcon />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Ir a la última página</span>
                <ChevronsRightIcon />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
