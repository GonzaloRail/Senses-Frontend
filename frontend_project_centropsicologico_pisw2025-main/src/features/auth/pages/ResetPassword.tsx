import { useSearchParams, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useAlert } from "@/shared/hooks/useAlert";
import { InputWithHelper } from "@/shared/components/InputWithHelper";
import { useValidateResetPasswordToken } from "../hooks/useAuthQueries";
import type { ResetPasswordForm } from "@/shared/interfaces/apiResponses/authResponses";
import { useResetPasswordMutation } from "../hooks";

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const token = searchParams.get("token");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordForm>();

  const password = watch("password");

  // Validar token de reset
  const {
    isLoading: isValidating,
    error: validationError,
    data: validationData,
  } = useValidateResetPasswordToken(token || undefined);

  // Restablecer contraseña
  const resetPasswordMutation = useResetPasswordMutation();

  const onSubmit = handleSubmit((data) => {
    if (data.password !== data.confirmPassword) {
      showAlert("Las contraseñas no coinciden", "error");
      return;
    }
    resetPasswordMutation.mutate(
      {
        token: token || "",
        password: data.password,
      },
      {
        onSuccess: (data) => {
          showAlert(
            data.message || "Contraseña actualizada exitosamente",
            "success"
          );
          setTimeout(() => navigate("/auth/login"), 1500);
        },
      }
    );
  });

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-red-600 text-lg">Token no proporcionado</p>
        <Button
          onClick={() => navigate("/auth/request-password-reset")}
          className="mt-4 bg-senses-primary"
        >
          Solicitar nuevo enlace
        </Button>
      </div>
    );
  }

  if (isValidating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-senses-primary" />
        <p className="mt-4 text-gray-600">Validando token...</p>
      </div>
    );
  }

  if (validationData && !validationData.data.isValid) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-senses-primary text-lg">
          {validationData.data.error || "El token es inválido o ha expirado."}
        </p>
        <Button
          onClick={() => navigate("/auth/login")}
          className="mt-4 bg-senses-primary"
        >
          Ir al inicio de sesión
        </Button>
      </div>
    );
  }

  if (validationError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-red-600 text-lg">
          Hubo un problema validando el token
        </p>
        <Button
          onClick={() => navigate("/auth/login")}
          className="mt-4 bg-senses-primary"
        >
          Ir al inicio de sesión
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <h1 className="scroll-m-20 text-4xl font-bold tracking-tight mb-2 lg:text-5xl text-senses-primary text-center">
        Nueva Contraseña
      </h1>
      <p className="text-gray-600 mb-5 text-center max-w-md">
        Ingresa tu nueva contraseña
      </p>
      <form
        onSubmit={onSubmit}
        className="flex flex-col items-center justify-center w-full max-w-md"
      >
        <InputWithHelper
          id="password"
          label="Nueva Contraseña"
          helper="Mínimo 6 caracteres"
          register={register("password", {
            required: "La contraseña es requerida",
            minLength: {
              value: 6,
              message: "La contraseña debe tener al menos 6 caracteres",
            },
          })}
          errors={errors.password}
          type="password"
          autoComplete="off"
        />
        <InputWithHelper
          id="confirmPassword"
          label="Confirmar Contraseña"
          helper="Repite tu contraseña"
          register={register("confirmPassword", {
            required: "Confirma tu contraseña",
            validate: (value) =>
              value === password || "Las contraseñas no coinciden",
          })}
          errors={errors.confirmPassword}
          type="password"
          autoComplete="off"
        />
        <Button
          type="submit"
          className="w-40 mt-2 bg-senses-primary cursor-pointer"
          disabled={resetPasswordMutation.isPending}
        >
          {resetPasswordMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Actualizando...
            </>
          ) : (
            "Actualizar Contraseña"
          )}
        </Button>
      </form>
    </div>
  );
};
