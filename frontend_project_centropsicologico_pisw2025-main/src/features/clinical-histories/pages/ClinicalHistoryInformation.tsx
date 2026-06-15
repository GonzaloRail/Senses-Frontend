import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { TextWithLabel } from "@/shared/components/TextWithLabel";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate, useParams } from "react-router";
import { useState } from "react";
import {
  useClinicalHistoryByIdQuery,
  useGetAllEvaluationsByClinicalHistoryIdSortedBySectionQuery,
} from "../hooks/useClinicalHistoriesQueries";
import {
  calculateAgeString,
  getBirthdateString,
  translateGender,
  translateMaritalStatus,
} from "@/shared/utils/formatters";
import { ClinicalHistorySections } from "../components/ClinicalHistorySections ";
import { Loading } from "@/shared/components/Loading";

export const ClinicalHistoryInformation = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const { data: clinicalHistory, isLoading: isLoadingClinicalHistory } =
    useClinicalHistoryByIdQuery(id ?? "");
  /*
    Cada clinicalHistory tiene un patient, que es el paciente como tal
    luego tiene varios patientTest. De aquí lo que se usa es su archivo Document vinculado
    el que hace referencia al test ya tomado y llenado por el psicólogo.
    El patientTest tiene dentro un Test, esta entidad hace referencia al nombre del test tomado.
    Pj. "Test1 de evaluación1" De este test principalmente te importa el nombre, lo podrías poner 
    como el texto del <a></a>. Este test contiene evaluation, de aquí te interesa el name también.
    pj "Evaluación 1"
    Con eso ya se tiene todo, se añadió un isGeneralDoc al patientTest para identificar si es un documento general
    con eso puedes filtrar con true o false. 
    Finalmente tener en cuenta que algunos datos son null, por ejemplo, si el usuario es mayor de edad generalmente
    número de familiares y eso no se pone, condicionar ello, y la edad se calcula aquí en base a su fecha de nacimiento que está
    en formato UTC. Se coloca así puesto que tenerlo en la BD en crudo no es lo óptimo al poder cumplir años y actualizarle eso
    es innecesario
    Psdt: Probar con el paciente "María Gómez", algunos no tienen patientTest, considerar ello también como posible excepción (mostrar un no hay test o algo así)
  */

  const [open, setOpen] = useState(false);

  const { patient } = clinicalHistory || {};

  const { data, isLoading: isLoadingAllEvaluations } =
    useGetAllEvaluationsByClinicalHistoryIdSortedBySectionQuery(id ?? "");

  if (isLoadingAllEvaluations || isLoadingClinicalHistory) {
    return (
      <Loading message="Cargando historia clínica..." />
    );
  }

  if (!clinicalHistory) {
    return (
      <>
        <h1>No se encontró la historia clínica</h1>
      </>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 flex flex-col">
        <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
          <SidebarTrigger className="-ml-1 cursor-pointer mt-4" />
        </div>
        <div className="flex flex-col w-full items-center px-4 ">
          <h1 className="scroll-m-20 text-center text-3xl font-extrabold tracking-tight text-balance text-senses-primary lg:text-4xl">
            {patient?.firstName} {patient?.lastName}
          </h1>
          <div className="flex flex-col mt-3 w-fit">
            <TextWithLabel
              label="DNI"
              text={patient?.dni || "DNI no especificado"}
            />
            <TextWithLabel
              label="Fecha de nacimiento"
              text={
                patient
                  ? getBirthdateString(new Date(patient.birthdate))
                  : "Fecha no especificada"
              }
            />
            <TextWithLabel
              label="Edad"
              text={
                patient
                  ? calculateAgeString(new Date(patient.birthdate))
                  : "Edad no especificada"
              }
            />
            <TextWithLabel
              label="Religión"
              text={
                patient?.religion ? patient.religion : "Religión no especificada"
              }
            />
            <TextWithLabel
              label="Teléfono"
              text={
                patient?.phoneNumber
                  ? patient.phoneNumber
                  : "Número no especificado"
              }
            />
            {patient?.parentFullName && (
              <TextWithLabel
                label="Padre o madre"
                text={patient.parentFullName}
              />
            )}
            {patient?.parentDni && (
              <TextWithLabel
                label="DNI del padre o madre"
                text={patient.parentDni}
              />
            )}
            {patient?.parentPhoneNumber && (
              <TextWithLabel
                label="Número de contacto"
                text={patient.parentPhoneNumber}
              />
            )}
          </div>
          <div className="flex mt-4 w-full justify-center">
            <ClinicalHistorySections
              clinicalHistory={clinicalHistory}
              sections={data}
              isLoading={isLoadingAllEvaluations || isLoadingClinicalHistory}
              key="pepito-y-pedrito"
            />
          </div>


        </div>
        {/* Barra de botones sticky dentro del contenedor */}
        <div className="flex flex-col gap-3 border-t w-full md:flex-row md:justify-end mt-auto">
          <div className="flex flex-col p-4 gap-3 w-full md:flex-row md:justify-end">
            <Button
              variant="destructive"
              onClick={() => {
                navigate(-1);
              }}
              className="flex items-center gap-2 cursor-pointer"
              type="button"
            >
              Volver
            </Button>
            <Button
              className="flex items-center gap-2 cursor-pointer"
              type="button"
              onClick={() => setOpen(true)}
            >
              Ver información completa
            </Button>
          </div>
        </div>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center">
              Información completa
            </DialogTitle>
            <div className="flex flex-col gap-0.5 w-full max-h-[50vh] overflow-y-auto">
              <div>
                <TextWithLabel
                  label="DNI"
                  text={patient?.dni ? patient.dni : "DNI no especificado"}
                />
                <TextWithLabel
                  label="Sexo"
                  text={
                    patient?.gender
                      ? translateGender(patient.gender)
                      : "Sexo no especificado"
                  }
                />
                <TextWithLabel
                  label="Fecha de nacimiento"
                  text={
                    patient
                      ? getBirthdateString(new Date(patient.birthdate))
                      : "Fecha no especificada"
                  }
                />
                <TextWithLabel
                  label="Edad"
                  text={
                    patient
                      ? calculateAgeString(new Date(patient.birthdate))
                      : "Edad no especificada"
                  }
                />
                <TextWithLabel
                  label="Grado de instrucción"
                  text={
                    patient?.educationLevel
                      ? patient.educationLevel
                      : "Grado no especificado"
                  }
                />
                <TextWithLabel
                  label="Lugar de nacimiento"
                  text={
                    patient?.birthPlace
                      ? patient.birthPlace
                      : "Lugar no especificado"
                  }
                />
                <TextWithLabel
                  label="Ocupación u oficio"
                  text={
                    patient?.occupation
                      ? patient.occupation
                      : "Ocupación no especificada"
                  }
                />
                <TextWithLabel
                  label="Estado civil"
                  text={
                    patient?.maritalStatus
                      ? translateMaritalStatus(patient.maritalStatus)
                      : "Estado civil no especificado"
                  }
                />
                <TextWithLabel
                  label="Religión"
                  text={
                    patient?.religion
                      ? patient.religion
                      : "Religión no especificada"
                  }
                />
                <TextWithLabel
                  label="Centro de estudios y/o trabajo"
                  text={
                    patient?.occupation
                      ? patient.occupationLocation
                      : "Centro no especificado"
                  }
                />
                <TextWithLabel
                  label="Dirección"
                  text={
                    patient?.address
                      ? patient.address
                      : "Dirección no especificada"
                  }
                />
                <TextWithLabel
                  label="Distrito"
                  text={
                    patient?.district
                      ? patient.district.name || ""
                      : "Distrito no especificado"
                  }
                />
                <TextWithLabel
                  label="Provincia"
                  text={
                    patient?.district?.province
                      ? patient.district.province.name || ""
                      : "Provincia no especificada"
                  }
                />
                <TextWithLabel
                  label="Región o departamento"
                  text={
                    patient?.district?.province?.region
                      ? patient.district.province.region.name || ""
                      : "Región no especificada"
                  }
                />
                <TextWithLabel
                  label="Teléfono"
                  text={
                    patient?.phoneNumber
                      ? patient.phoneNumber
                      : "Número no especificado"
                  }
                />
                {patient?.parentFullName && (
                  <TextWithLabel
                    label="Padre o madre"
                    text={patient.parentFullName}
                  />
                )}
                {patient?.parentDni && (
                  <TextWithLabel
                    label="DNI del padre o madre"
                    text={patient.parentDni}
                  />
                )}
                {patient?.parentPhoneNumber && (
                  <TextWithLabel
                    label="Número de contacto"
                    text={patient.parentPhoneNumber}
                  />
                )}
              </div>
            </div>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
};
