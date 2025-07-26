# 📊 Análisis de Sentimiento - Chatbot INGE LEAN S.A.S.

## 🧠 ¿Qué es el Análisis de Sentimiento?

El sistema de análisis de sentimiento utiliza **Inteligencia Artificial** para detectar emociones y estados emocionales en los mensajes de los usuarios, permitiendo:

- 🎯 **Respuestas Adaptativas** según el estado emocional
- 🚨 **Escalación Automática** para casos críticos
- 📈 **Métricas de Satisfacción** en tiempo real
- 💬 **Experiencia Personalizada** para cada usuario

## 🔍 Cómo Funciona

### 1. Análisis con IA (Gemini)
```javascript
const sentimentAnalysis = await analyzeSentiment(userMessage);
```

El sistema envía el mensaje a Google Gemini con instrucciones específicas para detectar:
- **Sentimiento**: POSITIVO, NEGATIVO, NEUTRAL
- **Confianza**: Nivel de certeza (0.0 - 1.0)
- **Emoción**: feliz, enojado, frustrado, ansioso, neutral, etc.
- **Escalación**: Si requiere atención humana inmediata

### 2. Fallback con Palabras Clave
Si la IA falla, usa un sistema de respaldo:
```javascript
const negativeKeywords = ['mal', 'error', 'problema', 'urgente', 'horrible'];
const positiveKeywords = ['excelente', 'gracias', 'perfecto', 'genial'];
```

## 📋 Tipos de Sentimiento

### 😊 POSITIVO
**Características:**
- Agradecimientos y felicitaciones
- Satisfacción con el servicio
- Interés genuino en productos/servicios

**Respuesta del Bot:**
```
¡Me alegra ayudarte! [respuesta original]

😊 ¿Hay algo más en lo que pueda ayudarte?
```

### 😡 NEGATIVO
**Características:**
- Quejas y frustraciones
- Problemas técnicos urgentes
- Experiencias negativas

**Respuesta del Bot:**
```
Entiendo tu frustración. [respuesta original]

🔥 **ATENCIÓN PRIORITARIA**: Un asesor especializado te contactará de inmediato.
```

### 😐 NEUTRAL
**Características:**
- Consultas informativas normales
- Preguntas sobre servicios
- Interacciones estándar

**Respuesta del Bot:**
```
[respuesta original]

💬 Si necesitas más información, no dudes en preguntar.
```

## 🚨 Sistema de Escalación

### Cuándo se Escala Automáticamente:
1. **Sentimiento NEGATIVO** con confianza > 70%
2. **Múltiples palabras negativas** (≥2) detectadas
3. **Palabras críticas** como "urgente", "horrible", "cancelar"

### Proceso de Escalación:
```javascript
if (sentimentAnalysis.escalate) {
  console.log(`🚨 ESCALACIÓN para usuario ${userId}`);
  // En producción: notificar a equipo humano
  // Enviar alerta por email/Slack
  // Crear ticket prioritario
}
```

## 📊 Ejemplos Prácticos

### Ejemplo 1: Mensaje Positivo
**Usuario:** "¡Excelente! Justo lo que necesitaba. Gracias por la información tan completa."

**Análisis:**
```json
{
  "sentiment": "POSITIVO",
  "confidence": 0.94,
  "emotion": "satisfecho",
  "escalate": false,
  "reason": "Expresión de satisfacción y agradecimiento"
}
```

**Respuesta Adaptada:**
```
¡Me alegra ayudarte! [respuesta original sobre servicios]

😊 ¿Hay algo más en lo que pueda ayudarte?
```

### Ejemplo 2: Mensaje Negativo (Escalación)
**Usuario:** "Esto es horrible! Llevo días esperando respuesta y nada funciona. Es un desastre total!"

**Análisis:**
```json
{
  "sentiment": "NEGATIVO",
  "confidence": 0.96,
  "emotion": "frustrado",
  "escalate": true,
  "reason": "Alto nivel de frustración con múltiples indicadores negativos"
}
```

**Respuesta Adaptada:**
```
Lamento mucho esta experiencia. [respuesta sobre soporte]

🔥 **ATENCIÓN PRIORITARIA**: Un asesor especializado te contactará de inmediato para resolver tu situación.
```

### Ejemplo 3: Mensaje Neutral
**Usuario:** "¿Pueden automatizar procesos industriales?"

**Análisis:**
```json
{
  "sentiment": "NEUTRAL",
  "confidence": 0.82,
  "emotion": "neutral",
  "escalate": false,
  "reason": "Consulta informativa estándar"
}
```

**Respuesta Adaptada:**
```
Sí. Nos especializamos en automatización industrial para mejorar eficiencia, reducir errores y optimizar tiempos de producción.

💬 Si necesitas más información, no dudes en preguntar.
```

## 🎯 API de Análisis de Sentimiento

### Endpoint Dedicado
```http
POST /sentiment
Content-Type: application/json

{
  "message": "Texto a analizar"
}
```

### Respuesta
```json
{
  "message": "Análisis de sentimiento completado",
  "analysis": {
    "sentiment": "NEGATIVO",
    "confidence": 0.88,
    "emotion": "frustrado",
    "escalate": true,
    "reason": "Frustración detectada con palabras críticas",
    "timestamp": "2025-01-26T10:30:00Z"
  }
}
```

## 📈 Métricas y Monitoreo

### Datos Registrados por Conversación:
```javascript
{
  "userId": "telegram_123456",
  "timestamp": "2025-01-26T10:30:00Z",
  "sentiment": "NEGATIVO",
  "confidence": 0.92,
  "emotion": "frustrado",
  "escalated": true,
  "messageLength": 45,
  "reason": "Alto nivel de frustración detectado"
}
```

### KPIs Que Se Pueden Calcular:
- **% de Satisfacción**: Mensajes positivos vs total
- **Tasa de Escalación**: Casos que requieren intervención humana
- **Tiempo de Resolución**: Para casos escalados
- **Distribución Emocional**: Gráficos de emociones detectadas
- **Tendencias por Usuario**: Evolución del sentimiento

## 🔧 Configuración y Personalización

### Ajustar Sensibilidad:
```javascript
// En src/sentiment.js, línea de escalación:
if (matchingWords.length >= Math.ceil(messageWords.length * 0.6)) {
  // Cambiar 0.6 por 0.5 (más sensible) o 0.7 (menos sensible)
}
```

### Agregar Palabras Clave:
```javascript
const negativeKeywords = [
  'mal', 'error', 'problema', 'horrible',
  // Agregar más palabras específicas del dominio
  'lento', 'caro', 'complicado'
];
```

### Personalizar Respuestas Empáticas:
```javascript
const empathicPrefixes = {
  NEGATIVO: {
    frustrado: "Entiendo tu frustración completamente. ",
    enojado: "Lamento profundamente esta experiencia. ",
    // Agregar más variaciones
  }
};
```

## 🎖️ Ventajas para la Hackaton

1. **Innovación Técnica**: IA aplicada a experiencia del usuario
2. **Diferenciación**: Pocos chatbots tienen análisis de sentimiento robusto
3. **Valor de Negocio**: Mejora directa en satisfacción del cliente
4. **Escalabilidad**: Permite gestión eficiente de recursos humanos
5. **Métricas Valiosas**: Datos para optimización continua

---

**¡El análisis de sentimiento convierte un chatbot básico en un asistente inteligente y empático!** 🤖❤️
