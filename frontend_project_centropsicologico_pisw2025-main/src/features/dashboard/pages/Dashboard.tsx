import { SidebarTrigger } from "@/components/ui/sidebar"
import { StatCard } from "../components/StatCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, LabelList, Line, LineChart, Pie, PieChart, XAxis } from "recharts";
import type { ColumnDef } from "@tanstack/react-table";
import type { DashboardPsychologystListSchema } from "@/shared/interfaces/tables/DashboardPsychologystListSchema";
import { DataTable } from "@/shared/components/DataTable";
import { useEffect, useState } from "react";
import { getActiveInternals, getAppointmentsByWeekday, getPatientsPerAgeGroups, getPsychologistsWithPatients, getSocialCasesPerMonth, getTotalHoursPerMonth, getTotalParticularCases, getTotalPatients, getTotalPsychologists, getTotalSocialCases } from "../api/dashboardApi";
import { Loading } from "@/shared/components/Loading";

export const Dashboard = () => {
  const [psychologistNumber, setPsychologistNumber] = useState(0);
  const [patientsNumber, setPatientsNumber] = useState(0);
  const [totalMonthlyHours, setTotalMonthlyHours] = useState(0);
  const [monthlySocialCases, setMonthlySocialCases] = useState(0);
  const [activeInterns, setActiveInterns] = useState(0);
  const [totalSocialCases, setTotalSocialCases] = useState(0);
  const [totalParticularCases, setTotalParticularCases] = useState(0);
  const [patientsAgeGroups, setPatientsAgeGroups] = useState([]);
  const [psychologistWithPatients, setPsychologistWithPatients] = useState([]);
  const [appointmentsCountByRange, setAppointmentsCountByRange] = useState([]);


  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          psychologistData,
          patientsData,
          hoursData,
          casesData,
          internsData,
          totalSocialCasesData,
          totalParticularCasesData,
          patientsAgeGroupsData,
          psychologistsWithPatientsData,
          appointmentsByWeekdayData,
        ] = await Promise.all([
          getTotalPsychologists(),
          getTotalPatients(),
          getTotalHoursPerMonth(),
          getSocialCasesPerMonth(),
          getActiveInternals(),
          getTotalSocialCases(),
          getTotalParticularCases(),
          getPatientsPerAgeGroups(),
          getPsychologistsWithPatients(),
          getAppointmentsByWeekday(),
        ]);

        setPsychologistNumber(psychologistData.count);
        setPatientsNumber(patientsData.count);
        setTotalMonthlyHours(hoursData.hours);
        setMonthlySocialCases(casesData.count);
        setActiveInterns(internsData.count);
        setTotalSocialCases(totalSocialCasesData.count);
        setTotalParticularCases(totalParticularCasesData.count);
        setPatientsAgeGroups(patientsAgeGroupsData);
        setPsychologistWithPatients(psychologistsWithPatientsData);
        setAppointmentsCountByRange(appointmentsByWeekdayData);

      } catch (error) {
        console.error("Error al obtener datos del Dashboard:", error);
      } finally {
        setIsLoading(false);
        console.log("grupos", patientsAgeGroups)
      }
    };

    fetchData();
  }, []);

  const lineChartData = appointmentsCountByRange;

  const lineChartConfig = {
    appointments: {
      label: "Citas",
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig

  const columns: ColumnDef<DashboardPsychologystListSchema>[] = [
    {
      accessorKey: "name",
      header: "Psicólogo",
      cell: ({ row }) => <div>{row.original.name}</div>,
    },
    {
      accessorKey: "patientNumber",
      header: "Pacientes por mes",
      cell: ({ row }) => (
        <div>
          {row.original.patientNumber}
        </div>
      ),
    },
  ]

  const fetchData = async ({ pageIndex = 0, pageSize = 10 }) => {
    const page = pageIndex + 1;
    const take = pageSize;
    console.log(page, take);
    const data = psychologistWithPatients;
    return {
      data: data,
      pageCount: 1,
    };
  }

  const pieChartData = [
    { type: "socialCases", appointments: totalSocialCases, fill: "var(--color-senses-secondary)" },
    { type: "particularCases", appointments: totalParticularCases, fill: "var(--color-senses-primary)" },
  ]

  const pieChartConfig = {
    socialCases: {
      label: "Casos sociales",
    },
    particularCases: {
      label: "Casos particulares",
    },
  } satisfies ChartConfig

  const barChartData = patientsAgeGroups;
  console.log(barChartData)

  const barChartConfig = {
    value: {
      label: "Pacientes",
      color: "var(--color-senses-secondary)",
    },
  } satisfies ChartConfig

  if (isLoading) {
    return (
      <Loading message="Cargando..." />
    );
  }

  return (
    <>
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1 cursor-pointer mt-4" />
      </div>
      <div className="flex flex-row flex-wrap gap-1 p-4 justify-center">
        <StatCard title="Número de psicólogos" value={psychologistNumber} />
        <StatCard title="Número de pacientes" value={patientsNumber} />
        <StatCard title="Número de horas de trabajo al mes" value={totalMonthlyHours} />
        <StatCard title="Casos sociales realizados este mes" value={monthlySocialCases} />
        <StatCard title="Internos activos" value={activeInterns} />
      </div>
      <div className="flex flex-col p-3 lg:grid lg:grid-cols-10 justify-center items-center">
        <Card className="p-3 lg:col-span-5 h-fit w-full">
          <div className="flex flex-row gap-1">
            <h3 className="text-3xl font-semibold text-senses-primary mr-3">Citas</h3>
            <Button className="bg-senses-primary cursor-pointer">Semana</Button>
{/*             <Button className="bg-senses-primary cursor-pointer" disabled>Mes</Button>
            <Button className="bg-senses-primary cursor-pointer" disabled>Año</Button> */}
          </div>
          <CardContent>
            <ChartContainer config={lineChartConfig}>
              <LineChart
                accessibilityLayer
                data={lineChartData}
                margin={{
                  left: 12,
                  right: 12,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Line
                  dataKey="appointments"
                  type="linear"
                  stroke="var(--color-senses-primary)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <DataTable fetchData={fetchData}
          columns={columns}
          className="lg:col-span-5"
        />
      </div>

      <div className="flex flex-col p-3 gap-3 lg:flex-row lg:gap-3 items-center justify-evenly w-full">
        <Card className="p-3 flex flex-col items-center w-full lg:w-2/5">
          <h3 className="text-2xl text-center font-semibold text-senses-primary">Casos sociales vs casos particulares</h3>
          <ChartContainer
            config={pieChartConfig}
            className="mx-auto aspect-square max-h-[250px]"
            style={{ width: "100%" }}
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={pieChartData}
                dataKey="appointments"
                nameKey="type"
                innerRadius={60}
              />
            </PieChart>
          </ChartContainer>
        </Card>

        
        <Card className="p-3 flex flex-col items-center w-full lg:w-5/10">
          <h3 className="text-2xl text-center font-semibold text-senses-primary">Grupos de edad de pacientes</h3>
          <ChartContainer config={barChartConfig} style={{ width: "100%" }}>
            <BarChart
              accessibilityLayer
              data={barChartData}
              margin={{
                top: 20,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="range"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar dataKey="value" fill="var(--color-senses-secondary)" radius={8}>
                <LabelList
                  position="top"
                  offset={12}
                  className="fill-foreground"
                  fontSize={12}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        </Card>
      </div>
    </>
  )
}
