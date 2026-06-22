import { SiteHeader } from "@/shared/components/SiteHeader";
import { DataTable } from "@/shared/components/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Outlet, useNavigate } from "react-router";
import { queryClient } from "@/lib/queryClient";
import type { AppointmentsListSchema } from "@/shared/interfaces/tables/AppointmentsListSchema";
import clsx from "clsx";
import type { AppointmentPaginatedResponse } from "@/shared/interfaces/apiResponses/getAllAppointmentsPaginated";
import { getAllAppointmentsPaginatedApi, getAppointmentsByDateApi } from "../api/appointmentsApi";
import type { AppointmentsListByDatePaginatedResponse } from "@/shared/interfaces/apiResponses/getAppointmentsByDatePaginatedResponse";
import { useState } from "react";
import { AppointmentScheduler } from "../components/AppointmentScheduler";

const statusName = {
  PENDING: "Pendiente",
  CANCELED: "Cancelado",
  DONE: "Realizado",
  IN_PROGRESS: "En progreso",
};

export const AppointmentsList = () => {
  const navigate = useNavigate();
  const [selectedView, setSelectedView] = useState<"table" | "schedule">("table");
  // const [patientsFilterOptions, setPatientsFilterOptions] = useState<string[]>([]);

  /* useEffect(() => {
    (async () => {
      try {
        const resp = await queryClient.fetchQuery({
          queryKey: ["patients-all"],
          queryFn: () => getAllPatientsApi({ page: 1, take: 1000 }),
        });
        const names = (resp.patients || []).map(
          (p: any) => `${p.firstName} ${p.lastName}`
        );
        setPatientsFilterOptions(Array.from(new Set(names)));
      } catch (err) {
        console.error("No se pudo cargar pacientes:", err);
        setPatientsFilterOptions([]);
      }
    })();
  }, []); */

  const columns: ColumnDef<AppointmentsListSchema>[] = [
    {
      accessorKey: "patientName",
      header: "Paciente",
      cell: ({ row }) => <div>{row.original.patientName}</div>,
    },
    {
      accessorKey: "date",
      header: "Fecha",
      cell: ({ row }) => {
        const startTime = new Date(row.original.startDateTime);
        return (
          <div>
            <Badge variant="outline" className="px-3 mr-1">
              {startTime.toLocaleDateString("es-ES")}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "startDateTime",
      header: "Hora",
      cell: ({ row }) => {
        const startTime = new Date(row.original.startDateTime);
        return (
          <div>
            <Badge variant="outline" className="px-5 mr-1">
              {startTime?.getHours().toString().padStart(2, "0")}:
              {startTime?.getMinutes().toString().padStart(2, "0")}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "psychologistName",
      header: "Psicólogo",
      cell: ({ row }) => <div>{row.original.psychologistName}</div>,
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => (
        <Badge
          variant="default"
          className={clsx(`flex gap-1 px-1.5 text-white [&_svg]:size-3`, {
            "bg-senses-success": row.original.status == "DONE",
            "bg-senses-danger": row.original.status == "CANCELED",
            "bg-senses-secondary": row.original.status == "PENDING",
          })}
        >
          {statusName[row.original.status]}
        </Badge>
      ),
    },

    {
      accessorKey: "adminButton",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button
            variant="outline"
            className="flex px-1.5 text-muted-foreground cursor-pointer"
            onClick={() => {
              navigate(`/appointment/${row.original.id}`);
            }}
          >
            {row.original.adminButton}
          </Button>
        </div>
      ),
    },
  ];

  const fetchData = async ({ pageIndex = 0, pageSize = 10 }) => {
    const page = pageIndex + 1;
    const take = pageSize;

    const dataResponse =
      await queryClient.fetchQuery<AppointmentPaginatedResponse>({
        queryKey: ["appointments", page, take],
        queryFn: () => getAllAppointmentsPaginatedApi({ page, take }),
      });

    const data = dataResponse.appointments.map((appointment) => ({
      ...appointment,
      startDateTime: new Date(appointment.startDateTime),
      date: new Date(appointment.startDateTime),
      adminButton: "Administrar",
    }));
    console.log(data);
    return {
      data,
      pageCount: dataResponse.totalPages,
    };
  };

  const fetchDataOnDateChange = async (pagination: { pageIndex: number, pageSize: number, date: Date | null }) => {
    const { date, pageIndex, pageSize } = pagination;
    const page = pageIndex + 1;
    const take = pageSize;

    if (!date) {
      return fetchData({ pageIndex, pageSize });
    }

    const localYear = date.getFullYear();
    const localMonth = date.getMonth();
    const localDay = date.getDate();

    const from = new Date(Date.UTC(localYear, localMonth, localDay + 1, 0 + 5, 0, 0, 0));
    const to = new Date(Date.UTC(localYear, localMonth, localDay + 2, 0 + 5, 0, 0, 0) - 1);

    const dataResponse = await queryClient.fetchQuery<AppointmentsListByDatePaginatedResponse>({
      queryKey: ["appointments", page, take, date],
      queryFn: () => getAppointmentsByDateApi({ page, take, from: from.toISOString(), to: to.toISOString() }),
    });

    const data = dataResponse.appointments.map((appointment) => ({
      id: appointment.id,
      patientName: appointment.patientName,
      psychologistName: appointment.psychologistName,
      startDateTime: new Date(appointment.startDate),
      date: new Date(appointment.startDate),
      status: appointment.status,
      adminButton: "Administrar",
    }));

    return {
      data,
      pageCount: dataResponse.totalPages,
    }
  }

  const fetchDataSearch = async ({
    pageIndex = 0,
    pageSize = 10,
    search = "",
  }) => {
    const page = pageIndex + 1;
    const take = pageSize;

    const dataResponse = await queryClient.fetchQuery<AppointmentPaginatedResponse>({
      queryKey: ["users", page, take],
      queryFn: () => getAllAppointmentsPaginatedApi({ page, take, search }),
    });

    console.log("dr:", dataResponse)

    const data = dataResponse.appointments.map((appointment) => ({
      ...appointment,
      startDateTime: new Date(appointment.startDateTime),
      date: new Date(appointment.startDateTime),
      adminButton: "Administrar",
    }));

    return {
      data: data,
      pageCount: dataResponse.totalPages,
    };
  };

  return (
    <>
      <SiteHeader title="Citas" />
      <div className="flex flex-1 flex-col">
        <div className="flex flex-row gap-2 mx-5 mt-5 mb-0">
          <Button
            className={`shadow-md ${
              selectedView === "table"
                ? "bg-senses-primary text-white hover:bg-senses-primary/90"
                : "bg-white text-senses-primary cursor-pointer hover:bg-senses-primary/20"
            }`}
            onClick={() => setSelectedView("table")}
            type="button"
          >
            Tabla
          </Button>
          <Button
            className={`shadow-md ${
              selectedView === "schedule"
                ? "bg-senses-primary text-white hover:bg-senses-primary/90"
                : "bg-white text-senses-primary cursor-pointer hover:bg-senses-primary/20"
            }`}
            onClick={() => setSelectedView("schedule")}
            type="button"
          >
            Horario
          </Button>
        </div>
        <div className="@container/main flex flex-1 flex-col gap-2">
          {selectedView === "table" ? (
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <DataTable
                fetchData={fetchData}
                searchItem={{
                  searchLabel: "Buscar por DNI",
                  fetchDataSearch: fetchDataSearch,
                }}
                addItem={{
                  addItemLabel: "Crear cita",
                  onClickAddItem: () => {
                    navigate("/create-appointment");
                  },
                }}
                /* filter={{
                  filterLabel: "Filtrar por paciente",
                  filterLabelMobile: "Paciente",
                  filterOptions: patientsFilterOptions,
                  filterColumn: "patientName",
                }} */
                dateFilter={{
                  dateFilterLabel: "Fecha",
                  dateFilterLabelMobile: "Fecha",
                  fetchDataOnDateChange: fetchDataOnDateChange
                }}
                columns={columns}
              />
            </div>
          ) : (
            <AppointmentScheduler />
          )}
        </div>
      </div>
      <Outlet />
    </>
  );
};
