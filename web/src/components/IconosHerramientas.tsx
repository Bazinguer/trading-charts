import type { SVGProps } from "react"

// Iconos propios de la barra de dibujo, estilo Investing/TradingView: trazo
// fino con nodos circulares en las anclas. Mismo contrato que un icono lucide
// (stroke currentColor, viewBox 24, escalan con [&_svg]:size-* del Button).
// Los trazos llegan a ~2.5px del borde para pesar lo mismo que los de lucide.

function Svg(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    />
  )
}

export function IconoLinea(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <line x1="6.5" y1="17.5" x2="17.5" y2="6.5" />
      <circle cx="4.5" cy="19.5" r="2" />
      <circle cx="19.5" cy="4.5" r="2" />
    </Svg>
  )
}

export function IconoHorizontal(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <line x1="2.5" y1="12" x2="9.5" y2="12" />
      <line x1="14.5" y1="12" x2="21.5" y2="12" />
      <circle cx="12" cy="12" r="2" />
    </Svg>
  )
}

export function IconoVertical(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <line x1="12" y1="2.5" x2="12" y2="9.5" />
      <line x1="12" y1="14.5" x2="12" y2="21.5" />
      <circle cx="12" cy="12" r="2" />
    </Svg>
  )
}

export function IconoCanal(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <line x1="2.5" y1="15.5" x2="14.5" y2="3.5" />
      <line x1="9.5" y1="20.5" x2="21.5" y2="8.5" />
      <circle cx="17.5" cy="2.5" r="1.8" />
      <circle cx="6.5" cy="21.5" r="1.8" />
    </Svg>
  )
}

export function IconoFibonacci(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <line x1="2.5" y1="5" x2="17" y2="5" />
      <line x1="2.5" y1="12" x2="17" y2="12" />
      <line x1="2.5" y1="19" x2="17" y2="19" />
      <circle cx="19.8" cy="5" r="1.8" />
      <circle cx="19.8" cy="12" r="1.8" />
      <circle cx="19.8" cy="19" r="1.8" />
    </Svg>
  )
}

export function IconoFormas(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <rect x="4" y="4" width="16" height="16" rx="1" />
      <circle cx="4" cy="4" r="2" />
      <circle cx="20" cy="20" r="2" />
    </Svg>
  )
}

export function IconoTexto(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <line x1="5" y1="4" x2="19" y2="4" />
      <line x1="5" y1="4" x2="5" y2="7" />
      <line x1="19" y1="4" x2="19" y2="7" />
      <line x1="12" y1="4" x2="12" y2="20" />
      <line x1="9" y1="20" x2="15" y2="20" />
    </Svg>
  )
}

export function IconoPincel(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="M4 13.5C7.5 6 12.5 6 15 9.5s5 3.5 6.5 1" />
      <circle cx="4" cy="16.5" r="2" />
      <path d="M14.5 20.5c2 0 3.2-1.2 3.2-2.7 0-1.2-1-2.2-2.3-2.2-1.1 0-2 .8-2 1.9 0 1.7 1.1 3 1.1 3z" />
    </Svg>
  )
}

export function IconoRegla(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <rect x="1.8" y="9" width="20.4" height="6" rx="1" transform="rotate(-45 12 12)" />
      <line x1="8" y1="12" x2="9.8" y2="13.8" />
      <line x1="11.2" y1="8.8" x2="13" y2="10.6" />
      <line x1="14.4" y1="5.6" x2="16.2" y2="7.4" />
    </Svg>
  )
}
