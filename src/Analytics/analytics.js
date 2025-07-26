import { cargarDB } from '../Database/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta para almacenar logs de conversaciones
const logsPath = path.join(__dirname, '../../logs');
const conversationsPath = path.join(logsPath, 'conversations.json');

// Crear directorio de logs si no existe
if (!fs.existsSync(logsPath)) {
    fs.mkdirSync(logsPath, { recursive: true });
}

// Crear archivo de conversaciones si no existe
if (!fs.existsSync(conversationsPath)) {
    fs.writeFileSync(conversationsPath, JSON.stringify({ conversations: [] }, null, 2));
}

// Función para cargar conversaciones
export const cargarConversaciones = () => {
    try {
        if (!fs.existsSync(conversationsPath)) {
            return { conversations: [] };
        }
        const data = fs.readFileSync(conversationsPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error cargando conversaciones:', error);
        return { conversations: [] };
    }
};

// Función para guardar conversaciones
export const guardarConversaciones = (data) => {
    try {
        fs.writeFileSync(conversationsPath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error guardando conversaciones:', error);
    }
};

// Función para registrar una nueva conversación
export const registrarConversacion = (chatId, userMessage, botResponse) => {
    const conversaciones = cargarConversaciones();
    const timestamp = new Date();
    
    // Análisis básico de sentimiento (puedes mejorarlo con IA)
    const sentiment = analizarSentimiento(userMessage);
    const emotion = analizarEmocion(userMessage);
    const intent = extraerIntent(userMessage);
    
    // Lógica mejorada para detectar escalaciones
    const escalated = detectarEscalacion(userMessage, sentiment, emotion);
    
    const conversacion = {
        id: `${chatId}_${timestamp.getTime()}`,
        chatId,
        timestamp: timestamp.toISOString(),
        userMessage,
        botResponse,
        sentiment,
        emotion,
        intent,
        responseTime: Math.random() * 2000 + 500, // Simular tiempo de respuesta
        resolved: !userMessage.includes('problema') && !userMessage.includes('error'),
        escalated: escalated
    };
    
    conversaciones.conversations.push(conversacion);
    
    // Mantener solo los últimos 1000 registros para optimizar
    if (conversaciones.conversations.length > 1000) {
        conversaciones.conversations = conversaciones.conversations.slice(-1000);
    }
    
    guardarConversaciones(conversaciones);
    return conversacion;
};

// Función para detectar escalaciones
function detectarEscalacion(mensaje, sentiment, emotion) {
    const mensajeLower = mensaje.toLowerCase();
    
    // Palabras clave que indican escalación
    const palabrasEscalacion = [
        'urgente', 'supervisor', 'gerente', 'jefe', 'hablar con alguien',
        'frustrado', 'molesto', 'enojado', 'cansado', 'harto',
        'esperando', 'llevo', 'desde ayer', 'hace tiempo', 'mucho tiempo',
        'no funciona', 'no sirve', 'terrible', 'horrible', 'pésimo',
        'queja', 'reclamo', 'demanda', 'problema serio', 'emergencia',
        'inmediatamente', 'ya', 'ahora mismo', 'no puede ser',
        'inaceptable', 'ridículo', 'absurdo', 'increíble'
    ];
    
    // Frases que indican escalación
    const frasesEscalacion = [
        'no me han respondido',
        'llevo esperando',
        'desde ayer',
        'hace días',
        'no es posible',
        'esto es el colmo',
        'no aguanto más',
        'hablar con un humano',
        'atención al cliente',
        'servicio terrible',
        'muy mal servicio',
        'esto no puede seguir así'
    ];
    
    // Verificar palabras clave
    const tienepalabraEscalacion = palabrasEscalacion.some(palabra => 
        mensajeLower.includes(palabra)
    );
    
    // Verificar frases
    const tieneFraseEscalacion = frasesEscalacion.some(frase => 
        mensajeLower.includes(frase)
    );
    
    // Escalación por sentimiento negativo + emoción específica
    const escalacionPorSentimiento = sentiment === 'NEGATIVO' && 
        (emotion === 'frustrado' || emotion === 'urgente');
    
    return tienepalabraEscalacion || tieneFraseEscalacion || escalacionPorSentimiento;
}

// Análisis básico de sentimiento
function analizarSentimiento(mensaje) {
    const mensajeLower = mensaje.toLowerCase();
    
    const palabrasPositivas = ['gracias', 'excelente', 'perfecto', 'bien', 'bueno', 'genial', 'fantástico'];
    const palabrasNegativas = ['problema', 'error', 'mal', 'terrible', 'horrible', 'molesto', 'frustrado', 'enojado', 'cansado', 'harto', 'esperando'];
    
    const positivasCount = palabrasPositivas.filter(word => mensajeLower.includes(word)).length;
    const negativasCount = palabrasNegativas.filter(word => mensajeLower.includes(word)).length;
    
    if (positivasCount > negativasCount) return 'POSITIVO';
    if (negativasCount > positivasCount) return 'NEGATIVO';
    return 'NEUTRAL';
}

// Análisis básico de emoción
function analizarEmocion(mensaje) {
    const mensajeLower = mensaje.toLowerCase();
    
    // Frustración
    if (mensajeLower.includes('frustrado') || 
        mensajeLower.includes('molesto') || 
        mensajeLower.includes('enojado') ||
        mensajeLower.includes('cansado') ||
        mensajeLower.includes('harto') ||
        mensajeLower.includes('esperando') ||
        mensajeLower.includes('llevo') ||
        mensajeLower.includes('desde ayer')) return 'frustrado';
    
    // Urgencia
    if (mensajeLower.includes('urgente') || 
        mensajeLower.includes('rápido') ||
        mensajeLower.includes('inmediatamente') ||
        mensajeLower.includes('ahora') ||
        mensajeLower.includes('ya')) return 'urgente';
        
    // Confusión
    if (mensajeLower.includes('confundido') || 
        mensajeLower.includes('no entiendo') ||
        mensajeLower.includes('no comprendo')) return 'confundido';
        
    // Felicidad
    if (mensajeLower.includes('feliz') || 
        mensajeLower.includes('contento') ||
        mensajeLower.includes('gracias') ||
        mensajeLower.includes('excelente')) return 'feliz';
    
    return 'neutral';
}

// Extracción básica de intención
function extraerIntent(mensaje) {
    const mensajeLower = mensaje.toLowerCase();
    
    if (mensajeLower.includes('servicios') || mensajeLower.includes('que ofrecen')) return 'consulta_servicios';
    if (mensajeLower.includes('cotización') || mensajeLower.includes('precio')) return 'solicitud_cotizacion';
    if (mensajeLower.includes('contacto') || mensajeLower.includes('teléfono')) return 'informacion_contacto';
    if (mensajeLower.includes('ubicación') || mensajeLower.includes('dirección')) return 'consulta_ubicacion';
    if (mensajeLower.includes('software') || mensajeLower.includes('desarrollo')) return 'consulta_software';
    if (mensajeLower.includes('automatización') || mensajeLower.includes('industrial')) return 'consulta_automatizacion';
    if (mensajeLower.includes('inteligencia artificial') || mensajeLower.includes('ia')) return 'consulta_ia';
    if (mensajeLower.includes('mantenimiento')) return 'consulta_mantenimiento';
    if (mensajeLower.includes('hardware')) return 'consulta_hardware';
    
    return 'consulta_general';
}

// Analytics - Overview general
export const getOverview = () => {
    const conversaciones = cargarConversaciones();
    
    const ahora = new Date();
    const hace24h = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);
    const hace7dias = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Filtrar conversaciones de las últimas 24h
    const conversaciones24h = conversaciones.conversations.filter(conv => 
        new Date(conv.timestamp) >= hace24h
    );
    
    // Usuarios únicos
    const usuariosUnicos = new Set(conversaciones.conversations.map(conv => conv.chatId)).size;
    
    // Escalaciones pendientes
    const escalacionesPendientes = conversaciones.conversations.filter(conv => 
        conv.escalated && new Date(conv.timestamp) >= hace7dias
    ).length;
    
    // Top intents
    const intentCounts = {};
    conversaciones.conversations.forEach(conv => {
        intentCounts[conv.intent] = (intentCounts[conv.intent] || 0) + 1;
    });
    
    const topIntents = Object.entries(intentCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([intent, count]) => ({ intent, count }));
    
    // Sentimientos del día
    const hoy = conversaciones24h.reduce((acc, conv) => {
        acc.total_messages++;
        if (conv.sentiment === 'POSITIVO') acc.positive_sentiment++;
        if (conv.sentiment === 'NEGATIVO') acc.negative_sentiment++;
        if (conv.sentiment === 'NEUTRAL') acc.neutral_sentiment++;
        return acc;
    }, { total_messages: 0, positive_sentiment: 0, negative_sentiment: 0, neutral_sentiment: 0 });
    
    // Conversaciones resueltas
    const conversacionesResueltas = conversaciones.conversations.filter(conv => conv.resolved).length;
    const tasaResolucion = conversaciones.conversations.length > 0 
        ? Math.round((conversacionesResueltas / conversaciones.conversations.length) * 100)
        : 0;
    
    // Tiempo promedio de respuesta
    const tiemposRespuesta = conversaciones.conversations
        .filter(conv => conv.responseTime)
        .map(conv => conv.responseTime);
    const tiempoPromedioRespuesta = tiemposRespuesta.length > 0
        ? Math.round(tiemposRespuesta.reduce((a, b) => a + b, 0) / tiemposRespuesta.length)
        : 0;
    
    return {
        messages24h: conversaciones24h.length,
        totalUsers: usuariosUnicos,
        pendingEscalations: escalacionesPendientes,
        topIntents,
        today: hoy,
        totalConversations: conversaciones.conversations.length,
        resolutionRate: tasaResolucion,
        avgResponseTime: tiempoPromedioRespuesta
    };
};

// Analytics - Distribución de sentimientos por día
export const getSentimentDistribution = (days = 7) => {
    const conversaciones = cargarConversaciones();
    const ahora = new Date();
    
    const resultado = [];
    
    for (let i = days - 1; i >= 0; i--) {
        const fecha = new Date(ahora.getTime() - i * 24 * 60 * 60 * 1000);
        const fechaStr = fecha.toISOString().split('T')[0];
        
        const conversacionesDia = conversaciones.conversations.filter(conv => {
            const convFecha = new Date(conv.timestamp).toISOString().split('T')[0];
            return convFecha === fechaStr;
        });
        
        const sentimientos = conversacionesDia.reduce((acc, conv) => {
            if (conv.sentiment === 'POSITIVO') acc.positive_sentiment++;
            if (conv.sentiment === 'NEGATIVO') acc.negative_sentiment++;
            if (conv.sentiment === 'NEUTRAL') acc.neutral_sentiment++;
            acc.total_messages++;
            return acc;
        }, { positive_sentiment: 0, negative_sentiment: 0, neutral_sentiment: 0, total_messages: 0 });
        
        resultado.push({
            date: fechaStr,
            ...sentimientos
        });
    }
    
    return resultado;
};

// Analytics - Tendencias por hora
export const getHourlyTrends = () => {
    const conversaciones = cargarConversaciones();
    const ahora = new Date();
    const hace24h = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);
    
    const conversaciones24h = conversaciones.conversations.filter(conv => 
        new Date(conv.timestamp) >= hace24h
    );
    
    const hourCounts = {};
    
    conversaciones24h.forEach(conv => {
        const hora = new Date(conv.timestamp).getHours().toString().padStart(2, '0');
        hourCounts[hora] = (hourCounts[hora] || 0) + 1;
    });
    
    // Generar array con todas las horas (0-23)
    const resultado = Array.from({ length: 24 }, (_, i) => {
        const hora = i.toString().padStart(2, '0');
        return {
            hour: hora,
            message_count: hourCounts[hora] || 0
        };
    });
    
    return resultado;
};

// Analytics - Escalaciones recientes
export const getEscalations = (limit = 10) => {
    const conversaciones = cargarConversaciones();
    
    const escalaciones = conversaciones.conversations
        .filter(conv => conv.escalated)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit)
        .map(conv => ({
            user_id: `Usuario_${conv.chatId.toString().slice(-4)}`,
            timestamp: conv.timestamp,
            message: conv.userMessage,
            sentiment: conv.sentiment,
            emotion: conv.emotion,
            channel: 'Telegram',
            resolved: conv.resolved
        }));
    
    return escalaciones;
};

// Analytics - Métricas en tiempo real
export const getRealtimeMetrics = () => {
    const conversaciones = cargarConversaciones();
    const ahora = new Date();
    const hace5min = new Date(ahora.getTime() - 5 * 60 * 1000);
    
    const conversaciones5min = conversaciones.conversations.filter(conv => 
        new Date(conv.timestamp) >= hace5min
    );
    
    const usuariosActivos = new Set(conversaciones5min.map(conv => conv.chatId)).size;
    
    return {
        activeUsers: usuariosActivos,
        messagesLast5Min: conversaciones5min.length,
        serverStatus: 'online',
        lastUpdate: ahora.toISOString()
    };
};
