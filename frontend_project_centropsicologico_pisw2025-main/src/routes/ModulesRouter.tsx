import { Route, Routes } from "react-router"

export const ModulesRouter = () => {
  return (
    <Routes>
      {/* manager modules */}
      <Route path="dashboard" element={<div>dashboard</div>} />
      <Route path="system-users-management" element={<div>gestión de usuarios</div>} />
      <Route path="medical-records" element={<div>historias clínicas</div>} />
      <Route path="office-management" element={<div>gestión de consultorios</div>} />
      <Route path="schedules" element={<div>horarios</div>} />
      <Route path="location-management" element={<div>gestión de sedes</div>} />
      <Route path="assessment-management" element={<div>gestión de evaluaciones</div>} />
      <Route path="inventory-management" element={<div>gestión de evaluaciones</div>} />
    </Routes>
  )
}
