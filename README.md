# 📊 Clarity Analyzer Pro v1.0.0

![Clarity Analyzer Banner](https://img.shields.io/badge/Clarity_Analyzer-Professional_Edition-blue?style=for-the-badge&logo=python&logoColor=white)

> **Una suite de análisis local de alta fidelidad para reportes de Microsoft Clarity.** Transforma tus archivos CSV en un Dashboard interactivo con diseño premium, manteniendo tus datos 100% privados y en tu control.

---

## ⚡ Descarga Rápida (Recomendado)

Si solo quieres usar la herramienta sin configurar código, descarga la versión **Portable EXE**:

1. Ve a la sección de **[Releases](https://github.com/KevinGil12C/clarity_analizer/releases)** de este repositorio.
2. Descarga el archivo `ClarityAnalyzer.exe`.
3. ¡Doble clic y listo! Sin instalaciones, sin Python, 100% independiente.

---

## ✨ Características Principales

| Característica | Descripción | Impacto |
| :--- | :--- | :--- |
| 🛡️ **Privacidad Total** | Procesamiento 100% local mediante Python. | No hay riesgo de intercepción de datos. |
| 🎨 **UI Glassmorphism** | Interfaz moderna, oscura y con micro-animaciones. | Navegación intuitiva y profesional. |
| 📈 **Gráficos Dinámicos** | Visualización automática de Audiencia y Contenido. | Análisis visual inmediato. |
| 🔍 **Explorador Pro** | Búsqueda global y por sección con filtros avanzados. | Localización rápida de métricas clave. |
| 🚀 **Modo App Portable** | Ejecutable único que usa el motor del navegador nativo. | Sin instalaciones, rápido y ligero. |

---

## 🏗️ Arquitectura del Proyecto

El proyecto utiliza una arquitectura de puente (**Bridge Architecture**) para conectar la potencia de análisis de datos de Python con la flexibilidad estética de las tecnologías web modernas.

- **Backend:** Python 3.12 + Pandas (Análisis de datos eficiente).
- **Frontend:** HTML5, CSS3 (Tailwind CSS) + JavaScript ES6.
- **Comunicación:** Protocolo local vía [Eel](https://github.com/python-eel/Eel).
- **Visualización:** Chart.js para renderizado de alto rendimiento.

---

## 🛠️ Instalación y Configuración

### Requisitos Previos
- Python 3.10 o superior instalado.
- Dependencias listadas en `requirements.txt`.

### Configuración para Desarrollo
1. Clona este repositorio o descarga el código.
2. Crea un entorno virtual (recomendado):
   ```bash
   python -m venv venv
   source venv/bin/activate  # En Windows: venv\Scripts\activate
   ```
3. Instala las dependencias necesarias:
   ```bash
   pip install -r requirements.txt
   ```
4. Inicia la aplicación:
   ```bash
   python main.py
   ```

---

## 📦 Distribución y Compilación (EXE)

Para generar tu propia versión portable de la aplicación, utilizamos **PyInstaller**. Ejecuta el siguiente comando para empaquetar todo un un solo archivo:

```bash
pyinstaller --noconfirm --onefile --windowed --add-data "web;web" --name "ClarityAnalyzer" main.py
```

- El ejecutable final se generará en la carpeta `/dist`.
- La aplicación detectará automáticamente tu navegador por defecto para una ejecución optimizada.

---

## 📋 Secciones del Dashboard

- **Resumen:** Estadísticas generales (Sesiones, Usuarios, Scroll, Rendimiento).
- **Audiencia:** Segmentación por País, Dispositivos, SO y Navegadores.
- **Contenido:** Análisis profundo de URLs, Popularidad y Rendimiento técnico (LCP/INP).
- **Técnico:** Registro de errores JS, tráfico de Bots y Core Web Vitals.
- **Explorador CSV:** Tabla maestra con búsqueda granular y paginación en cada bloque de datos.

---

## 🤵 El Desarrollador

**Kevin Jesús Coyote Gil**  
*Front-end & Full Stack Developer*

![Badge Verificado](https://img.shields.io/badge/Verificado-Toluca,_México-green?style=flat-square) ![Badge Zona Horaria](https://img.shields.io/badge/Zona_Horaria-GMT--6-orange?style=flat-square)

- 🌐 [Portafolio Profesional](https://kevscl-dev.vercel.app/)
- 💬 WhatsApp Directo: [+52 722 159 5250](https://wa.me/5217221595250)
- 📧 Email Contacto: [kebo.jcg77@gmail.com](mailto:kebo.jcg77@gmail.com)

---

## 🔒 Privacidad y Seguridad

Este proyecto fue creado bajo la filosofía de **"User Controlled Data"**. Ninguna información leída de los archivos CSV sale de tu máquina. El servidor local solo existe mientras la aplicación está abierta y el puerto se asigna dinámicamente para mayor seguridad.

---

## 📄 Licencia

Este proyecto está bajo la Licencia **MIT**. Puedes usarlo, modificarlo y distribuirlo libremente.

---

*Hecho con ❤️ para la comunidad de analística y desarrollo web.*
