import eel
import pandas as pd
import csv
import os
import json
import sys

# Funcion para encontrar la ruta de los archivos cuando es un EXE
def resource_path(relative_path):
    if hasattr(sys, '_MEIPASS'):
        return os.path.join(sys._MEIPASS, relative_path)
    return os.path.join(os.path.abspath("."), relative_path)

eel.init(resource_path('web'))

@eel.expose
def process_csv_content(content):
    try:
        from io import StringIO
        f = StringIO(content)
        reader = csv.reader(f)
        lines = list(reader)

        data = {
            "project": "",
            "date_range": "",
            "summary": {},
            "sections": {}
        }

        current_section = "General"
        data["sections"][current_section] = {"headers": [], "rows": []}
        
        for i, line in enumerate(lines):
            if not line or all(not cell for cell in line): continue
            
            # Nos saltamos la metadata basica
            if line[0] in ["Nombre del proyecto", "Intervalo de fechas"]:
                if len(line) > 1:
                    key = "project" if line[0] == "Nombre del proyecto" else "date_range"
                    data[key] = line[1]
                continue

            # Buscamos los headers de cada seccion
            if line[0] == "Métricas":
                current_section = line[1]
                data["sections"][current_section] = {
                    "headers": line[2:] if len(line) > 2 else [],
                    "rows": []
                }
                continue

            # Aqui leemos las filas
            label = ""
            values = []
            
            # Caso 1: Fila con sangria (Vacio, Etiqueta, Valor...)
            if line[0] == "" and len(line) > 1:
                label = line[1]
                values = line[2:]
            # Caso 2: Fila sin sangria (Etiqueta, Valor...)
            else:
                label = line[0]
                values = line[1:]

            if label or values:
                data["sections"][current_section]["rows"].append({
                    "label": label,
                    "values": [v for v in values if v] # Quitamos valores vacios al final
                })

        # Sincronizamos con el resumen
        for sec_name, sec_data in data["sections"].items():
            for row in sec_data["rows"]:
                if row["label"] and row["values"]:
                    data["summary"][row["label"]] = row["values"][0]

        return data
    except Exception as e:
        print(f"Parser Error: {e}")
        return {"error": str(e)}

@eel.expose
def list_csv_files():
    files = [f for f in os.listdir('.') if f.endswith('.csv')]
    return files

if __name__ == "__main__":
    # Configuracion para que se vea como una Ventana de App Independiente (Portable feel)
    # Eel intentara usar Chrome o Edge en modo 'app' (sin barras de navegacion)
    # Esto usa el motor del navegador que ya tenga el usuario (mas ligero)
    start_args = {
        'mode': 'chrome', # Intenta Chrome/Edge/Brave en modo ventana de App
        'size': (1280, 800),
        'host': 'localhost',
        'port': 0 
    }

    try:
        eel.start('index.html', **start_args)
    except (SystemExit, KeyboardInterrupt):
        pass
    except Exception:
        # Si por algun motivo falla el modo App, abre una pestaña normal
        try:
            eel.start('index.html', mode='default', size=(1280, 800))
        except:
            pass
