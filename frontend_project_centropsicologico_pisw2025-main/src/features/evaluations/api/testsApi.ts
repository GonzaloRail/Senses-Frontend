import api from "@/api/api";
import type { CreateTestPayload } from "@/shared/interfaces/models";

export const createTestApi = async ({
  testToCreate,
}: {
  testToCreate: CreateTestPayload;
}) => {
  const response = await api.post(`/api/v1/tests`, {
    ...testToCreate,
  });

  return response.data;
};

export const updateTestStatusApi = async ({ id, isActive }: { id: string, isActive: boolean }) => {
  const response = await api.put(`/api/v1/tests/${id}`, {
    isActive
  });
  return response.data;
}

export const createTestsBatchApi = async ({
  testsToCreate,
}: {
  testsToCreate: CreateTestPayload[];
}) => {
  const response = await api.post(`/api/v1/tests/batch`, {
    testsToCreate,
  });

  return response.data;
};