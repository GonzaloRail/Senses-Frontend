import { Outlet } from "react-router"
import logoDarkCut from "@/assets/logo-dark-cut.jpeg"

export const AuthLayout = () => {
  return (
    <main className="justify-center items-center h-dvh flex flex-col-reverse lg:grid lg:grid-cols-[4fr_2fr]">
      <div className="flex flex-col w-full justify-center items-center bg-senses-primary lg:h-full">
        <img
          className="w-25 my-2 object-cover lg:w-120"
          src={logoDarkCut}
          alt="logo senses psicologos tema oscuro" />
      </div>
      <div className="h-full flex flex-col justify-center items-center bg-senses-light p-5">
        <Outlet />
      </div>
    </main>
  )
}
