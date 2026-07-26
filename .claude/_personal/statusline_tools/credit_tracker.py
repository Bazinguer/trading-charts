#!/usr/bin/env python3
"""
Claude Code Credit Tracker - Estima tiempo hasta renovación de créditos
Basado en patrones de uso y ciclos de facturación típicos
"""
import json
import sys
from datetime import datetime, timedelta
from pathlib import Path

def estimate_credit_renewal():
    """Estima cuándo se renovarán los créditos basado en uso actual"""
    
    # Cargar datos de sesión actual
    try:
        data = json.load(sys.stdin)
        current_cost = data.get('cost', {}).get('total_cost_usd', 0)
        session_duration_ms = data.get('cost', {}).get('total_duration_ms', 0)
        model_id = data.get('model', {}).get('id', '')
    except:
        return "No data available"
    
    # Estimaciones de límites por plan (USD por mes)
    PLAN_LIMITS = {
        'basic': 5.00,      # Plan básico
        'pro': 20.00,       # Plan Pro
        'team': 35.00,      # Plan Team
        'enterprise': 100.00 # Plan Enterprise
    }
    
    # Detectar plan aproximado basado en modelo usado
    if 'opus' in model_id.lower():
        estimated_plan_limit = PLAN_LIMITS['pro']  # Solo Pro+ puede usar Opus frecuentemente
        plan_name = "Pro"
    else:
        estimated_plan_limit = PLAN_LIMITS['basic']  # Conservativo
        plan_name = "Basic/Pro"
    
    # Cálculos de renovación
    usage_percentage = (current_cost / estimated_plan_limit) * 100
    
    # Estimar días hasta renovación (asumiendo ciclo de 30 días)
    # Esto es una estimación - el ciclo real depende de la fecha de suscripción
    current_day = datetime.now().day
    days_in_month = 30  # Simplificado
    days_until_renewal = days_in_month - current_day
    
    if days_until_renewal <= 0:
        days_until_renewal = days_in_month + days_until_renewal
    
    return {
        'current_cost': current_cost,
        'estimated_limit': estimated_plan_limit,
        'usage_percentage': usage_percentage,
        'days_until_renewal': days_until_renewal,
        'plan_name': plan_name,
        'status': 'healthy' if usage_percentage < 50 else 'warning' if usage_percentage < 80 else 'critical'
    }

def format_credit_info(info):
    """Formatea información de créditos para statusline"""
    if isinstance(info, str):
        return info
    
    status_icons = {
        'healthy': '🟢',
        'warning': '🟡', 
        'critical': '🔴'
    }
    
    icon = status_icons.get(info['status'], '⚪')
    percentage = info['usage_percentage']
    days = info['days_until_renewal']
    
    return f"{icon} {percentage:.1f}% ({days}d)"

if __name__ == '__main__':
    credit_info = estimate_credit_renewal()
    formatted = format_credit_info(credit_info)
    print(f"💳 {formatted}")