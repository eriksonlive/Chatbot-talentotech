# 🤖 Chatbot Inteligente INGELEAN - Hackaton TalentoTech

## 📖 Descripción del Proyecto

Chatbot inteligente diseñado para **INGELEAN**, una empresa de desarrollo de software e ingeniería. El bot proporciona información automática sobre servicios, cotizaciones, soporte técnico y automatización industrial utilizando **Inteligencia Artificial** con Gemini.

### 🎯 Características Principales

- **Respuestas Inteligentes**: Utiliza Google Gemini AI para generar respuestas contextuales
- **Análisis de Sentimiento**: Detecta emociones y adapta respuestas según el estado del usuario
- **Escalación Automática**: Deriva casos negativos críticos a asesores humanos
- **Múltiples Canales**: Soporta Telegram y WhatsApp (UltraMsg)
- **Dataset Personalizado**: Entrenado con información específica de INGELEAN
- **API REST**: Endpoints para integración con otros sistemas
- **Rate Limiting**: Protección contra spam y uso excesivo
- **Seguridad**: Autenticación con tokens y middleware de seguridad
- **Métricas Avanzadas**: Seguimiento de satisfacción y análisis de conversaciones

## 🛠️ Tecnologías Utilizadas

- **Node.js** + **Express.js** - Backend del servidor
- **Google Gemini AI** - Inteligencia artificial para respuestas
- **Telegram Bot API** - Integración con Telegram
- **UltraMsg API** - Integración con WhatsApp
- **Axios** - Cliente HTTP para APIs externas
- **DummyJSON** - API de productos de ejemplo
- **dotenv** - Gestión de variables de entorno

## 📂 Estructura del Proyecto

```
Chatbot-talentotech/
├── index.js              # Servidor principal y lógica del bot
├── package.json           # Dependencias y scripts
├── .env                   # Variables de entorno (no incluido)
├── src/
│   ├── gemini.js         # Integración con Google Gemini AI
│   ├── dataset.js        # Gestión del dataset y matching inteligente
│   ├── sentiment.js      # Análisis de sentimiento y respuestas adaptativas
│   ├── apiclient.js      # Cliente para APIs externas
│   └── whatsapp.js       # Integración con WhatsApp (futuro)
├── rest/
│   └── .rest             # Archivo de pruebas HTTP
└── dataset_inglean_chatbot.json  # Dataset de entrenamiento
```

## 🚀 Instalación y Configuración

### 1. Clonar el Repositorio
```bash
git clone https://github.com/eriksonlive/Chatbot-talentotech.git
cd Chatbot-talentotech
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configurar Variables de Entorno
Crear archivo `.env` en la raíz del proyecto:

```env
# APIs de Inteligencia Artificial
GEMINI_API_KEY=tu_clave_de_gemini_aqui

# Bot de Telegram
TELEGRAM_BOT_TOKEN=tu_token_de_telegram_bot

# WhatsApp (UltraMsg)
ULTRA_INSTANCE_ID=tu_instance_id
ULTRA_TOKEN=tu_ultra_token

# Configuración del Servidor
PORT=3000
API_SECRET_TOKEN=tu_token_secreto_para_api
```

### 4. Ejecutar el Proyecto

**Modo Desarrollo:**
```bash
npm run dev
```

**Modo Producción:**
```bash
node index.js
```

## 🤖 Funcionamiento del Chatbot

### 🧠 Sistema Híbrido Inteligente

El chatbot utiliza un **sistema híbrido** que combina:

1. **Matching Directo**: Respuestas instantáneas para preguntas frecuentes
2. **IA Contextual**: Google Gemini para consultas complejas
3. **Análisis de Sentimiento**: Detecta emociones del usuario en tiempo real
4. **Respuestas Adaptativas**: Ajusta el tono según el estado emocional
5. **Escalación Automática**: Deriva casos críticos a asesores humanos

### 🎯 Algoritmo de Respuesta

```javascript
// 1. Analizar sentimiento del mensaje
const sentimentAnalysis = await analyzeSentiment(userMessage);

// 2. Buscar coincidencia exacta en dataset
const directMatch = findIntent(userMessage);
if (directMatch) return directMatch.response;

// 3. Usar IA con contexto de INGE LEAN
const aiResponse = await askGemini(contextualPrompt);

// 4. Adaptar respuesta según sentimiento detectado
const adaptedResponse = adaptResponseToSentiment(sentimentAnalysis, aiResponse);

