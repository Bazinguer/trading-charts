import { createContext, useCallback, useContext, useEffect, useState } from "react"

import { api, apiPost, type Sesion } from "@/lib/api"

interface EstadoSesion {
  cargando: boolean
  authActiva: boolean
  usuario: string | null
  /** true si puede ver la app (logueado, o auth desactivada en dev) */
  autenticado: boolean
  entrar: (usuario: string, password: string) => Promise<void>
  salir: () => Promise<void>
}

const Ctx = createContext<EstadoSesion | null>(null)

export function ProveedorSesion({ children }: { children: React.ReactNode }) {
  const [cargando, setCargando] = useState(true)
  const [authActiva, setAuthActiva] = useState(true)
  const [usuario, setUsuario] = useState<string | null>(null)

  useEffect(() => {
    api<Sesion>("/api/sesion")
      .then((s) => {
        setAuthActiva(s.auth_activa)
        setUsuario(s.usuario)
      })
      .finally(() => setCargando(false))
  }, [])

  useEffect(() => {
    const caducada = () => setUsuario(null)
    window.addEventListener("sesion-caducada", caducada)
    return () => window.removeEventListener("sesion-caducada", caducada)
  }, [])

  const entrar = useCallback(async (nombre: string, password: string) => {
    const r = await apiPost<{ usuario: string }>("/api/login", { usuario: nombre, password })
    setUsuario(r.usuario)
  }, [])

  const salir = useCallback(async () => {
    await apiPost("/api/logout")
    setUsuario(null)
  }, [])

  const valor: EstadoSesion = {
    cargando,
    authActiva,
    usuario,
    autenticado: !authActiva || usuario !== null,
    entrar,
    salir,
  }
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}

export function useSesion(): EstadoSesion {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useSesion fuera de ProveedorSesion")
  return ctx
}
