# 🤖 Subagentes Disponibles - Resumen Completo

## 📋 INVENTARIO DE ESPECIALISTAS

| Agente                 | Modelo | Especialidad           | Uso Principal                            | Triggers                                            |
| ---------------------- | ------ | ---------------------- | ---------------------------------------- | --------------------------------------------------- |
| **researcher**         | Sonnet | Inteligencia técnica   | Documentación oficial, mejores prácticas | "how to", "best practice", "documentation"          |
| **code-explorer**      | Sonnet | Exploración de código  | Mapeo arquitectura, dependencias         | "find references", "symbol definition", "structure" |
| **error-logs-analyst** | Sonnet | Análisis de logs       | Debug backend, causa raíz                | "analyze logs", "debug error", "check logs"         |
| **validator**          | Sonnet | Validación post-fix    | Verificar fixes, regresiones             | "validate fix", "verify changes", "test fix"        |
| **ui-tester-console**  | Sonnet | Testing UI console     | Debug frontend, browser testing          | Debugging UI específico con console                 |
| **ui-tester**          | Sonnet | Testing UI general     | Testing interfaces, UX flows             | Testing UI general, validación visual               |
| **ui-shadcn**          | Sonnet | Componentes UI médicos | shadcn/ui + dashboards médicos           | "component", "form", "UI element", "dashboard"      |
| **commit-manager**     | Sonnet | Git automation         | Commits automáticos, mensajes            | "make commit", "create commit", "save progress"     |

## 🔍 **RESEARCHER** (Sonnet)

**🎯 Misión**: Especialista en inteligencia técnica - Libera al agente principal de toda investigación

### Capacidades:

- **Documentación oficial**: FastAPI, Python, HTMX, Alpine.js, SQLAlchemy, Pydantic
- **Mejores prácticas**: Patrones industria, estándares oficiales
- **Resolución técnica**: Errores conocidos, framework conflicts
- **Análisis competitivo**: Comparación de soluciones

### Herramientas:

- Context7 MCP (documentación actualizada)
- Tavily Search (investigación profunda)
- Brave Search (caching inteligente)

### Output:

inteligencia técnica procesada directamente al agente principal

### Cuándo usar:

- Necesitas documentación oficial actualizada
- Buscas best practices para implementación
- Tienes errores que requieren research profundo
- Comparas tecnologías o enfoques

## 🗂️ **CODE-EXPLORER** (Sonnet)

**🎯 Misión**: Submarinista de código experto - Exploración profunda y exhaustiva

### Capacidades:

- **Mapeo completo**: Símbolos, arquitectura, dependencias
- **Análisis semántico**: Class hierarchies, code structure
- **Búsqueda exhaustiva**: Patterns across files, symbol navigation
- **Validación cruzada**: Comprehensive analysis con múltiples herramientas

### Herramientas:

- Todas las herramientas de búsqueda disponibles
- Sub-agentes especializados cuando aplique
- Semantic y exact search analysis

### Output:

resultado estructurado directo con mapeo completo de símbolos, dependencias y arquitectura

### Cuándo usar:

- "find all references", "symbol definition"
- Explorar project architecture
- Mapear dependencies complejas
- Entender code structure profundamente

## 🚨 **ERROR-LOGS-ANALYST** (Sonnet)

**🎯 Misión**: Detective autónomo de errores - Análisis inteligente con total autonomía

### Capacidades:

- **Ejecución autónoma**: Make commands apropiados automáticamente
- **Análisis de patrones**: Causa raíz vs síntomas
- **Clasificación inteligente**: Por impacto real, cascadas de errores
- **Filtrado temporal**: Adaptativo según contexto

### Herramientas:

- Bash execution (make logs, make logs-api, etc.)
- Pattern analysis avanzado
- Temporal filtering inteligente

### Output:

diagnóstico estructurado directo con clasificación de errores, causa raíz y fixes sugeridos

### Cuándo usar:

- Errores en logs de aplicación
- Debugging de APIs y endpoints
- Investigar crashes o failures
- Análisis post-deployment

## ✅ **VALIDATOR** (Sonnet)

**🎯 Misión**: Guardián de calidad autónomo - Garantía inteligente post-fix

### Capacidades:

- **Validación contextual**: Adaptada al tipo de fix aplicado
- **Regression detection**: Proactiva con confidence scoring
- **Health monitoring**: Performance y functionality
- **Quality assurance**: Tests automáticos + análisis

### Herramientas:

- Test execution automática
- Log analysis post-fix
- Performance monitoring
- Regression scanning

### Output:

reporte de validación estructurado directo con garantías y detección de regresiones

### Cuándo usar:

- Después de aplicar cualquier fix
- Verificar que cambios funcionan
- Detectar regresiones
- Confirmar health del sistema

## 🖥️ **UI-TESTER-CONSOLE** (Sonnet)

**🎯 Misión**: Especialista debugging UI con foco en console diagnostics

### Capacidades:

- **Browser automation**: Navegación y interacción específica
- **Console analysis**: Captura detallada de logs y errores
- **Network diagnostics**: API calls y performance
- **Framework debugging**: Alpine.js, HTMX issues específicos

### Herramientas:

- Browser automation completo
- Console log capturing
- Network monitoring
- JavaScript error detection

### Output:

Reportes estruturados JSON con diagnósticos técnicos

### Cuándo usar:

- Debug de JavaScript errors
- Problemas de framework loading
- API integration issues desde UI
- Console-based diagnostics

## 🎨 **UI-TESTER** (Sonnet)

**🎯 Misión**: Testing UI general con foco en user experience

### Capacidades:

