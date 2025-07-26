import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar el dataset de INGELEAN
let dataset = [];

try {
  const datasetPath = join(__dirname, '..', 'dataset_ingelean_chatbot.json');
  const rawData = fs.readFileSync(datasetPath, 'utf8');
  dataset = JSON.parse(rawData);
  console.log('Dataset de INGELEAN cargado correctamente');
} catch (error) {
  console.error('Error cargando dataset de INGELEAN:', error.message);
}

/**
 * Busca coincidencias en el dataset basado en la similitud de texto
 * @param {string} userMessage - Mensaje del usuario
 * @returns {object|null} - Intent encontrado o null
 */
export function findIntent(userMessage) {
  if (!userMessage || dataset.length === 0) return null;
  
  const message = userMessage.toLowerCase().trim();
  
  // Palabras clave por intent para mejor matching
  const keywords = {
    servicios: ['servicio', 'ofrece', 'hace', 'ingelean', 'programa', 'software', 'tecnologia'],
    cobertura_geografica: ['fuera', 'ciudad', 'bogota', 'medellin', 'pereira', 'nacional', 'distancia'],
    cotizacion: ['cotizacion', 'cotizar', 'precio', 'presupuesto', 'cuesta', 'cobran', 'propuesta'],
    ubicacion_atencion: ['oficina', 'ubicado', 'presencial', 'empresa', 'direccion', 'sede', 'visitar'],
    mantenimiento: ['mantenimiento', 'soporte', 'preventivo', 'correctivo', 'revision', 'tecnico'],
    inteligencia_artificial: ['ia', 'inteligencia', 'artificial', 'implementar', 'patrones', 'predictivo'],
    automatizacion: ['automatizar', 'procesos', 'produccion', 'planta', 'fabrica', 'industrial'],
    tiempo_respuesta_soporte: ['demoran', 'tiempo', 'respuesta', 'rapido', 'contestan', 'prioritario'],
    planes_suscripcion: ['planes', 'mensual', 'suscripcion', 'continuo', 'recurrente', 'monitoreo'],
    diferencia_empresa: ['elegir', 'diferente', 'ventaja', 'mejor', 'destaca', 'especial', 'competencia']
  };

  // 1. Buscar coincidencia exacta en frases
  for (const intent of dataset) {
    for (const phrase of intent.phrases) {
      const phraseNormalized = phrase.toLowerCase();
      if (message === phraseNormalized) {
        return intent;
      }
    }
  }

  // 2. Buscar coincidencia parcial en frases
  for (const intent of dataset) {
    for (const phrase of intent.phrases) {
      const phraseNormalized = phrase.toLowerCase();
      const messageWords = message.split(' ').filter(word => word.length > 2);
      const phraseWords = phraseNormalized.split(' ').filter(word => word.length > 2);
      
      const matchingWords = messageWords.filter(word => 
        phraseWords.some(phraseWord => 
          phraseWord.includes(word) || word.includes(phraseWord)
        )
      );
      
      // Si al menos 60% de las palabras coinciden
      if (matchingWords.length >= Math.ceil(messageWords.length * 0.6) && matchingWords.length >= 2) {
        return intent;
      }
    }
  }

  // 3. Buscar por palabras clave específicas
  for (const intent of dataset) {
    const intentKeywords = keywords[intent.intent] || [];
    const messageWords = message.split(' ');
    
    const keywordMatches = intentKeywords.filter(keyword => 
      messageWords.some(word => word.includes(keyword) || keyword.includes(word))
    );
    
    // Si encuentra al menos 2 palabras clave o 1 palabra clave muy específica
    if (keywordMatches.length >= 2 || 
        (keywordMatches.length >= 1 && ['ingelean', 'cotizacion', 'automatizacion'].includes(keywordMatches[0]))) {
      return intent;
    }
  }
  
  return null;
}

/**
 * Obtiene el contexto completo optimizado para la IA
 * @returns {string} - Contexto formateado para Gemini
 */
export function getDatasetContext() {
  if (dataset.length === 0) return '';
  
  return `
Eres un chatbot inteligente de atención al cliente para INGE LEAN S.A.S., una empresa colombiana especializada en desarrollo de software a medida, automatización industrial, diseño de hardware, mantenimiento técnico e inteligencia artificial aplicada a procesos empresariales. 

Tu objetivo es brindar respuestas claras, útiles y amables a los usuarios que escriben por este canal. Siempre debes mantener un tono profesional, cercano y resolutivo. Si una solicitud requiere atención personalizada, invita al usuario a dejar sus datos para que un asesor humano lo contacte. Estás disponible 24/7 y puedes responder preguntas frecuentes, recibir solicitudes de cotización y orientar sobre los servicios de la empresa.

📌 INFORMACIÓN OFICIAL DE INGE LEAN S.A.S.:

${dataset.map(intent => `
${intent.response}
`).join('\n')}

🎯 INSTRUCCIONES ESPECÍFICAS:
- Mantén un tono profesional, cercano y resolutivo
- Si no tienes información específica, invita al usuario a contactar directamente
- Para cotizaciones o consultas complejas, solicita datos de contacto
- Siempre menciona que pueden escribir a contacto@ingelean.com
- Enfócate únicamente en los servicios de INGE LEAN S.A.S.
- Si la pregunta no está relacionada con la empresa, redirige amablemente

✉️ CONTACTO: contacto@ingelean.com | Pereira, Risaralda, Colombia
`;
}

/**
 * Obtiene todos los intents disponibles
 * @returns {Array} - Lista de intents
 */
export function getAllIntents() {
  return dataset.map(item => ({
    intent: item.intent,
    phrases: item.phrases.length,
    response: item.response.substring(0, 50) + '...'
  }));
}
