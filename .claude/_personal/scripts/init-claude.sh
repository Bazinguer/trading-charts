# init-claude.sh (desde .claude/_personal/scripts/)
#!/bin/bash

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔧 Inicializando Claude Code Workflow...${NC}"

# Cambiar al directorio raíz del proyecto
cd "$(dirname "$0")/../../.." || exit 1

# 1. Verificar que existe .claude
if [ ! -d ".claude" ]; then
    echo "❌ No se encontró directorio .claude"
    exit 1
fi

# 2. Permisos para scripts .claude/_personal/scripts
if [ -d ".claude/_personal/scripts" ]; then
    chmod +x .claude/_personal/scripts/*.sh 2>/dev/null
    count_sh=$(ls -1 .claude/_personal/scripts/*.sh 2>/dev/null | wc -l)
    echo -e "${GREEN}✅ Permisos actualizados para $count_sh scripts${NC}"
fi

# 3. Permisos para hooks
if [ -d ".claude/hooks" ]; then
    chmod +x .claude/hooks/*.py 2>/dev/null
    count_py=$(ls -1 .claude/hooks/*.py 2>/dev/null | wc -l)
    echo -e "${GREEN}✅ Permisos actualizados para $count_py hooks${NC}"
fi

# 3. Permisos para statusline
if [ -d ".claude/statusline" ]; then
    chmod +x .claude/statusline/*.py 2>/dev/null
    count_py=$(ls -1 .claude/statusline/*.py 2>/dev/null | wc -l)
    echo -e "${GREEN}✅ Permisos actualizados para $count_py statusline${NC}"
fi

# 5. Verificar configuración
if [ -f ".claude/settings.json" ]; then
    echo -e "${GREEN}✅ Configuración de claude encontrada${NC}"
else
    echo -e "${YELLOW}⚠️  Falta configuración de claude${NC}"
fi

# 6. Mostrar estado
echo ""
echo -e "${GREEN}📊 ESTADO DEL SISTEMA:${NC}"
echo "  • Scripts ejecutables: $count_sh"
echo "  • Hooks ejecutables: $count_py"
echo "  • Data: $(du -sh .claude/_personal/data 2>/dev/null | cut -f1)"
echo "  • Branch: $(git branch --show-current 2>/dev/null || echo 'no-git')"

# 7. Recordatorio
echo ""
echo -e "${GREEN}# ============================================${NC}"
echo -e "${GREEN}# ARRANQUE DE CLAUDE${NC}"
echo -e "${GREEN}# ============================================${NC}"
echo ""
echo -e "${YELLOW}# === ALIAS BÁSICOS ===${NC}"
echo -e "${GREEN}alias cc='claude'                    			# Atajo rápido${NC}"
echo -e "${GREEN}alias ccd='claude --dangerously-skip-permissions'	# ByPass Mode - total permisos${NC}"
echo -e "${GREEN}alias ccp='claude --plan'            			# Planificar${NC}"
echo -e "${GREEN}alias cca='claude --auto-accept'     			# Auto-aceptar${NC}"
echo -e "${GREEN}alias cch='claude --model haiku'               # Haiku para tareas simples${NC}"
echo -e "${GREEN}alias ccs='claude --model sonnet'              # Sonnet para desarrollo${NC}"
echo -e "${GREEN}alias cco='claude --model opus'                # Opus para complejidad${NC}"
echo -e "${GREEN}alias cc-debug='claude --debug'           		# Debug${NC}"
echo -e "${GREEN}alias cc-here='claude --workspace .'			# Arranque con directorio específico${NC}"
echo ""
echo -e "${YELLOW}# Arranque Modo ByPass con modelo específico${NC}"
echo -e "${GREEN}alias ccd-sonnet='claude --dangerously-skip-permissions --model sonnet'${NC}"
echo -e "${GREEN}alias ccd-opus='claude --dangerously-skip-permissions --model opus'${NC}"
echo ""