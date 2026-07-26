#!/usr/bin/env python3
"""
Debug script para statusline - Ver qué datos llegan desde Claude Code
"""
import json
import sys
import os
from datetime import datetime

# Crear log file
log_file = '/tmp/statusline_debug.log'

try:
    # Leer datos desde stdin
    input_data = sys.stdin.read()
    
    with open(log_file, 'a') as f:
        f.write(f"\n=== DEBUG {datetime.now()} ===\n")
        f.write(f"Raw input: {repr(input_data)}\n")
        
        if input_data.strip():
            try:
                data = json.loads(input_data)
                f.write(f"Parsed JSON: {json.dumps(data, indent=2)}\n")
                
                # Verificar campos específicos
                f.write("\n--- CAMPOS CLAVE ---\n")
                f.write(f"model: {data.get('model', 'NO FOUND')}\n")
                f.write(f"usage: {data.get('usage', 'NO FOUND')}\n")
                f.write(f"session: {data.get('session', 'NO FOUND')}\n")
                f.write(f"workspace: {data.get('workspace', 'NO FOUND')}\n")
                f.write(f"output_style: {data.get('output_style', 'NO FOUND')}\n")
                
            except json.JSONDecodeError as e:
                f.write(f"JSON Parse Error: {e}\n")
                data = {}
        else:
            f.write("EMPTY INPUT - No data from Claude Code\n")
            data = {}
            
except Exception as e:
    with open(log_file, 'a') as f:
        f.write(f"SCRIPT ERROR: {e}\n")
    data = {}

# Fallback statusline simple
model_name = data.get('model', {}).get('display_name', 'Debug Mode')
print(f"🐛 {model_name} | 📝 Log: {log_file}")