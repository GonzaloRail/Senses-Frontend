import { AppRouter } from "@/routes/AppRouter"
import { BrowserRouter } from "react-router"

export const App = () => {
  return (
    <>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </>
  )
}
