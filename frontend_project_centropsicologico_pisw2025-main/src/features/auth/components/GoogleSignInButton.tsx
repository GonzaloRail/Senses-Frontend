import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setAuth } from "@/store/auth/auth.store";
import { googleLoginApi, requestGoogleLoginNonce } from "../api/authApi";

interface GoogleCredentialResponse {
  credential?: string;
}

interface GoogleIdentityServices {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        nonce: string;
        auto_select: false;
        callback: (response: GoogleCredentialResponse) => void;
      }) => void;
      renderButton: (
        parent: HTMLElement,
        options: {
          theme: "outline";
          size: "large";
          text: "continue_with";
          shape: "rectangular";
          width: number;
          locale: "es";
        },
      ) => void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentityServices;
  }
}

const GOOGLE_SCRIPT_ID = "google-identity-services-script";
const googleClientId = import.meta.env.VITE_GOOGLE_AUTH_CLIENT_ID?.trim();
let googleScriptPromise: Promise<void> | undefined;

const loadGoogleIdentityServices = () => {
  if (window.google?.accounts.id) return Promise.resolve();
  if (googleScriptPromise) return googleScriptPromise;

  googleScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(
      GOOGLE_SCRIPT_ID,
    ) as HTMLScriptElement | null;
    const script = existingScript ?? document.createElement("script");

    script.onload = () => {
      if (window.google?.accounts.id) resolve();
      else reject(new Error("No se pudo cargar el servicio de Google."));
    };
    script.onerror = () =>
      reject(new Error("No se pudo conectar con el servicio de Google."));

    if (!existingScript) {
      script.id = GOOGLE_SCRIPT_ID;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }).catch((error: unknown) => {
    googleScriptPromise = undefined;
    document.getElementById(GOOGLE_SCRIPT_ID)?.remove();
    throw error;
  });

  return googleScriptPromise;
};

const getGoogleErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const responseData: unknown = error.response?.data;
    if (
      responseData &&
      typeof responseData === "object" &&
      "message" in responseData &&
      typeof responseData.message === "string"
    ) {
      if (error.response?.status === 503) {
        return `${responseData.message}. Puedes continuar con tu correo y contraseña.`;
      }
      return responseData.message;
    }

    switch (error.response?.status) {
      case 401:
        return "La verificación de Google venció. Vuelve a intentarlo.";
      case 403:
        return "Esta cuenta de Google no tiene un usuario habilitado en Senses.";
      case 409:
        return "Esta cuenta de Google tiene un conflicto de vinculación. Contacta al administrador.";
      case 429:
        return error.response.headers["retry-after"]
          ? `Se alcanzó el límite de intentos. Inténtalo de nuevo en ${error.response.headers["retry-after"]} segundos.`
          : "Se alcanzó el límite de intentos. Espera un momento antes de volver a intentarlo.";
      case 503:
        return "El inicio de sesión con Google no está configurado. Puedes ingresar con tu correo y contraseña.";
      default:
        return error.response
          ? "No se pudo iniciar sesión con Google. Inténtalo nuevamente."
          : "No se pudo conectar con Senses. Revisa tu conexión e inténtalo nuevamente.";
    }
  }

  return error instanceof Error
    ? error.message
    : "No se pudo iniciar sesión con Google. Inténtalo nuevamente.";
};

interface GoogleSignInButtonProps {
  onSuccess: () => void;
}

