import { Router } from 'express';
import { cargarDB } from '../Database/db.js';
import analyticsRouter from './analyticsRoutes.js';
import { askGemini } from '../IA/gemini.js';
import { registrarConversacion } from '../Analytics/analytics.js';

const router = Router();

router.get('/', (req, res) => {
    res.json('El chatbot está activo.');
});

router.get('/citas', (req, res) => {
  const db = cargarDB();
  res.json(db.citas);
});

// Endpoint para simular conversación del chatbot
router.post('/chat', async (req, res) => {
  try {
    const { message, userId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Se requiere el campo "message"' });
    }

    const chatId = userId || `cmd_${Date.now()}`;
    
    // Usar el mismo prompt que el bot real
    const prompt = `
    Eres un chatbot inteligente de atención al cliente para INGE LEAN S.A.S., una empresa colombiana especializada en desarrollo de software a medida, automatización industrial, diseño de hardware, mantenimiento técnico e inteligencia artificial aplicada a procesos empresariales. Tu objetivo es brindar respuestas claras, útiles y amables a los usuarios que escriben por este canal.

    Mensaje del usuario: "${message}"

    Responde de forma clara, amable y profesional. Usa emojis relacionados según el tema.
    `;

    const botResponse = await askGemini(prompt);
    
    // Registrar la conversación en analytics
    registrarConversacion(chatId, message, botResponse);
    
    res.json({
      success: true,
      data: {
        userId: chatId,
        userMessage: message,
        botResponse,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error en /chat:', error);
    res.status(500).json({
      success: false,
      error: 'Error al procesar el mensaje'
    });
  }
});

// Rutas de analytics
router.use('/analytics', analyticsRouter);

export default router;
