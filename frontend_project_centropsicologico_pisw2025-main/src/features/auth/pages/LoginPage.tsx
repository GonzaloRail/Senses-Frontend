import { isAxiosError } from "axios";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { LoginFormSchema } from "@/shared/interfaces/forms/LoginFormSchema";
import { loginFormSchema } from "@/shared/interfaces/forms/LoginFormSchema";
import { Link, useNavigate } from "react-router";
import { useAuth } from "@/store/auth/auth.store";
import { useEffect, useState } from "react";
import { useLoginMutation } from "../hooks";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import "./LoginPage.css";

function loginErrorMessage(error: unknown) {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 401) return "El correo o la contraseña son incorrectos.";
    if (status === 429) return "Has realizado demasiados intentos. Espera un momento y vuelve a intentarlo.";
    if (!error.response) return "No pudimos conectar con Senses. Revisa tu conexión e inténtalo de nuevo.";
    const message = error.response.data?.message;
    if (status && status < 500 && typeof message === "string" && message.trim()) return message;
  }
  return "No pudimos iniciar sesión. Inténtalo de nuevo.";
}

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
  const [showPassword, setShowPassword] = useState(false);

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
    <main className="senses-login min-h-dvh lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.12fr)]">
      <div className="senses-login-art hidden lg:grid" aria-hidden="true">
        <img src="/senses-landing-wellbeing.webp" alt="" width={527} height={474} />
      </div>

      <section className="flex min-h-dvh min-w-0 items-center justify-center px-6 py-10 sm:px-10" aria-labelledby="login-title">
        <div className="w-full max-w-[400px]">
          <img
            className="mb-9 h-auto w-44 sm:mb-10 sm:w-52"
            src="/senses-landing-logo.png"
            alt="Senses Psicólogos"
            width={865}
            height={288}
          />
          <h1 id="login-title" className="senses-login-title text-3xl leading-tight sm:text-4xl">Iniciar sesión</h1>
          <p className="mt-2 text-sm text-muted-foreground">Accede a tu cuenta de Senses.</p>

          <form className="mt-7 space-y-5" onSubmit={onSubmit} noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                {...register("email")}
                id="email"
                type="email"
                autoComplete="username"
                autoCapitalize="none"
                placeholder="nombre@correo.com"
                className="h-12 rounded-xl bg-white dark:bg-white"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "login-email-error" : undefined}
              />
              {errors.email && <p id="login-email-error" className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  {...register("password")}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  spellCheck={false}
                  autoCapitalize="none"
                  className="h-12 rounded-xl bg-white pr-14 dark:bg-white"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? "login-password-error" : undefined}
                />
                <button
                  type="button"
                  className="absolute right-1 top-0.5 grid size-11 cursor-pointer place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  aria-controls="password"
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}
                </button>
              </div>
              {errors.password && <p id="login-password-error" className="text-sm text-destructive">{errors.password.message}</p>}
            </div>

            <div className="flex justify-end">
              <Link to="/auth/request-password-reset" className="rounded text-sm font-medium underline decoration-[#8ba64a] underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            {login.isError && (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-destructive">
                {loginErrorMessage(login.error)}
              </p>
            )}
            <Button type="submit" className="senses-login-submit h-12 w-full cursor-pointer rounded-xl font-semibold" disabled={login.isPending}>
              {login.isPending ? "Ingresando…" : "Ingresar"}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-sm text-muted-foreground" aria-hidden="true">
            <span className="h-px flex-1 bg-border" />
            <span>o continúa con</span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <GoogleSignInButton onSuccess={() => navigate("/auth/select", { replace: true })} />
        </div>
      </section>
    </main>
  );
};
