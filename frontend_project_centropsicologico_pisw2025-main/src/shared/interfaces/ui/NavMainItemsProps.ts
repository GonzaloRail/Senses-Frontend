import type { IconType } from "react-icons/lib"

interface NavMainItem {
  title: string;
  icon: IconType;
  url: string;
}

export interface NavMainItemsProps {
  items: NavMainItem[];
}