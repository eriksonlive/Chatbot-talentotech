/**
 * Sistema de manejo de contexto para conversaciones del chatbot
 * Permite recordar el historial y mantener el flujo natural de conversación
 */

// Almacén en memoria para el contexto de usuarios
const userContexts = new Map();

/**
 * Estructura del contexto de usuario
 */
class UserContext {
  constructor(userId) {
    this.userId = userId;
    this.sessionStart = new Date().toISOString();
    this.lastActivity = new Date().toISOString();
    this.conversationHistory = [];
    this.currentTopic = null;
    this.lastIntent = null;
    this.awaitingResponse = false;
    this.metadata = {
      messageCount: 0,
      totalSessions: 1,
      preferredChannel: null
    };
  }

  /**
   * Actualiza la actividad del usuario
   */
  updateActivity() {
    this.lastActivity = new Date().toISOString();
    this.metadata.messageCount++;
  }

  /**
   * Agrega un mensaje al historial
   */
  addMessage(message, isUser = true, intent = null, sentiment = null) {
    const entry = {
      timestamp: new Date().toISOString(),
      message: message,
      isUser: isUser,
      intent: intent,
      sentiment: sentiment
    };

    this.conversationHistory.push(entry);
    
    // Mantener solo los últimos 10 mensajes para eficiencia
    if (this.conversationHistory.length > 10) {
      this.conversationHistory = this.conversationHistory.slice(-10);
    }

    this.updateActivity();

    // Actualizar intent actual si es mensaje del usuario
    if (isUser && intent) {
      this.lastIntent = intent;
      this.currentTopic = this.determineTopicFromIntent(intent);
    }
  }

  /**
   * Determina el tema actual basado en el intent
   */
  determineTopicFromIntent(intent) {
    const topicMapping = {
      'servicios': 'servicios_empresa',
      'cotizacion': 'cotizacion_proceso',
      'inteligencia_artificial': 'tecnologia_ia',
      'automatizacion': 'tecnologia_automatizacion',
      'mantenimiento': 'soporte_tecnico',
      'ubicacion_atencion': 'informacion_empresa',
      'cobertura_geografica': 'informacion_empresa',
      'tiempo_respuesta_soporte': 'soporte_tecnico',
      'planes_suscripcion': 'comercial',
      'diferencia_empresa': 'informacion_empresa'
    };

    return topicMapping[intent] || 'general';
  }

  /**
   * Obtiene el contexto relevante para la IA
   */
  getContextForAI() {
    if (this.conversationHistory.length === 0) {
      return '';
    }

    const recentMessages = this.conversationHistory.slice(-5);
    const contextString = recentMessages
      .map(entry => `${entry.isUser ? 'Usuario' : 'Bot'}: ${entry.message}`)
      .join('\n');

    return `
HISTORIAL DE CONVERSACIÓN RECIENTE:
${contextString}

CONTEXTO ACTUAL:
- Tema actual: ${this.currentTopic || 'No definido'}
- Último intent: ${this.lastIntent || 'No definido'}
- Mensajes en sesión: ${this.metadata.messageCount}

INSTRUCCIONES DE CONTEXTO:
- Mantén coherencia con la conversación anterior
- Si el usuario hace referencia a "eso", "lo anterior" o similar, usa el contexto
- Si cambia de tema, adapta naturalmente
`;
  }

  /**
   * Verifica si el usuario está en medio de un proceso
   */
  isInProcess() {
    return this.awaitingResponse || 
           (this.currentTopic === 'cotizacion_proceso' && this.metadata.messageCount < 3);
  }

