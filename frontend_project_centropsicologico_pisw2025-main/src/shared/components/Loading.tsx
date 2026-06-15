interface LoadingProps {
  message?: string;
}

export const Loading = ({ message = "Cargando..." }: LoadingProps) => {
  return (
    <div className="flex justify-center min-h-screen bg-white items-center">
      <div className="flex-col items-center p-8 justify-items-center">
        <div className="w-10 h-10 border-4 border-gray-300 border-t-primary rounded-full animate-spin" />
        <span className="mt-4 text-senses-primary">{message}</span>
      </div>
    </div>
  );
};