- **User flow testing**: Navegación y interacción completa
- **Visual validation**: UI components y layouts
- **Accessibility testing**: Compliance y usability
- **Responsive testing**: Multi-device validation

### Herramientas:

- Playwright automation
- Visual regression testing
- Accessibility scanning
- Multi-browser testing

### Output:

Reportes UI comprehensivos con validación visual

### Cuándo usar:

- Validar user flows completos
- Testing de interfaces visuales
- Verificar responsive design
- Accessibility compliance

## 🎨 **UI-SHADCN** (Sonnet)

**🎯 Misión**: Arquitecto de componentes UI médicos - Implementador especialista con shadcn/ui MCP

### Capacidades:

- **Implementación física**: Crea componentes en `/dashboard/src/components/*` y `/dashboard/src/styles/*`
- **shadcn/ui MCP**: Acceso a 336+ componentes vía registry oficial
- **Multi-tenant theming**: CSS variables para personalización por clínica
- **Dominio médico**: Especialización en dashboards y workflows sanitarios
- **WCAG AA compliance**: Accesibilidad obligatoria desde diseño

### Herramientas:

- shadcn/ui MCP (get_project_registries, search_items, view_items, get_examples)
- Write/Edit (SOLO en directorios UI específicos)
- TypeScript + Tailwind CSS + CVA
- Radix UI primitives

### Output:

Implementación física de componentes + reporte exhaustivo detallando qué implementó, dónde, líneas, decisiones

### Cuándo usar:

- Necesitas componentes UI médicos específicos
- Crear formularios, tablas, charts para dashboard
- Implementar sistema de tematización multi-tenant
- Customizar componentes shadcn/ui para dominio médico

### ⚠️ Importante:

- **PATRÓN HÍBRIDO**: Implementa físicamente Y reporta exhaustivamente
- **BOUNDARIES ESTRICTOS**: Solo toca UI, nunca backend/configs
- **MCP REQUIRED**: Si MCP falla → aborta y reporta al principal

## 📝 **COMMIT-MANAGER** (Sonnet)

**🎯 Misión**: Especialista en Conventional Commits - Análisis y ejecución automática

### Capacidades:

- **Análisis inteligente**: git status + diff para entender cambios
- **Clasificación automática**: Detecta tipo (feat, fix, refactor, etc.)
- **Conventional Commits estricto**: Formato `type(scope): description` siempre
- **Verificación de seguridad**: Detecta secretos, .env, archivos grandes
- **Ejecución automática**: Hace commit si todo está correcto
- **Reporte selectivo**: Solo reporta al principal cuando hay problemas

### Herramientas:

- Bash (git status, diff, add, commit)
- Grep (búsqueda de secretos/patterns)
- Read (análisis de archivos modificados)

### Output:

- **CASO NORMAL**: Ejecuta commit y reporta hash + detalles
- **CASO PROBLEMA**: Reporta discrepancias y solicita decisión del principal

### Cuándo usar:

- Crear commits durante desarrollo
- Checkpoint de progreso con mensaje descriptivo
- Asegurar Conventional Commits siempre
- Automatizar proceso de commit sin intervención manual

### ⚠️ Importante:

- **PATRÓN AUTÓNOMO**: Ejecuta automáticamente cuando todo está bien
- **SOLO REPORTA PROBLEMAS**: No requiere confirmación para commits normales
- **SEGURIDAD FIRST**: Verifica secretos antes de commitear

## 🔄 WORKFLOWS DE COORDINACIÓN

### **Frontend Issues**:

```
ui-tester-console → error-logs-analyst (si API) → validator
```

### **Backend Issues**:

```
error-logs-analyst → ui-tester-console (reproducir) → validator
```

### **Full-Stack Validation**:

```
ui-tester-console → error-logs-analyst → validator → ui-tester-console
```

### **UI Component Development**:

```
ui-shadcn (implementa) → ui-tester (valida) → validator
```

### **Research & Implementation**:

```
researcher → code-explorer → implementation → validator
```

### **Dashboard Feature**:

```
researcher → ui-shadcn (componentes) → ui-tester → validator → commit-manager
```

### **Complete Development Cycle**:

```
researcher → code-explorer → implementation → ui-tester → validator → commit-manager
```

## 💡 TIPS DE SELECCIÓN

### **Usa researcher cuando**:

- Necesites documentación oficial
- Busques best practices
- Tengas preguntas técnicas conceptuales

### **Usa code-explorer cuando**:

- Necesites mapear código existente
- Busques definiciones o referencias
- Explores arquitectura de proyecto

### **Usa error-logs-analyst cuando**:

- Tengas errores en logs
- Necesites debugging de backend
- Investigues problemas de API

### **Usa validator cuando**:

- Hayas aplicado fixes
- Necesites verificar funcionamiento
- Busques detectar regresiones

### **Usa ui-tester-console cuando**:

- Debug específico de frontend
- Problemas con JavaScript/frameworks
- Necesites diagnostics de console

### **Usa ui-tester cuando**:

- Testing general de interfaces
- Validación de user flows
- Verificación visual o UX

### **Usa ui-shadcn cuando**:

- Necesites componentes médicos específicos
- Crear formularios, tablas, charts
- Implementar tematización multi-tenant
- Customizar componentes shadcn/ui

### **Usa commit-manager cuando**:

- Crees commits estructurados
- Automatices git workflow
- Mantengas historial limpio

## 📚 COMANDOS RELACIONADOS

- `/debug-orchestrator` - Full-stack debug orchestration with intelligent multi-agent coordination
- `/git-worktree` - Intérprete de lenguaje natural para gestión de worktrees Git

---

**💡 Tip**: Los agentes están diseñados para trabajar coordinados. El orquestador principal decide automáticamente cuáles usar según el contexto del problema.
