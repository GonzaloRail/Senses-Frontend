import api from "@/api/api";
import type { ItemInstance } from "@/shared/interfaces/models";


interface ItemInstancesUpdateMutation {
  id: string;
  itemInstancesToUpdate: Partial<ItemInstance> & {
    quantity: number;
  }
}

export const updateItemInstancesApi = async ({
  id,
  itemInstancesToUpdate,
}: ItemInstancesUpdateMutation) => {
  const response = await api.put(`/api/v1/item-instances/${id}`, itemInstancesToUpdate);
  
  return response.data;
};