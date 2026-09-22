// export interface UserLoginResponse {
//   user: User;
//   token: string;
// }

export interface UserResponse {
  id: string;
  name: string;
  lastName: string;
  dni: string;
  email: string;
  csp?: string;
  psychologistId?: string;
  createdAt: Date;
  updatedAt: Date;
  roles: RoleElement[];
  documents: Document[];
}
interface Document {
  id: string;
  name: string;
  type: string;
  fileUrl: string;
  userId: string;
  clinicalHistoryId?: string;
  employeeLeaveId?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface RoleElement {
  role: RoleRole;
}

type RoleType = "ADMISSION" | "PSYCHOLOGIST" | "ADMIN" | "INTERNAL";
interface RoleRole {
  id: string;
  name: RoleType;
}