## 🎯 FILOSOFÍA DE TRABAJO

**Filosofía:** SIMPLICIDAD > SOSTENIBILIDAD > ESCALABILIDAD

1. **SIMPLICIDAD primero** - Si es complejo, está mal
2. **SOSTENIBLE siempre** - Código que resulte sencillo de mantener
3. **ESCALABLE cuando sea necesario** - No sobre-ingeniería prematura

IMPORTANTE: Dentro del marco que le corresponde. Aplicaciones grandes y escalando de por sí tienen cierto nivel de complejidad.

### KISS (Keep It Simple, Stupid)

- La simplicidad debe ser un objetivo clave en el diseño
- Elija soluciones sencillas en lugar de complejas siempre que sea posible
- Las soluciones simples son más fáciles de entender, mantener y depurar

### YAGNI (You Aren't Gonna Need It)

- Evite crear funcionalidades basadas en especulaciones
- Implemente funciones solo cuando sean necesarias, no cuando anticipe que podrían ser útiles en el futuro

### Open-Closed Principle - OCP

- Las entidades de software deben estar abiertas a extensiones, pero cerradas a modificaciones
- Diseñe sistemas de modo que se puedan agregar nuevas funcionalidades con cambios mínimos en el código existente

## 📢 COMUNICACIÓN

1. **Crítico siempre** - Si hay mejor forma, dila
2. **Directo al grano** - Sin relleno ni "como puedes ver..."
3. **Comparar con Java/Spring** cuando ayude
4. **Código > Palabras** - Mostrar, no explicar
5. **"¿Por qué?"** antes que "¿Cómo?"

### NO:

- ❌ "Excelente pregunta..."
- ❌ Explicaciones largas no pedidas
- ❌ Dar la razón sin pensar
- ❌ Asumir conocimiento Python

### SÍ:

- ✅ "Hay 3 opciones: [A, B, C]. Recomiendo A porque..."
- ✅ "Esto es como @Autowired en Spring"
- ✅ "Cuidado: esto puede escalar mal"
- ✅ Preguntar antes de asumir

## 👨‍💻 ENTORNO DE TRABAJO:

- Windows 11 + WSL Ubuntu
- Docker en WSL separado pero accesible
- VS Code como IDE principal.
- Claude Code para pair programming

## 🚨 METODOLOGÍA CRÍTICA: GESTIÓN DE DATOS

**Metodología obligatoria** para manejo de datos en JomBotix ChatBot tras identificar y resolver un problema crítico de **hardcoding masivo** que amenazaba la mantenibilidad del proyecto.

### 🎯 PRINCIPIOS CORE ESTABLECIDOS

1. **SINGLE SOURCE OF TRUTH**: `scripts/init_schema_new_model_database.sql` es el esquema PILAR de la base de datos. Y `scripts/init_seed_new_model_database.sql` es la ÚNICA fuente de datos de test.
2. **NO HARDCODING**: Prohibido hardcodear datos en Python - SIEMPRE usar base de datos
3. **NO MOCK CONDITIONALS**: Eliminados los `if mock_mode` - sistema siempre usa BD real
4. **DATABASE-DRIVEN**: Toda configuración, usuarios, agentes, strategies vienen de BD

---

### 🛡️ PREVENCIÓN DE REGRESIONES - Code Review Checklist

- [ ] ¿El endpoint consulta base de datos?
- [ ] ¿El esquema `init_schema_new_model_database.sql` contempla esa estructura de datos?
- [ ] ¿Los datos están de poblado estan en `init_seed_new_model_database.sql`?
- [ ] ¿No hay hardcoding de arrays/dicts con datos?
- [ ] ¿No hay condicionales `if mock_mode`?
- [ ] ¿El modelo SQLAlchemy está creado?
- [ ] ¿Las migraciones están documentadas?

---

#### ⚠️ NO IGNORAR NUNCA