// 5. Escalar si es necesario
if (sentimentAnalysis.escalate) {
  notifyHumanAgent(userId, sentimentAnalysis);
}
```

### 📊 Dataset de Entrenamiento

**10 Intents Principales:**
- `servicios` - Información sobre servicios ofrecidos
- `cobertura_geografica` - Cobertura nacional y atención remota  
- `cotizacion` - Proceso de cotización y presupuestos
- `ubicacion_atencion` - Ubicación física en Pereira
- `mantenimiento` - Servicios de mantenimiento técnico
- `inteligencia_artificial` - Implementación de IA
- `automatizacion` - Automatización industrial
- `tiempo_respuesta_soporte` - SLA de soporte técnico
- `planes_suscripcion` - Planes y suscripciones
- `diferencia_empresa` - Ventajas competitivas

**120+ Variaciones de Preguntas** - El sistema reconoce múltiples formas de hacer la misma pregunta

## 🔌 API Endpoints

### 1. Chat Endpoint
```http
POST /chat
Content-Type: application/json

{
  "message": "¿Qué servicios ofrecen?"
}
```

**Respuesta:**
```json
{
  "reply": "Ofrecemos desarrollo de software a medida, automatización industrial...",
  "sentiment": {
    "sentiment": "NEUTRAL",
    "confidence": 0.85,
    "emotion": "neutral",
    "escalate": false
  }
}
```

### 2. Análisis de Sentimiento
```http
POST /sentiment
Content-Type: application/json

{
  "message": "Estoy muy frustrado con el servicio!"
}
```

**Respuesta:**
```json
{
  "message": "Análisis de sentimiento completado",
  "analysis": {
    "sentiment": "NEGATIVO",
    "confidence": 0.92,
    "emotion": "frustrado",
    "escalate": true,
    "reason": "Alto nivel de frustración detectado",
    "timestamp": "2025-01-26T10:30:00Z"
  }
}
```

### 2. Webhook para WhatsApp
```http
POST /webhook
Content-Type: application/json

{
  "message": "Mensaje del usuario",
  "userId": "whatsapp_user_123"
}
```

### 3. Análisis de Sentimiento
```http
POST /sentiment
Content-Type: application/json

{
  "message": "Texto a analizar"
}
```

### 4. Health Check
```http
GET /
```

### 5. Obtener Intents
```http
GET /intents
```

## 🤖 Integración de Bots

### Telegram
- El bot responde automáticamente a todos los mensajes
- Utiliza polling para recibir mensajes en tiempo real
- Integra la IA para respuestas contextuales

### WhatsApp (UltraMsg)
- Webhook para recibir mensajes
- Envío automático de respuestas
- Integración con API de UltraMsg

## 🔒 Seguridad

- **Rate Limiting**: Máximo 10 peticiones por minuto
- **Autenticación**: Token secreto para endpoints protegidos
- **Validación de Entrada**: Sanitización de datos de usuario
- **CORS**: Configuración para dominios permitidos

## 📈 Características Técnicas

### Rate Limiting
```javascript
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 10, // máx 10 peticiones por minuto
  message: 'Demasiadas solicitudes. Intenta más tarde.',
});
```

### Autenticación
```javascript
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token || token !== process.env.API_SECRET_TOKEN) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  next();
}
```

## 🧪 Pruebas

Archivo `rest/.rest` incluido para pruebas de API:

```http
# Probar el endpoint de chat
POST http://localhost:3000/chat
Content-Type: application/json

{
  "message": "¿Qué servicios ofrecen?"
}
```

## 🚀 Despliegue

### Variables de Entorno para Producción
- Configurar todas las claves API
- Establecer `NODE_ENV=production`
- Configurar puerto dinámico: `PORT=${PORT:-3000}`

### Plataformas Recomendadas
- **Heroku**
- **Railway**
- **Vercel**
- **AWS Lambda**

## 👥 Equipo de Desarrollo

**Hackaton TalentoTech** - Chatbot INGELEAN

## 📄 Licencia

Este proyecto está bajo la licencia ISC.

---

### 🎯 Objetivo de la Hackaton

Crear un chatbot inteligente que mejore la atención al cliente de INGELEAN, automatizando respuestas frecuentes sobre servicios, cotizaciones y soporte técnico, utilizando tecnologías de vanguardia como IA y múltiples canales de comunicación.

### 🏆 Innovaciones Implementadas

1. **IA Contextual**: Respuestas inteligentes basadas en el contexto del usuario
2. **Análisis de Sentimiento Avanzado**: Detección de emociones con escalación automática
3. **Respuestas Adaptativas**: Ajuste del tono según el estado emocional del usuario
4. **Multi-canal**: Soporte simultáneo para Telegram y WhatsApp
5. **Dataset Personalizado**: Entrenamiento específico para INGELEAN
6. **API REST Completa**: Fácil integración con sistemas existentes
7. **Métricas en Tiempo Real**: Seguimiento de satisfacción y análisis de conversaciones
8. **Seguridad Avanzada**: Rate limiting y autenticación robusta
