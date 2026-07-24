/**
 * Cliente de la API (misma origin: proxy de Vite en dev, FastAPI sirviendo
 * el build en producción). Cookie de sesión HttpOnly; un 401 fuera del login
 * dispara "sesion-caducada" y el contexto de sesión lo gestiona.
 */

export class ErrorApi extends Error {
  status: number

  constructor(status: number, mensaje: string) {
    super(mensaje)
    this.status = status
  }
}

async function pedir<T>(ruta: string, init?: RequestInit): Promise<T> {
  const respuesta = await fetch(ruta, {
    credentials: "include",
    headers: { Accept: "application/json", ...(init?.body ? { "Content-Type": "application/json" } : {}) },
    ...init,
  })
  if (respuesta.status === 401) {
    window.dispatchEvent(new Event("sesion-caducada"))
    throw new ErrorApi(401, "sesión requerida")
  }
  if (!respuesta.ok) {
    const detalle = await respuesta.json().catch(() => null)
    throw new ErrorApi(respuesta.status, detalle?.detail ?? `error ${respuesta.status}`)
  }
  if (respuesta.status === 204) return undefined as T
  return respuesta.json()
}

export const api = <T,>(ruta: string) => pedir<T>(ruta)
export const apiPost = <T,>(ruta: string, cuerpo?: unknown) =>
  pedir<T>(ruta, { method: "POST", body: cuerpo ? JSON.stringify(cuerpo) : undefined })
export const apiPut = <T,>(ruta: string, cuerpo?: unknown) =>
  pedir<T>(ruta, { method: "PUT", body: cuerpo ? JSON.stringify(cuerpo) : undefined })
export const apiDelete = <T,>(ruta: string) => pedir<T>(ruta, { method: "DELETE" })

/* ── Tipos del contrato (api/) ────────────────────────────────────────── */

export interface Sesion {
  auth_activa: boolean
  usuario: string | null
}

export interface SimboloLista {
  simbolo: string
  orden: number
}

export interface Lista {
  id: number
  nombre: string
  orden: number
  simbolos: SimboloLista[]
}

export interface ResumenSimbolo {
  simbolo: string
  nombre: string | null
  ultimo: number | null
  var_pct: number | null
  apertura: number | null
  maximo: number | null
  minimo: number | null
  fecha: string | null
  ampliado: number | null
  ampliado_pct: number | null
  resultados: string | null
}

export type TipoActivo = "cripto" | "accion" | "etf" | "indice" | "fondo"

export interface ResultadoBusqueda {
  simbolo: string
  nombre: string
  tipo: TipoActivo
  fuente: "binance" | "yahoo"
}

export interface AnalisisGuardado {
  simbolo: string
  nombre: string | null
  dibujos: number
  actualizado: string
}
