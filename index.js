import express from 'express';
import dotenv from 'dotenv';
import { askGemini } from './src/gemini.js';
import { fetchData } from './src/apiclient.js';
import { findIntent, getDatasetContext, getAllIntents } from './src/dataset.js';
import { analyzeSentiment, adaptResponseToSentiment, logSentimentMetrics } from './src/sentiment.js';
import { getUserContext, addMessageToContext, getContextForAI, isContinuationMessage, getFollowUpSuggestions, getContextStats } from './src/context.js';
import { getDatabase, logConversationQuick } from './src/database.js';
import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
app.use(express.json());

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 50, // máx 50 peticiones por minuto
  message: 'Demasiadas solicitudes. Intenta más tarde.',
});
app.use(limiter);

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token || token !== process.env.API_SECRET_TOKEN) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  next();
}

const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(telegramToken, { polling: true });

// Inicializar base de datos
const database = getDatabase();



bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userMessage = msg.text;
  const userId = `telegram_${msg.from.id}`;
  const startTime = Date.now();

  try {
    // 1. Obtener contexto del usuario
    const userContext = getUserContext(userId, 'telegram');
    
    // 2. Analizar sentimiento del mensaje
    const sentimentAnalysis = await analyzeSentiment(userMessage);
    
    // 3. Agregar mensaje al contexto
    addMessageToContext(userId, userMessage, true, null, sentimentAnalysis);
    
    // 4. Verificar si es continuación de conversación
    const isContinuation = isContinuationMessage(userId, userMessage);
    
    // 5. Buscar intent directo o usar contexto
    let matchedIntent = findIntent(userMessage);
    let response;
    let usedContext = false;
    
    if (matchedIntent) {
      // Respuesta directa del dataset
      response = matchedIntent.response;
    } else if (isContinuation && userContext.conversationHistory.length > 1) {
      // Usar IA con contexto completo
      const contextualPrompt = getContextualPrompt(userMessage, userId);
      response = await askGemini(contextualPrompt);
      usedContext = true;
    } else {
      // Respuesta con IA sin contexto específico
      const datasetContext = getDatasetContext();
      const prompt = `
      ${datasetContext}
      
      PREGUNTA DEL USUARIO: "${userMessage}"
      
      Responde como el chatbot oficial de INGE LEAN S.A.S. basándote en la información proporcionada.
      `;
      response = await askGemini(prompt);
    }
    
    // 6. Adaptar respuesta según el sentimiento
    const adaptedResponse = adaptResponseToSentiment(sentimentAnalysis, response);
    
    // 7. Agregar respuesta del bot al contexto
    const intentUsed = matchedIntent?.intent || (usedContext ? 'contexto' : 'general');
    addMessageToContext(userId, adaptedResponse, false, intentUsed, null);
    
    // 8. Registrar en base de datos
    const responseTime = Date.now() - startTime;
    await logConversationQuick(
      userId, 
      'telegram', 
      userMessage, 
      adaptedResponse, 
      intentUsed, 
      sentimentAnalysis
    );
    
    // 9. Enviar respuesta
    bot.sendMessage(chatId, adaptedResponse);
    
    // 10. Si hay escalación, notificar
    if (sentimentAnalysis.escalate) {
      console.log(`🚨 ESCALACIÓN REQUERIDA para usuario ${userId}: ${sentimentAnalysis.reason}`);
      
      // Enviar sugerencias de seguimiento si no hay escalación
    } else if (Math.random() < 0.3) { // 30% de probabilidad de mostrar sugerencias
      const suggestions = getFollowUpSuggestions(userId);
      if (suggestions.length > 0) {
        const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
        setTimeout(() => {
          bot.sendMessage(chatId, `💡 ${randomSuggestion}`);
        }, 2000);
      }
    }
    
  } catch (error) {
    console.error('Error procesando mensaje:', error);
    bot.sendMessage(
      chatId,
      'Lo siento, hubo un error procesando tu solicitud. Un asesor te contactará pronto para ayudarte.'
    );
  }
});

