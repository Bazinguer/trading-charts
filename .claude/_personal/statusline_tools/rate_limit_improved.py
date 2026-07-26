#!/usr/bin/env python3
"""
Rate Limit Mejorado - Detección inteligente del estado de Opus
Basado en indicadores reales en lugar de costo (que siempre es 0)
"""

def rate_limit_status_improved(data):
    """
    Estado de disponibilidad de Opus basado en indicadores reales
    🟢 = Disponible libremente
    🟡 = Limitado/precaución  
    🔴 = Agotado/no disponible
    ❓ = Desconocido
    """
    try:
        current_model = data.get('model', {}).get('id', '').lower()
        session_duration_ms = data.get('cost', {}).get('total_duration_ms', 0)
        
        # 1. Si estás usando Opus AHORA = disponible en este momento
        if 'opus' in current_model:
            # Verificar si has estado mucho tiempo en la sesión
            hours = session_duration_ms / (1000 * 60 * 60)
            if hours > 2:  # Más de 2 horas de sesión activa
                return '🟡'  # Precaución - uso prolongado
            else:
                return '🟢'  # Disponible - acabas de empezar o poco uso
        
        # 2. Si estás usando Sonnet/Haiku = posible limitación
        elif 'sonnet' in current_model:
            return '🟡'  # Amarillo - usando Sonnet por alguna razón
        elif 'haiku' in current_model:
            return '🔴'  # Rojo - bajaste a Haiku, Opus probablemente agotado
        
        # 3. Detección por hora del día (rate limits se resetean cada hora)
        from datetime import datetime
        current_hour = datetime.now().hour
        current_minute = datetime.now().minute
        
        # Primeros 10 minutos de cada hora = más probable que esté disponible
        if current_minute < 10:
            return '🟢'
        # Últimos 20 minutos de cada hora = más probable que esté limitado
        elif current_minute > 40:
            return '🟡'
        else:
            return '🟢'  # Por defecto optimista
            
    except Exception:
        pass
    
    return '❓'  # Desconocido

def rate_limit_with_context(data):
    """Versión con contexto adicional"""
    status = rate_limit_status_improved(data)
    current_model = data.get('model', {}).get('id', '').lower()
    
    # Añadir contexto
    if 'opus' in current_model and status == '🟢':
        return f'{status}'  # Verde simple si estás en Opus
    elif 'sonnet' in current_model:
        return f'{status}S'  # Amarillo + S (usando Sonnet)
    elif 'haiku' in current_model:
        return f'{status}H'  # Rojo + H (usando Haiku)
    else:
        return status

# Test con datos de ejemplo
if __name__ == '__main__':
    # Simular datos
    test_data_opus = {
        'model': {'id': 'claude-opus-4-1-20250805'},
        'cost': {'total_duration_ms': 30000}  # 30 segundos
    }
    
    test_data_sonnet = {
        'model': {'id': 'claude-sonnet-4-20250514'},
        'cost': {'total_duration_ms': 1800000}  # 30 minutos
    }
    
    print("Opus (poco uso):", rate_limit_status_improved(test_data_opus))
    print("Sonnet (uso medio):", rate_limit_status_improved(test_data_sonnet))
    print("Con contexto:", rate_limit_with_context(test_data_sonnet))
