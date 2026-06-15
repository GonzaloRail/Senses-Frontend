import { LocationForm } from "../components/LocationForm";
import { useParams } from "react-router";
import { useLocationByIdQuery } from "../hooks/useLocationsQueries";
import { Loading } from "@/shared/components/Loading";

export const LocationInformation = () => {
  const { id } = useParams<{ id: string }>();
  const { data: locationData, isLoading } = useLocationByIdQuery({ id });

  if (isLoading) {
    return (
      <Loading message="Cargando información de sede..."/>
    );
  }

  return <LocationForm data={locationData} locationId={id} />;
};