  /**
   * Detecta si el mensaje actual es una continuación del tema anterior
   */
  isContinuation(message) {
    const continuationKeywords = [
      'eso', 'esto', 'lo anterior', 'lo que mencionaste', 'lo mismo',
      'también', 'además', 'y', 'pero', 'entonces', 'ok', 'vale',
      'cuánto cuesta', 'más información', 'dime más', 'explica',
      'cómo funciona', 'cuándo', 'dónde', 'quién'
    ];

    const lowerMessage = message.toLowerCase();
    return continuationKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  /**
   * Obtiene sugerencias de seguimiento basadas en el contexto
   */
  getFollowUpSuggestions() {
    const suggestions = {
      'servicios_empresa': [
        '¿Te interesa algún servicio específico?',
        '¿Quieres una cotización?',
        '¿Necesitas más detalles sobre automatización?'
      ],
      'cotizacion_proceso': [
        '¿Podrías contarme más sobre tu proyecto?',
        '¿Qué presupuesto tienes en mente?',
        '¿Cuándo necesitas que esté listo?'
      ],
      'tecnologia_ia': [
        '¿Qué tipo de datos manejas?',
        '¿Has implementado IA antes?',
        '¿Quieres ver casos de éxito?'
      ],
      'soporte_tecnico': [
        '¿Es urgente tu consulta?',
        '¿Qué tipo de sistema tienes?',
        '¿Necesitas mantenimiento preventivo?'
      ]
    };

    return suggestions[this.currentTopic] || [
      '¿En qué más puedo ayudarte?',
      '¿Tienes alguna otra consulta?',
      '¿Te gustaría conocer nuestros otros servicios?'
    ];
  }
}

/**
 * Obtiene o crea el contexto de un usuario
 * @param {string} userId - ID único del usuario
 * @param {string} channel - Canal de comunicación ('telegram', 'whatsapp', 'api')
 * @returns {UserContext} - Contexto del usuario
 */
export function getUserContext(userId, channel = 'unknown') {
  if (!userContexts.has(userId)) {
    const context = new UserContext(userId);
    context.metadata.preferredChannel = channel;
    userContexts.set(userId, context);
  }

  const context = userContexts.get(userId);
  
  // Actualizar canal preferido si es diferente
  if (channel !== 'unknown' && channel !== context.metadata.preferredChannel) {
    context.metadata.preferredChannel = channel;
  }

  return context;
}

/**
 * Registra un mensaje en el contexto del usuario
 * @param {string} userId - ID del usuario
 * @param {string} message - Mensaje
 * @param {boolean} isUser - Si es mensaje del usuario o del bot
 * @param {string} intent - Intent detectado (opcional)
 * @param {Object} sentiment - Análisis de sentimiento (opcional)
 */
export function addMessageToContext(userId, message, isUser = true, intent = null, sentiment = null) {
  const context = getUserContext(userId);
  context.addMessage(message, isUser, intent, sentiment);
  return context;
}

/**
 * Obtiene el contexto para incluir en el prompt de IA
 * @param {string} userId - ID del usuario
 * @returns {string} - Contexto formateado para IA
 */
export function getContextForAI(userId) {
  const context = getUserContext(userId);
  return context.getContextForAI();
}

/**
 * Verifica si el mensaje es una continuación de la conversación
 * @param {string} userId - ID del usuario
 * @param {string} message - Mensaje actual
 * @returns {boolean} - Si es continuación
 */
export function isContinuationMessage(userId, message) {
  const context = getUserContext(userId);
  return context.isContinuation(message);
}

/**
 * Obtiene sugerencias de seguimiento para el usuario
 * @param {string} userId - ID del usuario
 * @returns {Array} - Lista de sugerencias
 */
export function getFollowUpSuggestions(userId) {
  const context = getUserContext(userId);
  return context.getFollowUpSuggestions();
}

/**
 * Limpia contextos antiguos (más de 24 horas sin actividad)
 */
export function cleanOldContexts() {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  for (const [userId, context] of userContexts.entries()) {
    const lastActivity = new Date(context.lastActivity);
    if (lastActivity < oneDayAgo) {
      userContexts.delete(userId);
    }
  }
}

/**
 * Obtiene estadísticas de contexto para analytics
 * @returns {Object} - Estadísticas generales
 */
export function getContextStats() {
  const stats = {
    totalActiveUsers: userContexts.size,
    avgMessagesPerUser: 0,
    topicsDistribution: {},
    channelsDistribution: {}
  };

  let totalMessages = 0;

  for (const context of userContexts.values()) {
    totalMessages += context.metadata.messageCount;
    
    // Distribución de temas
    const topic = context.currentTopic || 'no_definido';
    stats.topicsDistribution[topic] = (stats.topicsDistribution[topic] || 0) + 1;
    
    // Distribución de canales
    const channel = context.metadata.preferredChannel || 'desconocido';
    stats.channelsDistribution[channel] = (stats.channelsDistribution[channel] || 0) + 1;
  }

  stats.avgMessagesPerUser = userContexts.size > 0 ? 
    Math.round(totalMessages / userContexts.size * 100) / 100 : 0;

  return stats;
}

/**
 * Exporta el contexto de un usuario para debugging
 * @param {string} userId - ID del usuario
 * @returns {Object} - Contexto completo del usuario
 */
export function exportUserContext(userId) {
  const context = getUserContext(userId);
  return {
    userId: context.userId,
    sessionStart: context.sessionStart,
    lastActivity: context.lastActivity,
    conversationHistory: context.conversationHistory,
    currentTopic: context.currentTopic,
    lastIntent: context.lastIntent,
    metadata: context.metadata
  };
}

// Limpiar contextos antiguos cada hora
setInterval(cleanOldContexts, 60 * 60 * 1000);
