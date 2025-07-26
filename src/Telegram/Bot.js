import TelegramBot from 'node-telegram-bot-api';
import { askGemini } from '../IA/gemini.js';

const sesiones = new Map();

export const IniciarChatbot = (telegramToken) => {
  const bot = new TelegramBot(telegramToken, { polling: true });

  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userMessage = msg.text;

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
      const answer = await askGemini(promptConHistorial);
      sesion.historial.push({ rol: 'bot', mensaje: answer });

      bot.sendMessage(chatId, answer);

      //   sesiones.delete(chatId);
    } catch (error) {
      bot.sendMessage(chatId, '⚠️ Error procesando tu solicitud.');
      console.error(error);
    }
  });
};
