# 📚 DOCUMENTACIÓN TÉCNICA - CHATBOT INGE LEAN S.A.S.

<div align="center">
  <img src="https://ingelean.com/wp-content/uploads/2022/12/LOGO-INGE-LEAN.png" alt="Logo INGE LEAN S.A.S." width="300px">
  <h3>Asistente Virtual Inteligente con Análisis Avanzado</h3>
  <p><em>Hackaton 2025 - Talento Tech</em></p>
</div>

## 📋 Tabla de Contenidos

- [📚 DOCUMENTACIÓN TÉCNICA - CHATBOT INGE LEAN S.A.S.](#-documentación-técnica---chatbot-inge-lean-sas)
  - [📋 Tabla de Contenidos](#-tabla-de-contenidos)
  - [🚀 Descripción General](#-descripción-general)
  - [🛠️ Arquitectura del Sistema](#️-arquitectura-del-sistema)
  - [💻 Componentes Principales](#-componentes-principales)
    - [1. Bot de Telegram](#1-bot-de-telegram)
    - [2. Integración con IA (Google Gemini)](#2-integración-con-ia-google-gemini)
    - [3. Web Scraping Inteligente](#3-web-scraping-inteligente)
    - [4. Sistema de Análisis Avanzado](#4-sistema-de-análisis-avanzado)
    - [5. Dashboard de Analytics](#5-dashboard-de-analytics)
  - [🔧 Tecnologías Utilizadas](#-tecnologías-utilizadas)
  - [📊 Características y Funcionalidades](#-características-y-funcionalidades)
  - [📱 Guía de Uso](#-guía-de-uso)
  - [📈 Métricas y Análisis](#-métricas-y-análisis)
  - [🔒 Seguridad Implementada](#-seguridad-implementada)
  - [🚀 Instrucciones de Despliegue](#-instrucciones-de-despliegue)
  - [🔄 Escalabilidad y Mejoras Futuras](#-escalabilidad-y-mejoras-futuras)

## 🚀 Descripción General

El Chatbot INGE LEAN S.A.S. es una solución de asistencia virtual desarrollada para la empresa INGE LEAN S.A.S., una compañía colombiana especializada en desarrollo de software a medida, automatización industrial, diseño de hardware, mantenimiento técnico e inteligencia artificial aplicada.

Este sistema integra múltiples tecnologías avanzadas para ofrecer una experiencia de usuario superior:

- **Plataforma Telegram**: Interfaz conversacional accesible desde cualquier dispositivo
- **Inteligencia Artificial**: Respuestas generadas por Google Gemini 2.0 Flash
- **Web Scraping en Tiempo Real**: Información siempre actualizada de la web corporativa
- **Análisis de Sentimiento**: Detección de emociones y necesidades del usuario
- **Dashboard Analítico**: Visualización de métricas de uso e interacción

El proyecto ha sido desarrollado como parte del Hackaton Talento Tech 2025, cumpliendo con altos estándares de calidad, rendimiento y seguridad.

## 🛠️ Arquitectura del Sistema

La arquitectura del sistema sigue un modelo modular, con los siguientes componentes interconectados:

```
┌───────────────────┐      ┌───────────────────┐      ┌───────────────────┐
│                   │      │                   │      │                   │
│  Cliente Telegram ├─────►│  Servidor Express ├─────►│   API Gemini IA   │
│                   │      │                   │      │                   │
└───────────────────┘      └─────────┬─────────┘      └───────────────────┘
                                     │
                           ┌─────────▼─────────┐
                           │                   │
                           │  Web Scraper      │───► ingelean.com
                           │                   │
                           └─────────┬─────────┘
                                     │
                           ┌─────────▼─────────┐      ┌───────────────────┐
                           │                   │      │                   │
                           │  Módulo Analytics ├─────►│    Dashboard      │
                           │                   │      │                   │
                           └───────────────────┘      └───────────────────┘
```

## 💻 Componentes Principales

### 1. Bot de Telegram

**Ubicación**: `src/Telegram/Bot.js`

El núcleo del sistema es un bot de Telegram implementado con la librería `node-telegram-bot-api`. Este componente:

- Gestiona la recepción y envío de mensajes
- Mantiene un sistema de sesiones para cada usuario
- Procesa comandos específicos (`/start`, `/servicios`, etc.)
- Integra capacidades de respuesta avanzada con IA
- Maneja la división de mensajes largos (>4000 caracteres)
- Implementa manejo de errores robusto

**Características destacadas**:
- Sistema de caché para datos scrapeados
- Procesamiento asíncrono de mensajes
- Registro detallado de eventos (logging)
- Manejo de conversaciones multiturno

### 2. Integración con IA (Google Gemini)

**Ubicación**: `src/IA/gemini.js`

La integración con Google Gemini proporciona capacidades avanzadas de procesamiento de lenguaje natural:

- Utiliza el modelo `gemini-2.0-flash` para respuestas rápidas y precisas
- Enriquece los prompts con datos del sitio web cuando es relevante
- Implementa mecanismos de truncado para gestionar límites de tokens
- Aplica estrategias de prompt engineering optimizadas

**Ejemplo de prompt mejorado**:
```javascript
// Enriquecimiento de prompt con datos del sitio web
if (websiteData && prompt.toLowerCase().includes('empresa')) {
  enhancedPrompt += `\n\nInformación actualizada del sitio web (ingelean.com):\n`;
  enhancedPrompt += `Descripción: ${truncateText(websiteData.description)}\n\n`;
  // Añadir datos adicionales relevantes...
}
```

### 3. Web Scraping Inteligente

**Ubicación**: `src/utils/WebScraper.js`

El sistema incluye capacidades avanzadas de web scraping para mantener la información actualizada:

- Extrae datos dinámicamente de https://ingelean.com/
- Analiza y estructura la información en categorías (servicios, contacto, etc.)
- Limpia y procesa el contenido HTML para obtener texto relevante
- Implementa búsqueda contextual en los datos extraídos
- Gestiona errores de conexión y parsing

**Métodos principales**:
- `scrapIngeleanWebsite()`: Extrae y estructura datos del sitio
- `searchInScrapedData()`: Busca información específica en los datos extraídos
- `truncateResponse()`: Adapta respuestas a los límites de Telegram

### 4. Sistema de Análisis Avanzado

**Ubicación**: `src/Analytics/analytics.js`

El módulo de analytics proporciona capacidades avanzadas de análisis:

- Registro completo de conversaciones
- Análisis de sentimiento en tiempo real
- Detección de emociones e intenciones
- Identificación de escalaciones necesarias
- Generación de métricas de rendimiento

**Métricas implementadas**:
- Distribución de sentimientos (positivo, negativo, neutral)
- Tendencias horarias de uso
- Tasa de resolución de consultas
- Tiempo promedio de respuesta
- Temas más frecuentes

### 5. Dashboard de Analytics

**Ubicación**: `public/dashboard.html` y `src/Router/analyticsRoutes.js`

El dashboard de analytics ofrece visualización en tiempo real de las métricas del chatbot:

- Gráficos interactivos con Chart.js
- Actualización automática de datos
- Filtrado por períodos de tiempo
- Exportación de datos en formatos estándar
- Diseño responsive para múltiples dispositivos

## 🔧 Tecnologías Utilizadas

| Categoría | Tecnologías |
|-----------|-------------|
| **Backend** | Node.js, Express, API REST |
| **Base de Datos** | JSON (sistema de archivos) |
| **IA y NLP** | Google Gemini 2.0 Flash |
| **Mensajería** | Telegram Bot API |
| **Web Scraping** | Axios, Cheerio |
| **Visualización** | Chart.js, HTML5, CSS3 |
| **Seguridad** | Rate Limiting, CORS, Helmet |
| **Utilidades** | dotenv, nodemon |

## 📊 Características y Funcionalidades

| Característica | Descripción | Estado |
|----------------|-------------|--------|
| **Asistente Virtual 24/7** | Disponibilidad continua para atender consultas | ✅ |
| **Comandos Específicos** | Comandos predefinidos para información frecuente | ✅ |
| **Respuestas con IA** | Integración con Google Gemini para respuestas inteligentes | ✅ |
| **Extracción Web** | Scraping en tiempo real de ingelean.com | ✅ |
| **Análisis de Sentimiento** | Detección automática de emociones del usuario | ✅ |
| **Dashboard Analítico** | Visualización de métricas y KPIs | ✅ |
| **Sistema de Escalación** | Detección de casos que requieren atención humana | ✅ |
| **Gestión de Sesiones** | Mantenimiento del contexto de conversación | ✅ |
| **División de Mensajes** | Manejo de respuestas que exceden límites de Telegram | ✅ |
| **Logging Avanzado** | Registro detallado de eventos del sistema | ✅ |

## 📱 Guía de Uso

### Para Usuarios

1. **Iniciar Conversación**:
   - Buscar "@ChatNiloProjectBot" en Telegram
   - Enviar comando `/start` para iniciar

2. **Comandos Disponibles**:
   - `/servicios` - Ver servicios ofrecidos
   - `/proyectos` - Conocer portafolio de proyectos
   - `/contacto` - Obtener información de contacto
   - `/empresa` - Conocer más sobre INGE LEAN

3. **Consultas Generales**:
   - Puedes preguntar sobre cualquier tema relacionado con la empresa
   - El bot procesará lenguaje natural para entender tu consulta
   - Si es necesario, el bot puede dividir respuestas largas en varios mensajes

### Para Administradores

1. **Acceso al Dashboard**:
   - Navegar a `http://localhost:3000/dashboard` (o la URL de despliegue)
   - Ver métricas en tiempo real de uso del chatbot

2. **Interpretación de Métricas**:
   - Revisar distribución de sentimientos
   - Analizar tendencias horarias
   - Identificar temas frecuentes
   - Detectar casos que requieren escalación

## 📈 Métricas y Análisis

El sistema ofrece análisis detallado a través de su dashboard:

1. **Métricas Generales**:
   - Total de conversaciones
   - Usuarios únicos
   - Tasa de resolución
   - Tiempo promedio de respuesta

2. **Análisis de Sentimiento**:
   - Distribución porcentual (positivo, negativo, neutral)
   - Tendencias temporales
   - Detección de emociones específicas

3. **Análisis de Contenido**:
   - Temas más frecuentes
   - Palabras clave recurrentes
   - Patrones de consulta

4. **Escalaciones**:
   - Casos detectados que requieren atención humana
   - Motivos de escalación
   - Tiempos de resolución

## 🔒 Seguridad Implementada

El sistema incorpora múltiples capas de seguridad:

1. **Rate Limiting**:
   - Limitación de 100 solicitudes por minuto
   - Protección contra ataques de fuerza bruta

2. **Validación de Entradas**:
   - Sanitización de mensajes recibidos
   - Validación de parámetros en endpoints

3. **Protección de API**:
   - Middleware de autenticación para acceso a endpoints sensibles
   - Validación de tokens para operaciones críticas

4. **Logs de Seguridad**:
   - Registro detallado de eventos
   - Alertas por actividad sospechosa

## 🚀 Instrucciones de Despliegue

### Requisitos Previos

- Node.js v16+ y npm
- Token de Bot de Telegram (obtenido a través de @BotFather)
- API Key de Google Gemini
- Conexión a Internet para scraping web

### Pasos de Instalación

1. **Clonar Repositorio**:
   ```bash
   git clone https://github.com/eriksonlive/Chatbot-talentotech.git
   cd Chatbot-talentotech
   ```

2. **Instalar Dependencias**:
   ```bash
   npm install
   ```

3. **Configurar Variables de Entorno**:
   - Crear archivo `.env` en la raíz:
   ```
   PORT=3000
   TELEGRAM_BOT_TOKEN=your_telegram_token
   GEMINI_API_KEY=your_gemini_api_key
   API_SECRET_TOKEN=your_secret_token
   ```

4. **Iniciar Aplicación**:
   ```bash
   npm run dev
   ```

### Verificación de Funcionamiento

- Bot accesible en Telegram
- Dashboard disponible en `http://localhost:3000/dashboard`
- Logs visibles en consola

## 🔄 Escalabilidad y Mejoras Futuras

El sistema está diseñado para ser escalable y extensible:

1. **Escalabilidad**:
   - Migración a base de datos NoSQL para almacenamiento permanente
   - Implementación de microservicios para componentes principales
   - Containerización con Docker para despliegue en la nube

2. **Mejoras Planificadas**:
   - Integración con sistemas CRM
   - Soporte para múltiples idiomas
   - Análisis predictivo de necesidades de usuario
   - Reconocimiento de voz e imágenes
   - Integración con WhatsApp Business API

3. **Optimizaciones**:
   - Caché mejorada para respuestas frecuentes
   - Implementación de estrategias avanzadas de prompt engineering
   - Mejoras en el análisis de sentimiento con modelos más sofisticados
   - Personalización basada en historial de usuario

---

<div align="center">
  <p>Desarrollado para Hackaton Talento Tech 2025</p>
  <p>© 2025 - INGE LEAN S.A.S. - Todos los derechos reservados</p>
</div>
