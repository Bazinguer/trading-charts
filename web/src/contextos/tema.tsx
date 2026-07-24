import { createContext, useContext, useEffect, useState } from "react"

interface EstadoTema {
  claro: boolean
  alternar: () => void
}

const Ctx = createContext<EstadoTema | null>(null)

/** Tema oscuro por defecto (decisión de diseño); .light como override persistido.
 * Es contexto (no hook suelto) para que los canvas reaccionen al cambio. */
export function ProveedorTema({ children }: { children: React.ReactNode }) {
  const [claro, setClaro] = useState(() => localStorage.getItem("tc-theme-mode") === "light")

  useEffect(() => {
    document.documentElement.classList.toggle("light", claro)
    localStorage.setItem("tc-theme-mode", claro ? "light" : "dark")
  }, [claro])

  return (
    <Ctx.Provider value={{ claro, alternar: () => setClaro((c) => !c) }}>{children}</Ctx.Provider>
  )
}

export function useTema(): EstadoTema {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useTema fuera de ProveedorTema")
  return ctx
}
