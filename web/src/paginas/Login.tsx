import { useState } from "react"
import { ChartCandlestick } from "lucide-react"
import { Navigate, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useSesion } from "@/contextos/sesion"

export function Login() {
  const { autenticado, entrar } = useSesion()
  const navegar = useNavigate()
  const [usuario, setUsuario] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  if (autenticado) return <Navigate to="/" replace />

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setEnviando(true)
    try {
      await entrar(usuario, password)
      navegar("/", { replace: true })
    } catch {
      setError("Usuario o contraseña incorrectos")
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-xl bg-accent text-primary">
            <ChartCandlestick className="size-6" />
          </span>
          <CardTitle className="text-xl">Trading Charts</CardTitle>
          <p className="text-sm text-muted-foreground">Análisis técnico persistente</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={enviar} className="flex flex-col gap-3">
            <Input
              placeholder="Usuario"
              autoComplete="username"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Contraseña"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={enviando}>
              {enviando ? "Entrando…" : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
