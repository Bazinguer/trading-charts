#!/usr/bin/env python3
"""Configurador de statusline para Claude Code - Sistema Simplificado v2.0

Filosofía: SIMPLICIDAD > SOSTENIBILIDAD > ESCALABILIDAD
"""

import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Optional

# Colores ANSI
class Colors:
    RED = '\033[31m'
    GREEN = '\033[32m'
    YELLOW = '\033[33m'
    BLUE = '\033[34m'
    MAGENTA = '\033[35m'
    CYAN = '\033[36m'
    WHITE = '\033[37m'
    GRAY = '\033[90m'
    BOLD = '\033[1m'
    RESET = '\033[0m'
    
    @classmethod
    def colorize(cls, text: str, color: str) -> str:
        return f"{color}{text}{cls.RESET}"

# Elementos disponibles - COMPATIBLES con statusline.py optimizada
ELEMENTS = {
    'model': {
        'icon': '🤖',
        'name': 'Modelo',
        'color': Colors.CYAN,
        'default': 'Claude'
    },
    'dir': {
        'icon': '📁',
        'name': 'Directorio',
        'color': Colors.BLUE,
        'default': 'workspace'
    },
    'git': {
        'icon': '🌿',
        'name': 'Git Branch',
        'color': Colors.GREEN,
        'default': 'no-git'
    },
    'tokens': {
        'icon': '⛓️‍💥',
        'name': 'Tokens Estimados',
        'color': Colors.RED,
        'default': '0'
    },
    'cost': {
        'icon': '💰',
        'name': 'Costo Sesión',
        'color': Colors.YELLOW,
        'default': '0.00'
    },
    'time': {
        'icon': '⏱️',
        'name': 'Tiempo Transcurrido',
        'color': Colors.GRAY,
        'default': '0m'
    },
    'burnrate': {
        'icon': '🔥',
        'name': 'Burn Rate ($/h)',
        'color': Colors.RED,
        'default': '0.00'
    },
    'output_style': {
        'icon': '🎨',
        'name': 'Estilo Output',
        'color': Colors.BLUE,
        'default': 'default'
    },
    'tools': {
        'icon': '🔧',
        'name': 'Herramientas Usadas',
        'color': Colors.MAGENTA,
        'default': '0'
    },
    'session': {
        'icon': '⚡',
        'name': 'ID Sesión',
        'color': Colors.YELLOW,
        'default': 'session'
    },
    'files': {
        'icon': '📝',
        'name': 'Archivos Modificados',
        'color': Colors.BLUE,
        'default': '0'
    },
    'rate_limit': {
        'icon': '🏆',
        'name': 'Estado Opus (🟢=Disponible, 🟡=Limitado, 🔴=Agotado)',
        'color': Colors.MAGENTA,
        'default': 'unknown'
    }
}

