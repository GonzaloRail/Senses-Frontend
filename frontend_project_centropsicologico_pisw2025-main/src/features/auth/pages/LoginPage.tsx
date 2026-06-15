import { InputWithHelper } from "@/shared/components/InputWithHelper";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { LoginFormSchema } from "@/shared/interfaces/forms/LoginFormSchema";
import { loginFormSchema } from "@/shared/interfaces/forms/LoginFormSchema";
import { useNavigate } from "react-router";
import { useAuth } from "@/store/auth/auth.store";
import { useEffect } from "react";
import { useLoginMutation } from "../hooks";

export const LoginPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormSchema>({
    resolver: zodResolver(loginFormSchema),
  });

  const navigate = useNavigate();
  const accessToken = useAuth((state) => state.accessToken);
  const roleSelected = useAuth((state) => state.roleSelected);

  const login = useLoginMutation();

  const onSubmit = handleSubmit((data) => {
    login.mutate(data, {
      onSuccess: () => {
        navigate("/auth/select");
      },
    });
  });

  useEffect(() => {
    if (accessToken && roleSelected) {
      navigate("/");
    }
  }, [accessToken, roleSelected, navigate]);

  return (
    <div className="flex flex-col items-center justify-center">
      <h1 className="scroll-m-20 text-4xl font-bold tracking-tight mb-5 lg:text-5xl text-senses-primary text-center">
        Iniciar Sesión
      </h1>
      <form
        onSubmit={onSubmit}
        className="flex flex-col items-center justify-center"
      >
        <InputWithHelper
          id="email"
          label="Correo Electrónico"
          helper="Ingresa tu correo electrónico"
          register={register("email")}
          errors={errors.email}
        />
        <InputWithHelper
          id="password"
          label="Contraseña"
          helper="Ingresa tu contraseña"
          register={register("password")}
          errors={errors.password}
          type="password"
          autoComplete="off"
        />
        <Button
          type="submit"
          className="w-30 mt-2 bg-senses-primary cursor-pointer"
        >
          Ingresar
        </Button>
        <p className="mt-4 text-sm text-gray-600">
          ¿Olvidaste tu contraseña?{" "}
          <button
            type="button"
            className="underline cursor-pointer"
            onClick={() => navigate("/auth/request-password-reset")}
          >
            Restablecer contraseña
          </button>
        </p>
      </form>
    </div>
  );
};
