import { Routes, Route, Navigate } from "react-router";
import { AuthLayout } from "@/app/layouts/AuthLayout";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { ModulesLayout } from "@/app/layouts/ModulesLayout";
import { SystemUsersList } from "@/features/systemUsers/pages/SystemUsersList";
import { SystemUserInformation } from "@/features/systemUsers/pages/SystemUserInformation";
import { SelectRolePage } from "@/features/auth/pages/SelectRolePage";
import { useAuth } from "@/store/auth/auth.store";
import { useBootstrapAuth } from "@/features/auth/hooks/";
import { useSpinner } from "@/shared/hooks/useSpinner";
import { LocationsList } from "@/features/locations/pages/LocationsList";
// import { LocationForm } from "@/features/locations/components/LocationForm";
import { LocationInformation } from "@/features/locations/pages/LocationInformation";
import { CreateLocation } from "@/features/locations/pages/CreateLocation";
import { ClinicalHistoriesList } from "@/features/clinical-histories/pages/ClinicalHistoriesList";
import { ProtectedRoute } from "@/shared/components/ProtectedRoute";
import { AccessDenied } from "@/shared/components/AccessDenied";
import { NotFound } from "@/shared/components/NotFound";
import { ClinicalHistoryInformation } from "@/features/clinical-histories/pages/ClinicalHistoryInformation";
import { PatientInformation } from "@/features/patients/pages/PatientInformation";
import { CreatePatient } from "@/features/patients/pages/CreatePatient";
import { PatientsList } from "@/features/patients/pages/PatientsList";
import { MyPatientsList } from "@/features/my-patients/pages/MyPatientsList";
import { Dashboard } from "@/features/dashboard/pages/Dashboard";
import { SchedulesList } from "@/features/schedules/pages/SchedulesList";
import { PsychologistSchedule } from "@/features/schedules/pages/PsychologistSchedule";
import { OfficeSchedule } from "@/features/schedules/pages/OfficeSchedule";
import { ItemsList } from "@/features/inventory/pages/ItemsList";
import { CreateItem } from "@/features/inventory/pages/CreateItem";
import { ItemInformation } from "@/features/inventory/pages/ItemInformation";
import { AppointmentsList } from "@/features/appointments/pages/AppointmentsList";
import { CreateAppointment } from "@/features/appointments/pages/CreateAppointment";
import { ViewAppointment } from "@/features/appointments/pages/ViewAppointment";
import { OfficesList } from "@/features/offices/pages/OfficesList";
import { OfficeInformation } from "@/features/offices/pages/OfficeInformation";
import { CreateOffice } from "@/features/offices/pages/CreateOffice";
import { EvaluationsList } from "@/features/evaluations/pages/EvaluationsList";
import { ViewEvaluation } from "@/features/evaluations/pages/ViewEvaluation";
import { CreateEvaluation } from "@/features/evaluations/pages/CreateEvaluation";
import { EditEvaluation } from "@/features/evaluations/pages/EditEvaluation";
import { EditAppointment } from "@/features/appointments/pages/EditAppointment";
import { EmployeeLeavesList } from "@/features/employeeLeaves/pages/EmployeeLeavesList";
import { CreateEmployeeLeave } from "@/features/employeeLeaves/pages/CreateEmployeeLeave";
import { ViewEmployeeLeave } from "@/features/employeeLeaves/pages/ViewEmployeeLeave";
import { EditEmployeeLeave } from "@/features/employeeLeaves/pages/EditEmployeeLeave";

import { ActivateAccount } from "@/features/auth/pages/ActivateAccount";
import { RequestPasswordReset } from "@/features/auth/pages/RequestPasswordReset";
import { ResetPassword } from "@/features/auth/pages/ResetPassword";

import { MySchedule } from "@/features/schedules/pages/MySchedule";
import { MyAppointmentsList } from "@/features/my-appointments/pages/MyAppointmentsList";
import { MyAppointmentInformation } from "@/features/my-appointments/pages/MyAppointmentInformation";

// import { CreateLocation } from "@/features/locations/pages/CreateLocation";

