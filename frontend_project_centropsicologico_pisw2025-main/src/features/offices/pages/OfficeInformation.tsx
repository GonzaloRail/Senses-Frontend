import { useParams } from "react-router";
import { OfficeForm } from "../components/OfficeForm";
import { useOfficeByIdQuery } from "../hooks/useOfficesQueries";
import { Loading } from "@/shared/components/Loading";

export const OfficeInformation = () => {
  const { id } = useParams<{ id: string }>();
  const { data: officeData, isLoading } = useOfficeByIdQuery({ id });

  if (isLoading) {
    return <Loading message="Cargando información de consultorio..." />;
  }

  return <OfficeForm data={officeData} officeId={id} />;
};
