/**
 * PageHeader — cabecera estándar de página (patrón canónico jombotix, serps).
 * Back link opcional ARRIBA del título + icono plano + h1 + descripción +
 * slot de acciones a la derecha (debajo del título en mobile).
 *
 * El `backLink.label` debe ser el nombre del destino (p. ej. "Inicio" o
 * "Gráficos"), NUNCA un genérico tipo "Volver" o "Atrás".
 */

import type { ComponentType, ReactNode } from "react"
import { ChevronLeft } from "lucide-react"
import { Link } from "react-router-dom"

import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  /** Icono Lucide plano junto al h1 (sin fondo). */
  icon?: ComponentType<{ className?: string }>
  /** Back link estilo iOS encima del título; solo en subpáginas. */
  backLink?: { to: string; label: string }
  /** Botones de acción a la derecha (o debajo, en mobile). */
  children?: ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  icon: Icono,
  backLink,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 border-b pb-4 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="space-y-1">
        {backLink && (
          <Link
            to={backLink.to}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            {backLink.label}
          </Link>
        )}
        <div className="flex items-center gap-2">
          {Icono && <Icono className="h-5 w-5 text-muted-foreground" />}
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        </div>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex shrink-0 items-center gap-2 pt-2 sm:pt-0">{children}</div>}
    </div>
  )
}
