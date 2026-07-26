# 📋 Work Status Indicator - Statusline

## Descripción

Se ha añadido un indicador visual en el statusline de Claude Code que muestra el estado de actualización del archivo `CURRENT_WORK.md`.

## Indicadores

- **📋 🟢** - Actualizado hace menos de 4 horas (¡Bien!)
- **📋 🟡** - Actualizado hace menos de 1 día (Considera actualizar)
- **📋 🔴** - Más de 1 día sin actualizar (¡Actualiza ya!)
- **📋 ❌** - El archivo no existe (Créalo)
- **📋 ❓** - Error al verificar

## Ubicación en Statusline

El indicador aparece después del branch de git:
```
🤖 Opus 4.1 | 📁 jombotix-chat-bot | 🌿 main | 📋 🟢 | ⛓️‍💥 15k | ...
```

## Configuración

Si quieres cambiar la posición o remover el indicador:

1. Editar: `.claude/_personal/statusline_tools/statusline.conf`
2. Mover o quitar `"work"` de `selected_elements`

## Lógica de Actualización

El indicador te recordará visualmente:
- Durante una sesión activa si no has actualizado en horas
- Al empezar una nueva sesión si el trabajo está desactualizado
- Si estás haciendo cambios significativos sin documentar

## Beneficios

1. **Recordatorio Visual Constante** - Siempre visible en el statusline
2. **No Intrusivo** - Solo un emoji de color, no mensajes molestos
3. **Contextual** - Solo relevante cuando trabajas en el proyecto
4. **Rápida Verificación** - Un vistazo te dice si necesitas actualizar

## Personalización

Para cambiar los umbrales de tiempo, edita en `statusline.py`:

```python
if diff < timedelta(hours=4):      # Verde
elif diff < timedelta(days=1):     # Amarillo
else:                               # Rojo
```