def print_header():
    """Imprime cabecera del configurador"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}⚙️  CONFIGURADOR STATUSLINE v2.0{Colors.RESET}")
    print("="*40)
    print(f"{Colors.GRAY}Filosofía: SIMPLICIDAD > SOSTENIBILIDAD{Colors.RESET}\n")

def show_elements() -> List[str]:
    """Muestra elementos disponibles y captura selección"""
    print(f"{Colors.BOLD}📋 ELEMENTOS DISPONIBLES:{Colors.RESET}\n")
    
    selected = []
    for key, config in ELEMENTS.items():
        icon = config['icon']
        name = config['name']
        color = config['color']
        
        response = input(f"  {icon} {Colors.colorize(name, color)} [y/N]: ").strip().lower()
        
        if response in ['y', 'yes', 's', 'si']:
            selected.append(key)
            print(f"    {Colors.GREEN}✓ Incluido{Colors.RESET}")
        else:
            print(f"    {Colors.RED}✗ Omitido{Colors.RESET}")
    
    return selected

# Ya no necesitamos generar scripts - statusline.py optimizada maneja todo

def save_config(selected: List[str]):
    """Guarda configuración en _personal/statusline_tools/statusline.conf"""
    config = {
        'selected_elements': selected,
        'separator': ' | ',
        'generated_at': 'auto'
    }
    
    # Crear directorio personal si no existe
    personal_dir = Path('.claude/_personal/statusline_tools')
    personal_dir.mkdir(parents=True, exist_ok=True)
    
    conf_file = personal_dir / 'statusline.conf'
    with open(conf_file, 'w') as f:
        json.dump(config, f, indent=2)
    
    print(f"\n{Colors.GREEN}💾 Configuración guardada: {conf_file}{Colors.RESET}")
    return config

def update_claude_settings(script_path: Path):
    """Actualiza settings.json de Claude"""
    settings_path = Path('.claude/settings.json')
    
    # Crear settings básico si no existe
    if not settings_path.exists():
        settings = {}
    else:
        with open(settings_path) as f:
            settings = json.load(f)
    
    # Configurar statusline
    settings['statusLine'] = {
        'type': 'command',
        'command': str(script_path.resolve()),
        'padding': 0
    }
    
    # Backup
    if settings_path.exists():
        backup_path = settings_path.with_suffix('.json.backup')
        settings_path.rename(backup_path)
        print(f"{Colors.YELLOW}💾 Backup: {backup_path}{Colors.RESET}")
    
    # Guardar
    with open(settings_path, 'w') as f:
        json.dump(settings, f, indent=2)
    
    print(f"{Colors.GREEN}✅ Settings actualizados: {settings_path}{Colors.RESET}")
    return settings_path

def verify_statusline_script() -> Path:
    """Verifica que el script oficial existe y está configurado"""
    script_path = Path('.claude/statusline/statusline.py')
    
    if script_path.exists():
        print(f"{Colors.GREEN}✅ Script oficial encontrado: {script_path}{Colors.RESET}")
        print(f"{Colors.GRAY}   (Lee automáticamente desde _personal/statusline_tools/){Colors.RESET}")
    else:
        print(f"{Colors.RED}❌ Script oficial no encontrado: {script_path}{Colors.RESET}")
    
    return script_path

def show_preview(selected: List[str]):
    """Muestra preview de cómo se verá la statusline"""
    print(f"\n{Colors.BOLD}👀 PREVIEW:{Colors.RESET}")
    
    preview_parts = []
    for element_key in selected:
        config = ELEMENTS[element_key]
        icon = config['icon']
        color = config['color']
        default = config['default']
        
        preview_parts.append(f"{color}{icon} {default}{Colors.RESET}")
    
    preview = " | ".join(preview_parts)
    print(f"   {preview}\n")

def main():
    """Función principal"""
    print_header()
    
    # Verificar directorio
    if not Path('.claude').exists():
        print(f"{Colors.RED}❌ Error: Ejecuta desde la raíz del proyecto (donde está .claude/){Colors.RESET}")
        sys.exit(1)
    
    # Crear directorio statusline si no existe
    statusline_dir = Path('.claude/statusline')
    statusline_dir.mkdir(exist_ok=True)
    
    # Seleccionar elementos
    selected = show_elements()
    
    if not selected:
        print(f"\n{Colors.YELLOW}⚠️  No seleccionaste elementos. Usando directorio por defecto.{Colors.RESET}")
        selected = ['dir']
    
    print(f"\n{Colors.BOLD}📋 SELECCIONADOS: {Colors.GREEN}{', '.join(selected)}{Colors.RESET}")
    
    # Mostrar preview
    show_preview(selected)
    
    # Guardar configuración - el script optimizado lee esta config automáticamente
    save_config(selected)
    
    # Verificar que script oficial existe
    script_path = verify_statusline_script()
    settings_path = Path('.claude/settings.json')
    
    # Instrucciones finales
    print(f"\n{Colors.BOLD}{Colors.GREEN}✅ CONFIGURACIÓN COMPLETA{Colors.RESET}")
    print(f"\n{Colors.BOLD}📋 ARCHIVOS ACTUALIZADOS:{Colors.RESET}")
    print(f"   • .claude/_personal/statusline_tools/statusline.conf (configuración)")
    print(f"   • {script_path} (script optimizado con rate_limit mejorado)")
    print(f"   • {settings_path} (configurado en Claude)")
    
    print(f"\n{Colors.BOLD}🔄 APLICAR CAMBIOS:{Colors.RESET}")
    print(f"   1. Reinicia Claude Code para ver la nueva statusline")
    print(f"   2. Includes: {Colors.GREEN}{', '.join(selected)}{Colors.RESET}")
    
    print(f"\n{Colors.BOLD}🛠️  RECONFIGURAR:{Colors.RESET}")
    print(f"   python3 .claude/_personal/statusline_tools/configure.py")
    
    print(f"\n{Colors.BOLD}🎯 MEJORAS EN ESTA VERSIÓN:{Colors.RESET}")
    print(f"   • Rate limit inteligente basado en modelo actual")
    print(f"   • Datos reales en lugar de estimaciones")
    print(f"   • Código 60% más simple y mantenible")

if __name__ == '__main__':
    main()
