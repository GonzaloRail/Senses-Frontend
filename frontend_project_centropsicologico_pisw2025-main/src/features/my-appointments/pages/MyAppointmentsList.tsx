import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";
import { DataTable } from "@/shared/components/DataTable"
import { SiteHeader } from "@/shared/components/SiteHeader"
import type { MyAppointmentsListPaginatedResponse } from "@/shared/interfaces/apiResponses/getAllMyAppointmentsPaginatedResponse";
import type { MyAppointmentsListSchema } from "@/shared/interfaces/tables/MyAppointmentsListSchema";
import type { ColumnDef } from "@tanstack/react-table";
import clsx from "clsx";
import { useNavigate } from "react-router";
import { getMyAppointmentsListApi, updateAppointmentStatusApi } from "../api/myAppointmentsApi";
import { useAuth } from "@/store/auth/auth.store";
import type { AppointmentStatus } from "@/shared/interfaces/models";

const statusName = {
  "PENDING": "Pendiente",
  "IN_PROGRESS": "Abierta",
};

export const MyAppointmentsList = () => {

  const navigate = useNavigate();
  const getStatusName = (status: string) => {
    return statusName[status as keyof typeof statusName] || status;
  }
  const { user } = useAuth();

  const columns: ColumnDef<MyAppointmentsListSchema>[] = [
    {
      accessorKey: "patient",
      header: "Paciente",
      cell: ({ row }) => <div>{row.original.patient}</div>,
    },
    {
      accessorKey: "startDateTime",
      header: "Hora",
      cell: ({ row }) => {
        const startTime = new Date(row.original.startDateTime);
        return (
          <div>
            <Badge variant="outline" className="px-5 mr-1">
              {startTime.toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}
            </Badge>
          </div>
        );
      },
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
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => (
        <Badge
          variant="default"
          className={clsx(`flex gap-1 px-1.5 text-white [&_svg]:size-3`, {
            "bg-senses-success": row.original.status == "IN_PROGRESS",
            "bg-senses-secondary": row.original.status == "PENDING",
          })}
        >
          {getStatusName(row.original.status)}
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
            onClick={async () => {
              if (row.original.status === "PENDING") {
                await updateAppointmentStatusApi(row.original.id, { status: "IN_PROGRESS" });
              }
              navigate(`/my-appointments/${row.original.id}`);
            }}
          >
            {row.original.adminButton}
          </Button>
        </div>
      ),
    },
  ];

  const fetchData = async ({ pageIndex = 0, pageSize = 10 }): Promise<{
    data: {
      id: string,
      patient: string,
      startDateTime: Date,
      date: Date,
      status: AppointmentStatus,
      adminButton: string
    }[],
    pageCount: number
  }> => {
    const page = pageIndex + 1;
    const take = pageSize;

    const dataResponse = await queryClient.fetchQuery<MyAppointmentsListPaginatedResponse>({
      queryKey: ["myappointments", page, take],
      queryFn: () => getMyAppointmentsListApi({ page, take, id: user?.id || "" }),
    });

    const data = dataResponse.appointments.map((appointment) => ({
      id: appointment.id,
      patient: appointment.patientName,
      startDateTime: new Date(appointment.startDate),
      date: new Date(appointment.startDate),
      status: appointment.status,
      adminButton: appointment.status === "PENDING" ? "Iniciar cita" : "Continuar cita",
    }));

    return {
      data,
      pageCount: dataResponse.totalPages,
    }
  }

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

    const dataResponse = await queryClient.fetchQuery<MyAppointmentsListPaginatedResponse>({
      queryKey: ["myappointmentsfiltered", page, take, date],
      queryFn: () => getMyAppointmentsListApi({ page, take, id: user?.id || "", from: from.toISOString(), to: to.toISOString() }),
    });


    const data = dataResponse.appointments.map((appointment) => ({
      id: appointment.id,
      patient: appointment.patientName,
      startDateTime: new Date(appointment.startDate),
      date: new Date(appointment.startDate),
      status: appointment.status,
      adminButton: appointment.status === "PENDING" ? "Iniciar cita" : "Continuar cita",
    }));

    return {
      data,
      pageCount: dataResponse.totalPages,
    }
  }

  return (
    <>
      <SiteHeader title="Mis Citas" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <DataTable
              fetchData={fetchData}
              columns={columns}
              dateFilter={{
                dateFilterLabel: "Fecha",
                dateFilterLabelMobile: "Fecha",
                fetchDataOnDateChange: fetchDataOnDateChange
              }}
            />
          </div>
        </div>
      </div>
    </>
  )
}
