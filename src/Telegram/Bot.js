import TelegramBot from 'node-telegram-bot-api';
import { askGemini } from '../IA/gemini.js';
import { registrarConversacion } from '../Analytics/analytics.js';
import { scrapIngeleanWebsite, searchInScrapedData } from '../utils/WebScraper.js';

const sesiones = new Map();
let websiteData = null; // Para almacenar en caché los datos scrapeados

export const IniciarChatbot = (telegramToken) => {
  console.log('🤖 Iniciando bot de Telegram...');
  
  if (!telegramToken) {
    console.error('❌ Token de Telegram no encontrado');
    return;
  }
  
  const bot = new TelegramBot(telegramToken, { polling: true });
  
  console.log('✅ Bot de Telegram iniciado correctamente');

  // Iniciar scraping de la web al iniciar el bot
  (async () => {
    try {
      websiteData = await scrapIngeleanWebsite();
      console.log('🌐 Datos del sitio web cargados correctamente');
    } catch (error) {
      console.error('❌ Error al cargar datos del sitio web:', error);
    }
  })();

  // Manejo de errores del bot
  bot.on('polling_error', (error) => {
    console.error('❌ Error de polling:', error);
  });

  bot.on('error', (error) => {
    console.error('❌ Error del bot:', error);
  });

  bot.on('message', async (msg) => {
    console.log('📨 Mensaje recibido:', msg.text);
    console.log('👤 Chat ID:', msg.chat.id);
    console.log('📋 Tipo de mensaje:', msg.chat.type);
    
    const chatId = msg.chat.id;
    const userMessage = msg.text;

    // Verificar que el mensaje no sea nulo o vacío
    if (!userMessage || userMessage.trim() === '') {
      console.log('⚠️ Mensaje vacío o nulo, ignorando...');
      return;
    }

    // Manejar comando /start
    if (userMessage === '/start') {
      const welcomeMessage = `¡Hola! 👋 Soy el asistente virtual de INGE LEAN S.A.S.

🛠️ Somos especialistas en:
• Desarrollo de software a medida
• Automatización industrial  
• Diseño de hardware
• Mantenimiento técnico
• Inteligencia artificial

💬 ¿En qué puedo ayudarte hoy?

También puedes consultarme información actualizada sobre nuestra empresa utilizando estos comandos:
• /servicios - Ver nuestros servicios
• /proyectos - Conocer nuestro portafolio de proyectos
• /contacto - Obtener información de contacto
• /empresa - Conocer más sobre INGE LEAN`;
      
      try {
        await bot.sendMessage(chatId, welcomeMessage);
        console.log('✅ Mensaje de bienvenida enviado');
        return;
      } catch (error) {
        console.error('❌ Error enviando mensaje de bienvenida:', error);
      }
    }
    
    // Comandos para consultar información del sitio web
    if (userMessage === '/servicios' || userMessage === '/contacto' || userMessage === '/empresa' || userMessage === '/proyectos' || 
        userMessage.toLowerCase().includes('web') || userMessage.toLowerCase().includes('página') || 
        userMessage.toLowerCase().includes('sitio') || userMessage.toLowerCase().includes('ingelean.com') ||
        userMessage.toLowerCase().includes('proyectos')) {
      
      try {
        console.log('🌐 Procesando consulta sobre el sitio web...');
        let responseMessage = '';
        
        // Si no tenemos datos scrapeados o queremos actualizarlos
        if (!websiteData || userMessage.toLowerCase().includes('actualiza')) {
          await bot.sendMessage(chatId, '🔄 Obteniendo información actualizada del sitio web...');
          websiteData = await scrapIngeleanWebsite();
          responseMessage = '✅ Información actualizada correctamente.\n\n';
        }
        
        if (userMessage === '/servicios') {
          responseMessage += searchInScrapedData(websiteData, 'servicios');
        } else if (userMessage === '/contacto') {
          responseMessage += searchInScrapedData(websiteData, 'contacto');
        } else if (userMessage === '/empresa') {
          responseMessage += searchInScrapedData(websiteData, 'empresa');
        } else if (userMessage === '/proyectos' || userMessage.toLowerCase().includes('proyecto')) {
          responseMessage += searchInScrapedData(websiteData, 'proyectos');
        } else {
          // Consulta personalizada sobre el sitio web
          responseMessage += searchInScrapedData(websiteData, userMessage);
        }
        
        // Dividir mensajes largos (límite de Telegram: 4096 caracteres)
        if (responseMessage.length > 4000) {
          console.log('⚠️ Respuesta demasiado larga, dividiendo en partes...');
          
          // Dividir en párrafos
          const paragraphs = responseMessage.split('\n\n');
          let currentMessage = '';
          
          for (const paragraph of paragraphs) {
            // Si agregar este párrafo haría que el mensaje supere el límite
            if (currentMessage.length + paragraph.length + 2 > 4000) {
              // Enviar el mensaje actual
              await bot.sendMessage(chatId, currentMessage);
              currentMessage = paragraph + '\n\n';
            } else {
              // Agregar el párrafo al mensaje actual
              currentMessage += paragraph + '\n\n';
            }
          }
          
          // Enviar el último mensaje si queda algo
          if (currentMessage.trim()) {
            await bot.sendMessage(chatId, currentMessage.trim());
          }
        } else {
          await bot.sendMessage(chatId, responseMessage || 'No se encontró información específica sobre esa consulta en el sitio web.');
        }
        
        // Registrar la conversación para analytics
        registrarConversacion(chatId, userMessage, responseMessage);
        
        return;
      } catch (error) {
        console.error('❌ Error procesando consulta del sitio web:', error);
        await bot.sendMessage(chatId, '⚠️ Lo siento, hubo un problema al obtener la información del sitio web. Voy a intentar responder con la información que tengo.');
      }
    }

    if (!sesiones.has(chatId)) {
      sesiones.set(chatId, {
        historial: [],
        usuario: {
          nombre: null,
          identificacion: null,
        },
      });
    }

    const sesion = sesiones.get(chatId);

    sesion.historial.push({ rol: 'user', mensaje: userMessage });

    if (userMessage.toLowerCase().includes('mi nombre es')) {
      sesion.paciente = userMessage.split('mi nombre es')[1].trim();
    }

    sesiones.set(chatId, sesion);

    const ultimosMensajes = sesion.historial.slice(-5);
    const historialTexto = ultimosMensajes
      .map((m) => `${m.rol === 'user' ? 'Usuario' : 'Asistente'}: ${m.mensaje}`)
      .join('\n');

    const prompt = `
    Eres un chatbot inteligente de atención al cliente para INGE LEAN S.A.S., una empresa colombiana especializada en desarrollo de software a medida, automatización industrial, diseño de hardware, mantenimiento técnico e inteligencia artificial aplicada a procesos empresariales. Tu objetivo es brindar respuestas claras, útiles y amables a los usuarios que escriben por este canal. Siempre debes mantener un tono profesional, cercano y resolutivo. Si una solicitud requiere atención personalizada, invita al usuario a dejar sus datos para que un asesor humano lo contacte. Estás disponible 24/7 y puedes responder preguntas frecuentes, recibir solicitudes de cotización y orientar sobre los servicios de la empresa.

    📌 10 Preguntas Frecuentes (FAQs) para el Chatbot
    ¿Qué servicios ofrece INGE LEAN S.A.S.?
    Ofrecemos desarrollo de software a medida, automatización industrial, diseño e implementación de hardware, mantenimiento técnico especializado e inteligencia artificial aplicada a procesos empresariales.

    ¿Atienden empresas fuera del Eje Cafetero?
    Sí, brindamos atención a nivel nacional y podemos coordinar proyectos a distancia o con visitas programadas.

    ¿Cómo puedo solicitar una cotización para un proyecto?
    Escríbenos por este chat con tus datos de contacto y una breve descripción de tu necesidad. Un asesor te contactará en menos de 24 horas hábiles.

    ¿Tienen atención presencial? ¿Dónde están ubicados?
    Sí, puedes visitarnos en Pereira, Risaralda. Te recomendamos agendar cita previa escribiendo a contacto@ingelean.com o por este canal.

    ¿Qué tipo de mantenimiento ofrecen?
    Realizamos mantenimiento preventivo y correctivo en sistemas industriales, equipos tecnológicos y software, además de auditorías técnicas.

    ¿Pueden integrar inteligencia artificial a mis procesos actuales?
    Claro. Evaluamos tus procesos y diseñamos soluciones con IA como reconocimiento de patrones, automatización inteligente o análisis predictivo.

    ¿Pueden automatizar procesos en mi planta o fábrica?
    Sí. Nos especializamos en automatización industrial para mejorar eficiencia, reducir errores y optimizar tiempos de producción.

    ¿Cuál es el tiempo de respuesta promedio para soporte técnico?
    Entre 4 y 8 horas hábiles, dependiendo de la complejidad. También ofrecemos planes con atención prioritaria.

    ¿Puedo contratar sus servicios por suscripción o mensualidad?
    Sí. Tenemos planes personalizados de soporte, mantenimiento y monitoreo continuo adaptados a tu empresa.

    ¿Qué diferencia a INGE LEAN de otras empresas similares?
    Nos destacamos por soluciones personalizadas, atención cercana, experiencia en ingeniería y uso de tecnología de vanguardia.
  `;

    const promptConHistorial = `${prompt}
      Eres un chatbot inteligente de atención al cliente para INGE LEAN S.A.S., una empresa colombiana especializada en:

      🛠️ Desarrollo de software a medida  
      ⚙️ Automatización industrial  
      💻 Diseño de hardware  
      🔧 Mantenimiento técnico  
      🤖 Inteligencia artificial aplicada a procesos empresariales

      Tu función es brindar respuestas claras, útiles, empáticas y profesionales. Estás disponible 24/7 para resolver dudas, orientar y guiar al usuario.

      Puedes utilizar la siguiente web para asesorar a los usuarios con respecto a ingelean: https://ingelean.com/

      Identifica las emociones de las personas y adapta tus respuestas en base a eso

      📌 Preguntas frecuentes:

      1. ¿Qué servicios ofrece INGE LEAN S.A.S.?  
        Desarrollo de software, automatización industrial, hardware, mantenimiento e inteligencia artificial.

      2. ¿Atienden fuera del Eje Cafetero?  
        Sí, cubrimos todo el país y trabajamos también a distancia.

      3. ¿Cómo solicito una cotización?  
        Pide por este chat dejando tus datos y una breve descripción del proyecto.

      4. ¿Tienen oficina física?  
        Sí, en Pereira, Risaralda. Puedes agendar visita previa.

      5. ¿Qué tipo de mantenimiento ofrecen?  
        Mantenimiento preventivo, correctivo y auditorías técnicas.

      6. ¿Integran inteligencia artificial?  
        Sí, aplicamos IA para optimizar procesos, automatizar tareas o detectar patrones.

      7. ¿Automatizan fábricas o plantas?  
        Sí, nos especializamos en eficiencia operativa con automatización industrial.

      8. ¿Tiempo de respuesta para soporte?  
        De 4 a 8 horas hábiles. Tenemos atención prioritaria.

      9. ¿Tienen planes por suscripción?  
        Sí, adaptados a las necesidades de cada empresa.

      10. ¿Qué los hace diferentes?  
        Soluciones personalizadas, atención cercana y tecnología de vanguardia.

      ---

      📩 Historial reciente con el usuario:
      ${historialTexto}

      📨 Mensaje actual: "${userMessage}"

      🟢 Instrucciones importantes para ti como asistente virtual:

      - Responde de forma clara, amable y profesional.
      - Usa emojis relacionados según el tema (🛠️, 📍, 💬, 🤖, 🕒, etc.).
      - Mantén las respuestas breves y útiles.
      - Usa listas o viñetas si aplican.
      - No repitas información innecesaria.
      - Si no tienes la información, di: “🤔 No tengo esa información aún, pero puedo pedir que un asesor te contacte.”
      - Evita asteriscos, signos innecesarios o formato Markdown.

      Responde ahora al mensaje del usuario con base en lo anterior.
      `;

    try {
      console.log('🤔 Procesando mensaje con Gemini...');
      
      // Si el mensaje contiene referencias a la web de ingelean, intentar actualizar los datos
      if (userMessage.toLowerCase().includes('web') || 
          userMessage.toLowerCase().includes('ingelean.com') || 
          userMessage.toLowerCase().includes('página') ||
          userMessage.toLowerCase().includes('actualiza')) {
        
        if (!websiteData) {
          try {
            console.log('🔄 Actualizando datos del sitio web para la consulta...');
            websiteData = await scrapIngeleanWebsite();
          } catch (webError) {
            console.error('⚠️ No se pudieron obtener datos actualizados del sitio web:', webError);
          }
        }
      }
      
      // Usar los datos del sitio web para enriquecer la respuesta de Gemini
      const answer = await askGemini(promptConHistorial, websiteData);
      sesion.historial.push({ rol: 'bot', mensaje: answer });

      // Registrar la conversación para analytics
      registrarConversacion(chatId, userMessage, answer);

      console.log('📤 Enviando respuesta al usuario...');
      console.log('💬 Respuesta generada:', answer.substring(0, 100) + '...');
      
      // Dividir mensajes largos (límite de Telegram: 4096 caracteres)
      if (answer.length > 4000) {
        console.log('⚠️ Respuesta demasiado larga, dividiendo en partes...');
        
        // Dividir en párrafos primero
        const paragraphs = answer.split('\n\n');
        let currentMessage = '';
        
        for (const paragraph of paragraphs) {
          // Si agregar este párrafo haría que el mensaje supere el límite
          if (currentMessage.length + paragraph.length + 2 > 4000) {
            // Enviar el mensaje actual
            await bot.sendMessage(chatId, currentMessage);
            currentMessage = paragraph + '\n\n';
          } else {
            // Agregar el párrafo al mensaje actual
            currentMessage += paragraph + '\n\n';
          }
        }
        
        // Enviar el último mensaje si queda algo
        if (currentMessage.trim()) {
          await bot.sendMessage(chatId, currentMessage.trim());
        }
        
        console.log('✅ Respuesta dividida enviada exitosamente al chat:', chatId);
      } else {
        // La respuesta cabe en un solo mensaje
        await bot.sendMessage(chatId, answer);
        console.log('✅ Respuesta enviada exitosamente al chat:', chatId);
      }

      //   sesiones.delete(chatId);
    } catch (error) {
      console.error('❌ Error procesando solicitud:', error);
      try {
        await bot.sendMessage(chatId, '⚠️ Error procesando tu solicitud.');
      } catch (sendError) {
        console.error('❌ Error enviando mensaje de error:', sendError);
      }
    }
  });
};
