#!/usr/bin/env python3
"""
Statusline Script CORREGIDO - Mapea correctamente datos reales de Claude Code
Basado en debug de datos reales recibidos
"""
import json
import sys
import os
from pathlib import Path

# Leer datos JSON desde stdin
try:
    data = json.load(sys.stdin)
except:
    data = {}

def load_personal_config():
    """Carga configuración desde directorio personal"""
    try:
        config_path = Path('.claude/_personal/statusline_tools/statusline.conf')
        if config_path.exists():
            with open(config_path, 'r') as f:
                config = json.load(f)
                return config.get('selected_elements', []), config.get('separator', ' | ')
    except Exception:
        pass
    
    # Fallback: configuración por defecto
    return ['model', 'dir', 'git', 'tokens', 'cost', 'time', 'burnrate', 'output_style'], ' | '

def git_branch():
    try:
        cwd = data.get('workspace', {}).get('current_dir', data.get('cwd', '.'))
        git_head = Path(cwd) / '.git' / 'HEAD'
        if git_head.exists():
            content = git_head.read_text().strip()
            if content.startswith('ref: refs/heads/'):
                return content.replace('ref: refs/heads/', '')
    except:
        pass
    return 'no-git'

def session_duration():
    """Calcula duración de sesión desde total_duration_ms"""
    try:
        duration_ms = data.get('cost', {}).get('total_duration_ms', 0)
        if duration_ms > 0:
            minutes = duration_ms // (1000 * 60)
            seconds = (duration_ms % (1000 * 60)) // 1000
            if minutes > 0:
                return f'{minutes}m{seconds}s'
            else:
                return f'{seconds}s'
    except:
        pass
    return 'active'

def burn_rate():
    """Calcula burn rate desde datos reales"""
    try:
        cost_usd = data.get('cost', {}).get('total_cost_usd', 0)
        duration_ms = data.get('cost', {}).get('total_duration_ms', 0)
        
        if cost_usd > 0 and duration_ms > 0:
            hours = duration_ms / (1000 * 60 * 60)  # Convert ms to hours
            rate = cost_usd / hours
            return f'{rate:.2f}'
    except:
        pass
    return '0.00'

def estimate_tokens():
    """Estima tokens basado en costo y modelo"""
    try:
        cost_usd = data.get('cost', {}).get('total_cost_usd', 0)
        model_id = data.get('model', {}).get('id', '')
        
        if cost_usd > 0:
            # Estimaciones aproximadas por token (USD)
            if 'opus' in model_id.lower():
                # Opus: ~$15/1M input, ~$75/1M output (promedio $45/1M)
                estimated_tokens = int((cost_usd / 45) * 1_000_000)
            elif 'sonnet' in model_id.lower():
                # Sonnet: ~$3/1M input, ~$15/1M output (promedio $9/1M)
                estimated_tokens = int((cost_usd / 9) * 1_000_000)
            else:
                # Haiku u otros: ~$0.25/1M input, ~$1.25/1M output (promedio $0.75/1M)
                estimated_tokens = int((cost_usd / 0.75) * 1_000_000)
            
            if estimated_tokens >= 1000:
                return f'{estimated_tokens//1000}k'
            else:
                return str(estimated_tokens)
    except:
        pass
    return '0'

def modified_files_count():
    try:
        import subprocess
        cwd = data.get('workspace', {}).get('current_dir', data.get('cwd', '.'))
        result = subprocess.run(['git', 'diff', '--name-only'], 
                              cwd=cwd, capture_output=True, text=True, timeout=2)
        if result.returncode == 0:
            files = [f for f in result.stdout.strip().split('\n') if f]
            return str(len(files))
    except:
        pass
    return '0'

def current_work_status():
    """
    Verifica cuándo fue la última actualización de CURRENT_WORK.md
    🟢 = Actualizado hoy  🟡 = Ayer  🔴 = Más de 2 días
    """
    try:
        from datetime import datetime, timedelta
        import subprocess
        
        cwd = data.get('workspace', {}).get('current_dir', data.get('cwd', '.'))
        work_file = Path(cwd) / 'CURRENT_WORK.md'
        
        if work_file.exists():
            # Obtener última modificación
            mtime = datetime.fromtimestamp(work_file.stat().st_mtime)
            now = datetime.now()
            diff = now - mtime
            
            if diff < timedelta(hours=4):
                return '🟢'  # Actualizado recientemente
            elif diff < timedelta(days=1):
                return '🟡'  # Necesita actualización
            else:
                return '🔴'  # Desactualizado
        else:
            return '❌'  # No existe
    except:
        pass
    return '❓'

