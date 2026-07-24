import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import { Shell } from "@/components/shell/Shell"
import { ProveedorSesion, useSesion } from "@/contextos/sesion"
import { ProveedorTema } from "@/contextos/tema"
import { Grafico } from "@/paginas/Grafico"
import { Graficos } from "@/paginas/Graficos"
import { Inicio } from "@/paginas/Inicio"
import { Login } from "@/paginas/Login"

function Guardia({ children }: { children: React.ReactNode }) {
  const { cargando, autenticado } = useSesion()
  if (cargando) return null
  if (!autenticado) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <ProveedorTema>
        <ProveedorSesion>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              element={
                <Guardia>
                  <Shell />
                </Guardia>
              }
            >
              <Route index element={<Inicio />} />
              <Route path="/graficos" element={<Graficos />} />
              <Route path="/grafico/:simbolo" element={<Grafico />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </ProveedorSesion>
      </ProveedorTema>
    </BrowserRouter>
  )
}
