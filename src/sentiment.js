import { askGemini } from './gemini.js';

/**
 * Analiza el sentimiento de un mensaje usando IA
 * @param {string} message - Mensaje del usuario
 * @returns {Promise<Object>} - Resultado del análisis de sentimiento
 */
export async function analyzeSentiment(message) {
  if (!message || message.trim().length === 0) {
    return {
      sentiment: 'NEUTRAL',
      confidence: 0.5,
      emotion: 'neutral',
      escalate: false
    };
  }

  try {
    const prompt = `
    Analiza el sentimiento del siguiente mensaje del usuario de un chatbot empresarial.

    MENSAJE: "${message}"

    Responde ÚNICAMENTE en formato JSON con esta estructura exacta:
    {
      "sentiment": "POSITIVO|NEGATIVO|NEUTRAL",
      "confidence": 0.95,
      "emotion": "feliz|enojado|frustrado|ansioso|neutral|satisfecho|confundido",
      "escalate": true|false,
      "reason": "breve explicación del sentimiento detectado"
    }

    CRITERIOS:
    - POSITIVO: Agradecimiento, satisfacción, interés genuino
    - NEGATIVO: Quejas, frustración, enojo, urgencia crítica
    - NEUTRAL: Preguntas informativas, consultas normales
    - escalate: true si es NEGATIVO con alta confianza (>0.7) o urgencia crítica
    - confidence: nivel de certeza del análisis (0.0 a 1.0)
    `;

    const response = await askGemini(prompt);
    
    // Intentar parsear la respuesta JSON
    const cleanResponse = response.replace(/```json|```/g, '').trim();
    const analysis = JSON.parse(cleanResponse);
    
    // Validar y normalizar la respuesta
    return {
      sentiment: validateSentiment(analysis.sentiment),
      confidence: Math.max(0, Math.min(1, analysis.confidence || 0.5)),
      emotion: analysis.emotion || 'neutral',
      escalate: Boolean(analysis.escalate),
      reason: analysis.reason || 'Análisis automático',
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Error en análisis de sentimiento:', error.message);
    
    // Fallback: análisis básico por palabras clave
    return basicSentimentAnalysis(message);
  }
}

/**
 * Valida que el sentimiento esté en los valores permitidos
 * @param {string} sentiment 
 * @returns {string}
 */
function validateSentiment(sentiment) {
  const valid = ['POSITIVO', 'NEGATIVO', 'NEUTRAL'];
  const normalized = sentiment?.toUpperCase();
  return valid.includes(normalized) ? normalized : 'NEUTRAL';
}

/**
 * Análisis de sentimiento básico como fallback
 * @param {string} message 
 * @returns {Object}
 */
function basicSentimentAnalysis(message) {
  const lowerMessage = message.toLowerCase();
  
  // Palabras clave negativas
  const negativeKeywords = [
    'mal', 'error', 'problema', 'falla', 'roto', 'no funciona', 'horrible',
    'pésimo', 'enojado', 'furioso', 'frustrado', 'urgente', 'ayuda',
    'desesperado', 'terrible', 'odio', 'detesto', 'cancelar'
  ];
  
  // Palabras clave positivas
  const positiveKeywords = [
    'excelente', 'perfecto', 'gracias', 'genial', 'fantástico',
    'increíble', 'maravilloso', 'contento', 'feliz', 'satisfecho',
    'recomiendo', 'buenísimo', 'espectacular', 'encantado'
  ];
  
  const negativeCount = negativeKeywords.filter(word => lowerMessage.includes(word)).length;
  const positiveCount = positiveKeywords.filter(word => lowerMessage.includes(word)).length;
  
  let sentiment = 'NEUTRAL';
  let confidence = 0.5;
  let emotion = 'neutral';
  let escalate = false;
  
  if (negativeCount > positiveCount && negativeCount > 0) {
    sentiment = 'NEGATIVO';
    confidence = Math.min(0.9, 0.6 + (negativeCount * 0.1));
    emotion = 'frustrado';
    escalate = negativeCount >= 2;
  } else if (positiveCount > negativeCount && positiveCount > 0) {
    sentiment = 'POSITIVO';
    confidence = Math.min(0.9, 0.6 + (positiveCount * 0.1));
    emotion = 'satisfecho';
  }
  
  return {
    sentiment,
    confidence,
    emotion,
    escalate,
    reason: 'Análisis por palabras clave (fallback)',
    timestamp: new Date().toISOString()
  };
}

/**
 * Genera una respuesta adaptada según el sentimiento
 * @param {Object} sentimentAnalysis - Resultado del análisis
 * @param {string} originalResponse - Respuesta original del bot
 * @returns {string} - Respuesta adaptada
 */
export function adaptResponseToSentiment(sentimentAnalysis, originalResponse) {
  const { sentiment, emotion, escalate } = sentimentAnalysis;
  
  // Prefijos empáticos según el sentimiento
  const empathicPrefixes = {
    NEGATIVO: {
      frustrado: "Entiendo tu frustración. ",
      enojado: "Lamento que tengas esta experiencia. ",
      ansioso: "Comprendo tu preocupación. ",
      default: "Lamento cualquier inconveniente. "
    },
    POSITIVO: {
      feliz: "¡Me alegra ayudarte! ",
      satisfecho: "¡Excelente! ",
      default: "¡Perfecto! "
    },
    NEUTRAL: {
      default: ""
    }
  };
  
  // Sufijos de escalación o seguimiento
  const followUpSuffixes = {
    escalate: "\n\n🔥 **ATENCIÓN PRIORITARIA**: Un asesor especializado te contactará de inmediato para resolver tu situación.",
    positive: "\n\n😊 ¿Hay algo más en lo que pueda ayudarte?",
    neutral: "\n\n💬 Si necesitas más información, no dudes en preguntar."
  };
  
  // Construir respuesta adaptada
  let adaptedResponse = originalResponse;
  
  // Agregar prefijo empático
  const prefixCategory = empathicPrefixes[sentiment] || empathicPrefixes.NEUTRAL;
  const prefix = prefixCategory[emotion] || prefixCategory.default;
  
  if (prefix) {
    adaptedResponse = prefix + adaptedResponse;
  }
  
  // Agregar sufijo según la situación
  if (escalate) {
    adaptedResponse += followUpSuffixes.escalate;
  } else if (sentiment === 'POSITIVO') {
    adaptedResponse += followUpSuffixes.positive;
  } else if (sentiment === 'NEUTRAL') {
    adaptedResponse += followUpSuffixes.neutral;
  }
  
  return adaptedResponse;
}

/**
 * Registra métricas de sentimiento para análisis posterior
 * @param {string} userId - ID del usuario
 * @param {Object} sentimentAnalysis - Análisis de sentimiento
 * @param {string} message - Mensaje original
 */
export function logSentimentMetrics(userId, sentimentAnalysis, message) {
  const metrics = {
    userId,
    timestamp: sentimentAnalysis.timestamp,
    sentiment: sentimentAnalysis.sentiment,
    confidence: sentimentAnalysis.confidence,
    emotion: sentimentAnalysis.emotion,
    escalated: sentimentAnalysis.escalate,
    messageLength: message.length,
    reason: sentimentAnalysis.reason
  };
  
  // En producción, esto se enviaría a una base de datos o servicio de analytics
  console.log('📊 Sentiment Metrics:', JSON.stringify(metrics, null, 2));
  
  return metrics;
}