export const AppRouter = () => {
  const accessToken = useAuth((state) => state.accessToken);
  const roleNameSelected = useAuth((state) => state.roleSelected);
  const isAuthBootstrapped = useAuth((state) => state.isAuthBootstrapped);
  const user = useAuth((state) => state.user);
  console.log("userZustand", user);
  const { Spinner } = useSpinner({ initialLoading: true });
  useBootstrapAuth();
  if (!isAuthBootstrapped) {
    return <Spinner />;
  }

  //console.log("accessTokenZustand", accessToken);
  //console.log("roleSelectedZustand", roleNameSelected);

  return (
    <Routes>
      <Route path="/auth" element={<AuthLayout />}>
        {/* <AuthRouter /> */}
        <Route
          index
          element={
            accessToken && !roleNameSelected ? (
              <Navigate to="/auth/select" replace />
            ) : accessToken && roleNameSelected ? (
              <Navigate to="/" replace />
            ) : (
              <LoginPage />
            )
          }
        />
        <Route path="select" element={<SelectRolePage />} />
        <Route path="activate-account" element={<ActivateAccount />} />
        <Route
          path="request-password-reset"
          element={<RequestPasswordReset />}
        />
        <Route path="reset-password" element={<ResetPassword />} />
      </Route>

      <Route path="/access-denied" element={<AccessDenied />} />

      {accessToken ? (
        !roleNameSelected ? (
          <Route path="*" element={<Navigate to="/auth/select" replace />} />
        ) : (
          <Route path="/" element={<ModulesLayout />}>
            {" "}
            //sidebar
            <>
              {/* Redirección por defecto según el rol */}
              <Route
                index
                element={
                  roleNameSelected === "ADMIN" ? (
                    <Navigate to="/dashboard" replace />
                  ) : roleNameSelected === "ADMISSION" ? (
                    <Navigate to="/patients" replace />
                  ) : roleNameSelected === "PSYCHOLOGIST" ||
                    roleNameSelected === "INTERNAL" ? (
                    <Navigate to="/my-patients" replace />
                  ) : (
                    <Navigate to="/not-found" replace />
                  )
                }
              />

              {/* Rutas solo para gerente */}
              <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
                <Route path="dashboard/" element={<Dashboard />} />
                <Route path="system-users/" element={<SystemUsersList />} />
                <Route
                  path="user-information/:id"
                  element={<SystemUserInformation />}
                />
                <Route path="create-user" element={<SystemUserInformation />} />

                <Route
                  path="clinical-histories/"
                  element={<ClinicalHistoriesList />}
                />
                <Route
                  path="clinical-histories/:id"
                  element={<ClinicalHistoryInformation />}
                />
                {/* <Route path="clinical-history/create" element={<CreateClinicalHistory />} /> */}

                <Route path="evaluations/" element={<EvaluationsList />} />
                <Route path="evaluations/:id" element={<ViewEvaluation />} />
                <Route
                  path="evaluations/create"
                  element={<CreateEvaluation />}
                />
                <Route
                  path="evaluations/:id/edit"
                  element={<EditEvaluation />}
                />

                <Route path="offices/" element={<OfficesList />} />
                <Route path="offices/:id" element={<OfficeInformation />} />
                <Route path="offices/create" element={<CreateOffice />} />

                <Route path="locations/" element={<LocationsList />} />
                <Route path="location/:id" element={<LocationInformation />} />
                <Route path="locations/create" element={<CreateLocation />} />

                <Route path="inventory/" element={<ItemsList />} />
                <Route path="inventory/:id" element={<ItemInformation />} />
                <Route path="inventory/create" element={<CreateItem />} />
              </Route>

              {/* Rutas solo para admisión */}
              <Route element={<ProtectedRoute allowedRoles={["ADMISSION"]} />}>
                <Route path="patients/" element={<PatientsList />} />
                <Route path="patients/create" element={<CreatePatient />} />
                <Route path="patient/:id" element={<PatientInformation />} />
                <Route path="appointments/" element={<AppointmentsList />} />
                <Route path="appointment/:id" element={<ViewAppointment />} />
                <Route
                  path="appointment/:id/edit"
                  element={<EditAppointment />}
                />
                <Route
                  path="create-appointment"
                  element={<CreateAppointment />}
                />
                <Route
                  path="employee-leaves/"
                  element={<EmployeeLeavesList />}
                />
                <Route
                  path="employee-leave/:id"
                  element={<ViewEmployeeLeave />}
                />
                <Route
                  path="employee-leave/:id/edit"
                  element={<EditEmployeeLeave />}
                />
                <Route
                  path="create-employee-leave"
                  element={<CreateEmployeeLeave />}
                />
              </Route>

              {/* Rutas para admision y admin */}
              <Route
                element={
                  <ProtectedRoute allowedRoles={["ADMIN", "ADMISSION"]} />
                }
              >
                <Route
                  path="schedules/psychologist/:id"
                  element={<PsychologistSchedule />}
                />
                <Route path="schedules/" element={<SchedulesList />} />
                <Route
                  path="schedules/office/:id"
                  element={<OfficeSchedule />}
                />
              </Route>

              {/* Para cualquier otro rol autenticado, mostrar NotFound */}
              <Route
                element={
                  <ProtectedRoute allowedRoles={["PSYCHOLOGIST", "INTERNAL"]} />
                }
              >
                <Route
                  path="clinical-history/:id"
                  element={<ClinicalHistoryInformation />}
                />
                <Route path="my-patients/" element={<MyPatientsList />} />
                <Route path="my-schedule/" element={<MySchedule />} />
                <Route
                  path="my-appointments/"
                  element={<MyAppointmentsList />}
                />
                <Route
                  path="my-appointments/:id"
                  element={<MyAppointmentInformation />}
                />

                <Route path="/other-roles" element={<NotFound />} />
              </Route>
            </>
          </Route>
        )
      ) : (
        <Route path="*" element={<Navigate to="/auth" replace />} />
      )}

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