1. **JAMÁS hardcodear datos en Python** - siempre usar BD
2. **JAMÁS crear condicionales mock** - usar BD con datos de test
3. **JAMÁS duplicar datos** entre SQL y Python
4. **SIEMPRE que se toque esquema de base de datos reflejar cambios en `init_schema_new_model_database.sql`**
5. **SIEMPRE crear modelo SQLAlchemy para nuevas tablas**
6. **SIEMPRE añadir nuevos datos a `init_seed_new_model_database.sql` primero**

---

#### 🏆 CONCLUSIÓN

IMPORTANTE: esta metodología **NO ES OPCIONAL**. Es el resultado de resolver un problema crítico que amenazaba la escalabilidad del proyecto.

**Toda violación de estos principios debe ser tratada como bug crítico y revertida inmediatamente.**

### Key Takeaways

- ✅ **Database-driven development** is not negotiable
- ✅ **Single source of truth** prevents data chaos
- ✅ **Real test data** prevents mock/reality gaps
- ✅ **Atomic commits** document methodology changes
- ✅ **Critical documentation** prevents future errors

---

## 🔄 FLUJO DE TRABAJO

### 1. **ANÁLISIS INICIAL**

- Para errores: Examinar logs y mensajes de terminal
- Para implementaciones: Entender requisitos y arquitectura actual
- Identificar componentes afectados y dependencias

### 2. **INVESTIGACIÓN**

- Revisar documentación oficial antes de implementar
- Explorar código existente cuando sea necesario
- Verificar convenciones y patrones recomendados

### 3. **PLANIFICACIÓN**

- Tareas específicas y verificables
- Fragmentar complejidad en subtareas
- TodoWrite para tracking si es necesario

### 4. **IMPLEMENTAR CON PRINCIPIOS**

- NO asumir contexto - preguntar cuando sea necesario
- Código comentado para desarrollador nivel medio
- Priorizar claridad sobre velocidad

**💡 NOTA**: Tienes subagentes especializados disponibles para delegar tareas. Como orquestador principal, tú decides cuándo usarlos - cada uno tiene contexto independiente, así que proporciona la información necesaria cuando los invoques.

## 🤖 SUBAGENTES ESPECIALIZADOS - REFERENCIA RÁPIDA

### 📊 INVENTARIO

| Agente                 | Modelo | Especialidad          | Cuándo Usar                                   |
| ---------------------- | ------ | --------------------- | --------------------------------------------- |
| **researcher**         | Sonnet | Documentación técnica | Investigación, best practices, docs oficiales |
| **code-explorer**      | Sonnet | Exploración código    | Mapear arquitectura, buscar definiciones      |
| **error-logs-analyst** | Sonnet | Debug backend         | Analizar logs, errores API, causa raíz        |
| **validator**          | Sonnet | Validación post-fix   | Verificar cambios, detectar regresiones       |
| **ui-tester-console**  | Sonnet | Debug UI técnico      | Console errors, framework issues              |
| **ui-tester**          | Sonnet | Testing UI/UX         | Flows completos, validación visual            |
| **commit-manager**     | Haiku  | Git automation        | Commits estructurados, historial limpio       |

### 🔄 WORKFLOWS TÍPICOS

**Frontend Issue**: `ui-tester-console` → `error-logs-analyst` (si API) → `validator`

**Backend Issue**: `error-logs-analyst` → `ui-tester-console` (reproducir) → `validator`

**Research Task**: `researcher` → `code-explorer` → implementación → `validator`

**Full Development**: `researcher` → `code-explorer` → implementación → `ui-tester` → `validator` → `commit-manager`

### 📋 COMANDOS ORQUESTADORES

- `/debug-orchestrator` - Full-stack debug orchestration with intelligent multi-agent coordination

**💡 Principio**: Los agentes trabajan coordinados. El orquestador principal decide automáticamente cuáles usar según contexto.