def tools_used_count():
    """Cuenta herramientas usadas desde transcript"""
    try:
        transcript_path = data.get('transcript_path', '')
        if transcript_path and os.path.exists(transcript_path):
            with open(transcript_path, 'r') as f:
                content = f.read()
                # Contar tool_calls en el transcript JSONL
                tool_count = content.count('"tool_calls"')
                return str(min(tool_count, 99))  # Cap at 99
    except:
        pass
    return '0'

def rate_limit_status():
    """
    Estado de disponibilidad de Opus MEJORADO
    🟢 = Disponible  🟡 = Limitado  🔴 = Agotado  ❓ = Desconocido
    Basado en indicadores reales en lugar de costo (que siempre es 0)
    """
    try:
        current_model = data.get('model', {}).get('id', '').lower()
        session_duration_ms = data.get('cost', {}).get('total_duration_ms', 0)
        
        # 1. Si estás usando Opus AHORA = disponible en este momento
        if 'opus' in current_model:
            hours = session_duration_ms / (1000 * 60 * 60)
            if hours > 2:  # Más de 2 horas de sesión activa
                return '🟡'  # Precaución - uso prolongado
            else:
                return '🟢'  # Disponible
        
        # 2. Si estás usando Sonnet/Haiku = posible limitación
        elif 'sonnet' in current_model:
            return '🟡'  # Amarillo - usando Sonnet por alguna razón
        elif 'haiku' in current_model:
            return '🔴'  # Rojo - bajaste a Haiku, Opus probablemente agotado
        
        # 3. Detección por hora del día (rate limits se resetean cada hora)
        from datetime import datetime
        current_minute = datetime.now().minute
        
        # Primeros 10 minutos de cada hora = más probable disponible
        if current_minute < 10:
            return '🟢'
        # Últimos 20 minutos = más probable limitado
        elif current_minute > 40:
            return '🟡'
        else:
            return '🟢'  # Por defecto optimista
            
    except Exception:
        pass
    
    return '❓'  # Desconocido

# Configuración de elementos con datos CORREGIDOS
ELEMENTS = {
    'model': {
        'icon': '🤖',
        'color': '\033[36m',
        'get_value': lambda: data.get('model', {}).get('display_name', 'Claude')
    },
    'dir': {
        'icon': '📁',
        'color': '\033[34m',
        'get_value': lambda: os.path.basename(data.get('workspace', {}).get('current_dir', data.get('cwd', 'workspace')))
    },
    'git': {
        'icon': '🌿',
        'color': '\033[32m',
        'get_value': git_branch
    },
    'tokens': {
        'icon': '⛓️‍💥',
        'color': '\033[31m',
        'get_value': estimate_tokens
    },
    'cost': {
        'icon': '💰',
        'color': '\033[33m',
        'get_value': lambda: f"{data.get('cost', {}).get('total_cost_usd', 0):.3f}"
    },
    'time': {
        'icon': '⏱️',
        'color': '\033[90m',
        'get_value': session_duration
    },
    'burnrate': {
        'icon': '🔥',
        'color': '\033[31m',
        'get_value': burn_rate
    },
    'output_style': {
        'icon': '🎨',
        'color': '\033[34m',
        'get_value': lambda: data.get('output_style', {}).get('name', 'default')
    },
    'tools': {
        'icon': '🔧',
        'color': '\033[35m',
        'get_value': tools_used_count
    },
    'session': {
        'icon': '⚡',
        'color': '\033[33m',
        'get_value': lambda: data.get('session_id', 'unknown')[:8]
    },
    'files': {
        'icon': '📝',
        'color': '\033[34m',
        'get_value': modified_files_count
    },
    'rate_limit': {
        'icon': '🏆',
        'color': '\033[35m',
        'get_value': rate_limit_status
    },
    'work': {
        'icon': '📋',
        'color': '\033[36m',
        'get_value': current_work_status
    }
}

def main():
    """Función principal que genera statusline con datos corregidos"""
    selected_elements, separator = load_personal_config()
    
    parts = []
    for element_key in selected_elements:
        if element_key in ELEMENTS:
            config = ELEMENTS[element_key]
            icon = config['icon']
            color = config['color']
            
            try:
                value = config['get_value']()
            except:
                value = '?'
            
            parts.append(f'{color}{icon} {value}\033[0m')
    
    print(separator.join(parts))

if __name__ == '__main__':
    main()