app.post('/webhook', async (req, res) => {
  const { message } = req.body;
  const userId = req.body.userId || `whatsapp_${Date.now()}`;

  try {
    // 1. Analizar sentimiento
    const sentimentAnalysis = await analyzeSentiment(message);
    
    // 2. Registrar métricas
    logSentimentMetrics(userId, sentimentAnalysis, message);
    
    // 3. Buscar respuesta en el dataset de INGELEAN
    const matchedIntent = findIntent(message);
    let respuesta;
    
    if (matchedIntent) {
      respuesta = matchedIntent.response;
    } else {
      // Usar IA con contexto de INGELEAN
      respuesta = await generarRespuestaIA(message);
    }
    
    // 4. Adaptar respuesta según sentimiento
    respuesta = adaptResponseToSentiment(sentimentAnalysis, respuesta);

    // 5. Enviar la respuesta por UltraMsg
    const resp = await axios.get(
      `https://api.ultramsg.com/${process.env.ULTRA_INSTANCE_ID}/messages/chat`,
      {
        params: {
          token: process.env.ULTRA_TOKEN,
          to: '573008128303',
          body: respuesta,
        },
      }
    );

    res.sendStatus(200);
  } catch (e) {
    console.error('Error al responder:', e.message);
    res.sendStatus(500);
  }
});

app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;
  const userId = req.body.userId || `api_${Date.now()}`;
  const startTime = Date.now();

  try {
    // 1. Obtener contexto del usuario
    const userContext = getUserContext(userId, 'api');
    
    // 2. Analizar sentimiento
    const sentimentAnalysis = await analyzeSentiment(userMessage);
    
    // 3. Agregar mensaje al contexto
    addMessageToContext(userId, userMessage, true, null, sentimentAnalysis);
    
    // 4. Verificar si es continuación
    const isContinuation = isContinuationMessage(userId, userMessage);
    
    // 5. Buscar respuesta
    const matchedIntent = findIntent(userMessage);
    let response;
    let usedContext = false;
    
    if (matchedIntent) {
      response = matchedIntent.response;
    } else if (isContinuation && userContext.conversationHistory.length > 1) {
      const contextualPrompt = getContextualPrompt(userMessage, userId);
      response = await askGemini(contextualPrompt);
      usedContext = true;
    } else {
      response = await generarRespuestaIA(userMessage);
    }
    
    // 6. Adaptar respuesta según sentimiento
    const adaptedResponse = adaptResponseToSentiment(sentimentAnalysis, response);
    
    // 7. Agregar respuesta del bot al contexto
    const intentUsed = matchedIntent?.intent || (usedContext ? 'contexto' : 'general');
    addMessageToContext(userId, adaptedResponse, false, intentUsed, null);
    
    // 8. Registrar en base de datos
    const responseTime = Date.now() - startTime;
    await logConversationQuick(
      userId, 
      'api', 
      userMessage, 
      adaptedResponse, 
      intentUsed, 
      sentimentAnalysis
    );
    
    // 9. Responder con información completa
    res.json({ 
      reply: adaptedResponse,
      sentiment: {
        sentiment: sentimentAnalysis.sentiment,
        confidence: sentimentAnalysis.confidence,
        emotion: sentimentAnalysis.emotion,
        escalate: sentimentAnalysis.escalate
      },
      context: {
        usedContext: usedContext,
        isContinuation: isContinuation,
        messageCount: userContext.metadata.messageCount,
        currentTopic: userContext.currentTopic
      },
      responseTime: responseTime
    });
    
  } catch (e) {
    console.error('Error en /chat:', e);
    res.status(500).json({ error: 'Error al generar respuesta de IA' });
  }
});

app.get('/', (req, res) => {
  res.send('¡Hola! Soy el bot de IA de INGELEAN. Envíame un mensaje para empezar.');
});

// Servir el dashboard HTML
app.get('/dashboard', (req, res) => {
  res.sendFile('dashboard.html', { root: '.' });
});

