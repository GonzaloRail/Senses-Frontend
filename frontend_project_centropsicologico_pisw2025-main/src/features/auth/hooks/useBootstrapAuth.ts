import { useEffect } from "react";
import api from "@/api/api";
import { setAuth } from "@/store/auth/auth.store";

export const useBootstrapAuth = () => {
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.post("/auth/refresh-token");
        if (!data.user) throw new Error("No user in response");
        setAuth({
          accessToken: data.accessToken,
          roleSelected: data.roleSelected,
          user: data.user,
        });
      } catch (e) {
        setAuth({ accessToken: null, user: null, roleSelected: null });
        console.log("Error bootstrapAuth", e);
      }
    })();
  }, []);
};
