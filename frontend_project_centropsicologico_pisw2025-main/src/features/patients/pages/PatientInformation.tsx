import { PatientForm } from "../components/PatientForm";
import { useParams } from "react-router";
import { Loading } from "@/shared/components/Loading";
import { usePatientByIdQuery } from "../hooks";

export const PatientInformation = () => {
  const { id } = useParams<{ id: string }>();
  // llamada a paciente
  // const { data: patient, isLoading } = useGetPatientQuery(id);
  const { data, isLoading } = usePatientByIdQuery({ id: id ?? "" });

  if (isLoading) {
    return <Loading message="Cargando información del paciente..." />;
  }

  return <PatientForm data={data} patientId={id} />;
};
