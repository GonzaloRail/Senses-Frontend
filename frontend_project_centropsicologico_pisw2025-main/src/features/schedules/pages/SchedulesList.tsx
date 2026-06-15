import { Button } from "@/components/ui/button"
import { useButtonGroup } from "@/hooks/useButtonGroup"
import { queryClient } from "@/lib/queryClient"
import { DataTable } from "@/shared/components/DataTable"
import { SiteHeader } from "@/shared/components/SiteHeader"
import type { OfficeScheduleListSchema } from "@/shared/interfaces/tables/OfficeScheduleListSchema"
import type { PsychologistScheduleListSchema } from "@/shared/interfaces/tables/PsychologistSheduleListSchema"
import type { ColumnDef } from "@tanstack/react-table"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { getAllOfficeApi, getAllPsychologistApi } from "../api/schedulesApi"
import type { OfficeScheduleListPaginatedResponse, PsychologistScheduleListPaginatedResponse } from "@/shared/interfaces/apiResponses/getAllScheduleListsPaginated"

type FetchFn<T = any> = ({ pageIndex, pageSize }: { pageIndex?: number; pageSize?: number }) => Promise<{ data: T[]; pageCount: number }>

export const SchedulesList = () => {
  const { buttons, registerButton, selectButton, isSelected } = useButtonGroup({
    defaultSelected: "psychologistBtn",
  })
  const navigate = useNavigate();

  useEffect(() => {
    registerButton({ id: "psychologistBtn", label: "Psicólogos", value: "psychologists", disabled: false })
    registerButton({ id: "officeBtn", label: "Consultorios", value: "offices", disabled: false })
  }, [])

  const psychologistSchedulesColumns: ColumnDef<PsychologistScheduleListSchema>[] = [
    {
      accessorKey: "name",
      header: "Psicólogo",
      cell: ({ row }) => <div className="">{row.original.name}</div>,
    },
    {
      accessorKey: "email",
      header: "Correo Electrónico",
      cell: ({ row }) => <div className="">{row.original.email}</div>,
    },
    {
      accessorKey: "adminButton",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button
            variant="outline"
            className="flex px-1.5 text-muted-foreground cursor-pointer"
            onClick={() => { navigate(`/schedules/psychologist/${row.id}`) }}
          >
            {row.original.adminButton}
          </Button>
        </div>
      ),
    },
  ];

  const officeSchedulesColumns: ColumnDef<OfficeScheduleListSchema>[] = [
    {
      accessorKey: "name",
      header: "Consultorio",
      cell: ({ row }) => <div className="">{row.original.name}</div>,
    },
    {
      accessorKey: "location",
      header: "Sede",
      cell: ({ row }) => <div className="">{row.original.location}</div>,
    },
    {
      accessorKey: "type",
      header: "Tipo",
      cell: ({ row }) => <div className="">{row.original.type}</div>,
    },
    {
      accessorKey: "adminButton",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button
            variant="outline"
            className="flex px-1.5 text-muted-foreground cursor-pointer"
            onClick={() => { navigate(`/schedules/office/${row.id}`) }}
          >
            {row.original.adminButton}
          </Button>
        </div>
      ),
    },
  ];

  const fetchDataPsychologist = async ({ pageIndex = 0, pageSize = 10 }) => {
    const page = pageIndex + 1;
    const take = pageSize;

    const response = await queryClient.fetchQuery<PsychologistScheduleListPaginatedResponse>({
      queryKey: ["schedulelistpsychologists", page, take],
      queryFn: () => getAllPsychologistApi({ page, take }),
    })

    const data = response.psychologists.filter((({isActive}) => isActive)).map(({ id, firstName, lastName, email }) =>( {
        id,
        name: `${firstName} ${lastName}`,
        email,
        adminButton: "Ver Horario",
    }))

    return {
      data,
      pageCount: response.totalPages,
    };
  }

  const fetchDataOffices = async ({ pageIndex = 0, pageSize = 10 }) => {
    const page = pageIndex + 1;
    const take = pageSize;

    const response = await queryClient.fetchQuery<OfficeScheduleListPaginatedResponse>({
      queryKey: ["schedulelistoffices", page, take],
      queryFn: () => getAllOfficeApi({ page, take }),
    })

    const data = response.offices.filter((({isActive}) => isActive)).map(({ id, name, type, location }) => ({
        id,
        name,
        type,
        location: location.name,
        adminButton: "Ver Horario",
    }))

    return {
      data,
      pageCount: response.totalPages,
    };
  }

  const fetchDataSearchPsychologist = async ({
    pageIndex = 0,
    pageSize = 10,
    search = "",
  }) => {
    const page = pageIndex + 1;
    const take = pageSize;

    const response = await queryClient.fetchQuery<PsychologistScheduleListPaginatedResponse>({
      queryKey: ["schedulelistpsychologists", page, take],
      queryFn: () => getAllPsychologistApi({ page, take, search }),
    })

    const data = response.psychologists.map(({ id, firstName, lastName, isActive, email }) => {
      if (!isActive) return;
      return {
        id,
        name: `${firstName} ${lastName}`,
        email,
        adminButton: "Ver Horario",
      }
    })

    return {
      data,
      pageCount: response.totalPages,
    };
  };

  const fetchDataSearchOffice = async ({
    pageIndex = 0,
    pageSize = 10,
    search = "",
  }) => {
    const page = pageIndex + 1;
    const take = pageSize;

    const response = await queryClient.fetchQuery<OfficeScheduleListPaginatedResponse>({
      queryKey: ["schedulelistoffices", page, take],
      queryFn: () => getAllOfficeApi({ page, take, search }),
    })

    console.log(response)

    const data = response.offices.map(({ id, name, type, isActive, location }) => {
      if (!isActive) return;
      return {
        id,
        name,
        type,
        location: location.name,
        adminButton: "Ver Horario",
      }
    })

    return {
      data,
      pageCount: response.totalPages,
    };
  };

  const [selectedSchedule, setSelectedSchedule] = useState<string>("psychologist")
  const [columns, setColumns] = useState<ColumnDef<any>[]>(psychologistSchedulesColumns)
  const [fetchData, setFetchData] = useState<FetchFn>(() => fetchDataPsychologist)
  const [fetchDataSearch, setFetchDataSearch] = useState<FetchFn>(() => fetchDataSearchPsychologist)

  return (
    <>
      <SiteHeader title="Horarios" />
      <div className="flex flex-1 flex-col">
        <div className="flex flex-row gap-2 mx-5 mt-5 mb-0">
          {buttons.map(btn => (
            <Button
              key={btn.id}
              disabled={btn.disabled}
              onClick={() => {
                selectButton(btn.id)
                if (btn.id === "psychologistBtn") {
                  setColumns(psychologistSchedulesColumns)
                  setFetchData(() => fetchDataPsychologist)
                  setFetchDataSearch(() => fetchDataSearchPsychologist)
                  setSelectedSchedule("psychologist")
                } else {
                  setColumns(officeSchedulesColumns)
                  setFetchData(() => fetchDataOffices)
                  setFetchDataSearch(() => fetchDataSearchOffice)
                  setSelectedSchedule("office")
                }
              }}
              className={`shadow-md ${isSelected(btn.id) ? "bg-senses-primary" : "bg-white text-senses-primary cursor-pointer hover:bg-senses-primary/20"}`}>
              {btn.label}
            </Button>
          ))}
        </div>
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <DataTable
              fetchData={fetchData}
              columns={columns}
              searchItem={{
                searchLabel: (selectedSchedule === "psychologist") ? "Buscar por DNI" : "Buscar por Nombre",
                fetchDataSearch: fetchDataSearch,
                typeSearch: (selectedSchedule === "psychologist") ? "number" : "text",
                lenghtMax: (selectedSchedule === "psychologist") ? 8 : 32,
              }}
            />
          </div>
        </div>
      </div>
    </>
  )
}