export const GoogleSignInButton = ({ onSuccess }: GoogleSignInButtonProps) => {
  const [nonce, setNonce] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(true);
  const [isGoogleScriptReady, setIsGoogleScriptReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [challengeAttempt, setChallengeAttempt] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(false);
  const isSubmittingRef = useRef(false);
  const challengeRequestRef = useRef<{
    attempt: number;
    promise: Promise<[string, void]>;
  } | null>(null);
  const loginWithCredentialRef = useRef<(response: GoogleCredentialResponse) => void>(() => {});

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!googleClientId) return;

    let isCurrent = true;
    setIsPreparing(true);
    setIsGoogleScriptReady(false);
    setNonce(null);

    // Reuse the in-flight challenge across React Strict Mode's setup/cleanup cycle.
    if (challengeRequestRef.current?.attempt !== challengeAttempt) {
      challengeRequestRef.current = {
        attempt: challengeAttempt,
        promise: Promise.all([
          requestGoogleLoginNonce(),
          loadGoogleIdentityServices(),
        ]),
      };
    }

    challengeRequestRef.current.promise
      .then(([nextNonce]) => {
        if (!isCurrent) return;
        if (!nextNonce) throw new Error("El backend no devolvió el desafío de Google.");
        setNonce(nextNonce);
        setIsGoogleScriptReady(true);
        setIsPreparing(false);
      })
      .catch((error: unknown) => {
        if (!isCurrent) return;
        setErrorMessage(getGoogleErrorMessage(error));
        setIsPreparing(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [challengeAttempt]);

  loginWithCredentialRef.current = (response) => {
    if (!response.credential) {
      setErrorMessage("Google no devolvió una credencial válida. Vuelve a intentarlo.");
      return;
    }
    if (isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setErrorMessage(null);

    // Keep the Google ID token out of React Query's mutation cache.
    void googleLoginApi(response.credential)
      .then((data) => {
        if (!isMountedRef.current) return;
        setAuth({
          accessToken: data.token,
          user: data.user,
        });
        onSuccess();
      })
      .catch((error: unknown) => {
        if (!isMountedRef.current) return;
        setErrorMessage(getGoogleErrorMessage(error));
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          setChallengeAttempt((attempt) => attempt + 1);
        }
      })
      .finally(() => {
        isSubmittingRef.current = false;
        if (isMountedRef.current) setIsSubmitting(false);
      });
  };

  useEffect(() => {
    const google = window.google;
    const container = buttonContainerRef.current;
    if (!googleClientId || !nonce || !isGoogleScriptReady || !google || !container) {
      return;
    }

    container.replaceChildren();
    google.accounts.id.initialize({
      client_id: googleClientId,
      nonce,
      auto_select: false,
      callback: (response) => loginWithCredentialRef.current(response),
    });
    google.accounts.id.renderButton(container, {
      theme: "outline",
      size: "large",
      text: "continue_with",
      shape: "rectangular",
      width: Math.max(200, Math.min(container.clientWidth || 320, 400)),
      locale: "es",
    });

    return () => container.replaceChildren();
  }, [isGoogleScriptReady, nonce]);

  if (!googleClientId) {
    return (
      <div className="w-full max-w-[400px] space-y-2 text-center">
        <Button type="button" variant="outline" className="w-full" disabled>
          Continuar con Google
        </Button>
        <p role="status" className="text-sm text-muted-foreground">
          El acceso con Google no está configurado en este entorno.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[400px] space-y-3">
      {isPreparing && (
        <div
          className="flex min-h-10 items-center justify-center gap-2 text-sm text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          Preparando el acceso con Google…
        </div>
      )}

      <div
        ref={buttonContainerRef}
        className="flex min-h-10 justify-center"
        aria-busy={isSubmitting}
        aria-disabled={isSubmitting}
        style={isSubmitting ? { opacity: 0.55, pointerEvents: "none" } : undefined}
      />

      {isSubmitting && (
        <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground" role="status">
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          Verificando tu cuenta con Senses…
        </p>
      )}

      {errorMessage && (
        <p className="text-center text-sm text-destructive" role="alert">
          {errorMessage}
        </p>
      )}

      {!isPreparing && !nonce && (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setErrorMessage(null);
              setChallengeAttempt((attempt) => attempt + 1);
            }}
          >
            Reintentar conexión con Google
          </Button>
        </div>
      )}
    </div>
  );
};
