import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useAlert } from "@/shared/hooks/useAlert";
import { InputWithHelper } from "@/shared/components/InputWithHelper";
import type { RequestPasswordResetForm } from "@/shared/interfaces/apiResponses/authResponses";
import { useRequestResetPasswordMutation } from "../hooks";

export const RequestPasswordReset = () => {
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RequestPasswordResetForm>();

  const requestResetMutation = useRequestResetPasswordMutation();

  const onSubmit = handleSubmit((data) => {
    requestResetMutation.mutate(data, {
      onSuccess: (data) => {
        showAlert(
          data.message ||
            "Si el correo existe, recibirás un enlace de recuperación",
          "success"
        );
        setTimeout(() => navigate("/auth/login"), 2000);
      },
    });
  });

  return (
    <div className="flex flex-col items-center justify-center">
      <h1 className="scroll-m-20 text-4xl font-bold tracking-tight mb-2 lg:text-5xl text-senses-primary text-center">
        Restablecer Contraseña
      </h1>
      <p className="text-gray-600 mb-5 text-center max-w-md">
        Ingresa tu correo electrónico y te enviaremos un enlace para restablecer
        tu contraseña
      </p>
      <form
        onSubmit={onSubmit}
        className="flex flex-col items-center justify-center w-full max-w-md"
      >
        <InputWithHelper
          id="email"
          label="Correo Electrónico"
          helper="Ingresa tu correo electrónico"
          register={register("email", {
            required: "El correo electrónico es requerido",
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: "Correo electrónico inválido",
            },
          })}
          errors={errors.email}
          type="email"
        />
        <Button
          type="submit"
          className="w-30 mt-2 bg-senses-primary cursor-pointer"
          disabled={requestResetMutation.isPending}
        >
          {requestResetMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            "Enviar Enlace"
          )}
        </Button>
        <p className="mt-4 text-sm text-gray-600">
          ¿Recordaste tu contraseña?{" "}
          <button
            type="button"
            className="underline cursor-pointer"
            onClick={() => navigate("/auth/login")}
          >
            Iniciar sesión
          </button>
        </p>
      </form>
    </div>
  );
};
