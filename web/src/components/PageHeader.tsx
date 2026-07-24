/**
 * PageHeader — Cabecera estándar de página.
 * Icono con fondo + título h1 + descripción + slot de acciones a la derecha.
 * Opcional: back link tipo iOS arriba-izquierda (patrón DS para subpáginas).
 */

import type { ReactNode } from "react"
import { ChevronLeft } from "lucide-react"
import { Link } from "react-router-dom"

import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  icon?: ReactNode
  /** Acciones a la derecha (children) */
  children?: ReactNode
  /**
   * Back link opcional, estilo iOS.
   * Se renderiza arriba-izquierda, como una línea pequeña con chevron.
   * Ej: { to: "/graficos", label: "Gráficos" }
   */
  backLink?: { to: string; label: string }
  className?: string
}

export function PageHeader({
  title,
  description,
  icon,
  children,
  backLink,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-2 border-b pb-4", className)}>
      {backLink && (
        <Link
          to={backLink.to}
          className="inline-flex w-fit items-center gap-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          {backLink.label}
        </Link>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="shrink-0 rounded-lg bg-primary/10 p-2.5 text-primary">{icon}</div>
          )}
          <div className="space-y-0.5">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
        </div>
        {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
      </div>
    </div>
  )
}
