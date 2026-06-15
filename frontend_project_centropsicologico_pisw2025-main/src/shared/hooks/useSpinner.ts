import React, {
  useState,
  useMemo,
  type CSSProperties,
  type ReactElement,
  type ComponentType,
} from "react";
import {
  PulseLoader,
  BarLoader,
  BeatLoader,
  BounceLoader,
  ClimbingBoxLoader,
  ClipLoader,
  ClockLoader,
  CircleLoader,
  DotLoader,
  FadeLoader,
  GridLoader,
  HashLoader,
  MoonLoader,
  PacmanLoader,
  PropagateLoader,
  PuffLoader,
  RingLoader,
  RiseLoader,
  RotateLoader,
  ScaleLoader,
  SkewLoader,
  SquareLoader,
  SyncLoader,
} from "react-spinners";

// Tipos de spinners disponibles, ahora con ClipLoader y ClockLoader
export type SpinnerType =
  | "PulseLoader"
  | "BarLoader"
  | "BeatLoader"
  | "BounceLoader"
  | "ClimbingBoxLoader"
  | "ClipLoader"
  | "ClockLoader"
  | "CircleLoader"
  | "DotLoader"
  | "FadeLoader"
  | "GridLoader"
  | "HashLoader"
  | "MoonLoader"
  | "PacmanLoader"
  | "PropagateLoader"
  | "PuffLoader"
  | "RingLoader"
  | "RiseLoader"
  | "RotateLoader"
  | "ScaleLoader"
  | "SkewLoader"
  | "SquareLoader"
  | "SyncLoader";

interface SpinnerProps {
  size?: number;
  color?: string;
  loading?: boolean;
  cssOverride?: CSSProperties;
}

interface Props {
  initialLoading?: boolean;
  options?: SpinnerProps;
  spinnerType?: SpinnerType;
}

// Mapeo de los diferentes tipos de spinners a los componentes de react-spinners
const spinnerMap: Record<SpinnerType, ComponentType<SpinnerProps>> = {
  PulseLoader,
  BarLoader,
  BeatLoader,
  BounceLoader,
  ClimbingBoxLoader,
  ClipLoader,
  ClockLoader,
  CircleLoader,
  DotLoader,
  FadeLoader,
  GridLoader,
  HashLoader,
  MoonLoader,
  PacmanLoader,
  PropagateLoader,
  PuffLoader,
  RingLoader,
  RiseLoader,
  RotateLoader,
  ScaleLoader,
  SkewLoader,
  SquareLoader,
  SyncLoader,
};

export const useSpinner = ({
  initialLoading = false,
  options = { size: 25, color: "#2C3E50" },
  spinnerType = "PulseLoader",
}: Props) => {
  // Estilos por defecto para el spinner
  const override: CSSProperties = useMemo(
    () => ({
      display: "block",
      margin: "0 auto",
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
    }),
    []
  );

  // Estado de carga, puede ser modificado desde fuera del hook
  const [loading, setLoading] = useState(initialLoading);

  // Extraemos directamente `size` y `color` de las opciones, usando valores por defecto
  const { size = 25, color = "#2C3E50" } = options;

  // Función que devuelve el spinner correspondiente
  const Spinner = (): ReactElement => {
    const SelectedSpinner = spinnerMap[spinnerType]; // Selecciona el spinner correspondiente
    // Usar React.createElement para evitar problemas de sintaxis y tipos
    return React.createElement(SelectedSpinner, {
      size,
      color,
      loading,
      cssOverride: override,
    });
  };

  // Devuelve la función Spinner, el estado de carga y la función para modificarlo
  return { loading, setLoading, Spinner };
};
