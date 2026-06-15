import { useParams } from "react-router";
import { Loading } from "@/shared/components/Loading";
import { ItemForm } from "../components/ItemForm";
import { useItemByIdQuery } from "../hooks/useItemsQueries";

export const ItemInformation = () => {
  const { id } = useParams<{ id: string }>();
  const { data: itemData, isLoading } = useItemByIdQuery({ id });

  if (isLoading) {
    return (
      <Loading message="Cargando información de artículo..."/>
    );
  }

  return <ItemForm data={itemData} itemId={id} />;
};