// Endpoint para obtener información sobre los intents disponibles
app.get('/intents', (req, res) => {
  const intents = getAllIntents();
  res.json({
    message: 'Intents disponibles para INGELEAN',
    total: intents.length,
    intents: intents
  });
});

// Endpoint para analizar sentimiento de un mensaje específico
app.post('/sentiment', async (req, res) => {
  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Mensaje requerido' });
  }
  
  try {
    const sentimentAnalysis = await analyzeSentiment(message);
    res.json({
      message: 'Análisis de sentimiento completado',
      analysis: sentimentAnalysis
    });
  } catch (error) {
    res.status(500).json({ error: 'Error analizando sentimiento' });
  }
});

// Endpoint para obtener contexto de un usuario
app.get('/context/:userId', (req, res) => {
  const { userId } = req.params;
  
  try {
    const userContext = getUserContext(userId);
    res.json({
      context: {
        messageCount: userContext.metadata.messageCount,
        currentTopic: userContext.currentTopic,
        lastIntent: userContext.lastIntent,
        sessionStart: userContext.sessionStart,
        lastActivity: userContext.lastActivity,
        conversationHistory: userContext.conversationHistory.slice(-5) // Últimos 5 mensajes
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo contexto' });
  }
});

// Endpoint para estadísticas de contexto
app.get('/context-stats', (req, res) => {
  try {
    const stats = getContextStats();
    res.json({
      message: 'Estadísticas de contexto',
      stats: stats
    });
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo estadísticas' });
  }
});

// ========== ENDPOINTS DE ANALYTICS ==========

// Overview general del dashboard
app.get('/analytics/overview', async (req, res) => {
  try {
    const metrics = await database.getOverviewMetrics();
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error en analytics overview:', error);
    res.status(500).json({ error: 'Error obteniendo métricas generales' });
  }
});

// Distribución de sentimientos
app.get('/analytics/sentiment-distribution', async (req, res) => {
  const days = parseInt(req.query.days) || 7;
  
  try {
    const distribution = await database.getSentimentDistribution(days);
    res.json({
      success: true,
      data: distribution,
      period: `${days} días`
    });
  } catch (error) {
    console.error('Error en sentiment distribution:', error);
    res.status(500).json({ error: 'Error obteniendo distribución de sentimientos' });
  }
});

// Tendencias por hora
app.get('/analytics/hourly-trends', async (req, res) => {
  try {
    const trends = await database.getHourlyTrends();
    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('Error en hourly trends:', error);
    res.status(500).json({ error: 'Error obteniendo tendencias por hora' });
  }
});

// Casos de escalación
app.get('/analytics/escalations', async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  
  try {
    const escalations = await database.getEscalationCases(limit);
    res.json({
      success: true,
      data: escalations
    });
  } catch (error) {
    console.error('Error en escalations:', error);
    res.status(500).json({ error: 'Error obteniendo casos de escalación' });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Bot activo en http://localhost:${process.env.PORT}`);
});

async function generarRespuestaIA(userMessage) {
  // Obtener contexto del dataset de INGELEAN
  const datasetContext = getDatasetContext();

  const prompt = `
    ${datasetContext}
    
    PREGUNTA DEL USUARIO: "${userMessage}"
    
    Responde como el chatbot oficial de INGE LEAN S.A.S. basándote en la información proporcionada.
  `;

  return await askGemini(prompt);
}

/**
 * Genera un prompt contextual incluyendo historial de conversación
 */
function getContextualPrompt(userMessage, userId) {
  const datasetContext = getDatasetContext();
  const conversationContext = getContextForAI(userId);
  
  return `
    ${datasetContext}
    
    ${conversationContext}
    
    MENSAJE ACTUAL DEL USUARIO: "${userMessage}"
    
    INSTRUCCIONES:
    - Responde como el chatbot oficial de INGE LEAN S.A.S.
    - Usa el historial de conversación para dar contexto a tu respuesta
    - Si el usuario se refiere a algo mencionado anteriormente, haz referencia específica
    - Mantén la coherencia con toda la conversación
    - Si el usuario cambió de tema, adapta naturalmente
  `;
}
